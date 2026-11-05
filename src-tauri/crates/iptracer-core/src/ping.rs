use std::net::{IpAddr, SocketAddr, ToSocketAddrs};
use std::sync::Arc;
use std::time::Duration;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, watch};
use crate::error::{AppError, AppResult, ErrorCategory, ErrorCode};
use crate::net_traits::{PlatformSocketProvider, ProbeProtocol, RawProbe};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingConfig {
    pub target: String,
    pub interval: Duration,
    pub packet_size: usize,
    pub df_bit: bool,
    pub timeout: Duration,
}

impl Default for PingConfig {
    fn default() -> Self {
        Self {
            target: "1.1.1.1".to_string(),
            interval: Duration::from_millis(1000),
            packet_size: 56,
            df_bit: false,
            timeout: Duration::from_millis(1500),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PingSample {
    pub seq: u32,
    pub ttl: Option<u8>,
    pub rtt_ms: Option<f64>,
    pub status: PingProbeStatus,
    pub timestamp_ms: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum PingProbeStatus {
    Success,
    Timeout,
    HostUnreachable,
    NetUnreachable,
    TtlExpired,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RttStatistics {
    pub min: Option<f64>,
    pub avg: Option<f64>,
    pub max: Option<f64>,
    pub stdev: Option<f64>,
    pub p95: Option<f64>,
    pub p99: Option<f64>,
    pub jitter_ms: Option<f64>,
    pub packets_sent: u32,
    pub packets_received: u32,
    pub packet_loss_percent: f32,
}

/// In-memory RFC 3550 Interarrival Jitter Accumulator
#[derive(Debug, Clone, Default)]
pub struct JitterAccumulator {
    last_transit: Option<f64>,
    jitter: f64,
}

impl JitterAccumulator {
    pub fn new() -> Self {
        Self {
            last_transit: None,
            jitter: 0.0,
        }
    }

    pub fn update(&mut self, current_transit: f64) -> f64 {
        if let Some(prev) = self.last_transit {
            let diff = (current_transit - prev).abs();
            self.jitter += (diff - self.jitter) / 16.0;
        }
        self.last_transit = Some(current_transit);
        self.jitter
    }

    pub fn current(&self) -> f64 {
        self.jitter
    }
}

#[async_trait]
pub trait PingMonitor: Send + Sync {
    async fn start_ping(
        &self,
        config: PingConfig,
        cancel_rx: watch::Receiver<bool>,
    ) -> AppResult<(String, mpsc::Receiver<PingSample>)>;
}

pub struct DefaultPingMonitor {
    socket_provider: Arc<dyn PlatformSocketProvider>,
}

impl DefaultPingMonitor {
    pub fn new(socket_provider: Arc<dyn PlatformSocketProvider>) -> Self {
        Self { socket_provider }
    }
}

#[async_trait]
impl PingMonitor for DefaultPingMonitor {
    async fn start_ping(
        &self,
        config: PingConfig,
        mut cancel_rx: watch::Receiver<bool>,
    ) -> AppResult<(String, mpsc::Receiver<PingSample>)> {
        let target_str = config.target.clone();
        // Resolve target host
        let target_ip = resolve_host(&target_str).await?;
        let target_addr = SocketAddr::new(target_ip, 0);

        let session_id = uuid::Uuid::new_v4().to_string();
        let (sample_tx, sample_rx) = mpsc::channel(256);

        let provider = self.socket_provider.clone();

        tokio::spawn(async move {
            let mut seq = 1u32;
            let mut interval_timer = tokio::time::interval(config.interval);
            // Don't burst missed ticks
            interval_timer.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Delay);

            loop {
                tokio::select! {
                    _ = interval_timer.tick() => {
                        if *cancel_rx.borrow() {
                            break;
                        }

                        let probe = RawProbe {
                            sequence: (seq & 0xffff) as u16,
                            ttl: 64,
                            payload_size: config.packet_size,
                            df_bit: config.df_bit,
                            target: target_addr,
                            protocol: ProbeProtocol::Icmp,
                            timeout: config.timeout,
                        };

                        let sample = match provider.send_icmp_probe(probe).await {
                            Ok(reply) => {
                                let rtt_ms = reply.rtt.as_secs_f64() * 1000.0;
                                let status = if reply.is_destination {
                                    PingProbeStatus::Success
                                } else if reply.is_time_exceeded {
                                    PingProbeStatus::TtlExpired
                                } else {
                                    PingProbeStatus::Success
                                };

                                PingSample {
                                    seq,
                                    ttl: Some(reply.reply_ttl),
                                    rtt_ms: Some(rtt_ms),
                                    status,
                                    timestamp_ms: chrono::Utc::now().timestamp_millis(),
                                }
                            }
                            Err(_) => PingSample {
                                seq,
                                ttl: None,
                                rtt_ms: None,
                                status: PingProbeStatus::Timeout,
                                timestamp_ms: chrono::Utc::now().timestamp_millis(),
                            },
                        };

                        seq += 1;
                        if sample_tx.send(sample).await.is_err() {
                            break;
                        }
                    }
                    _ = cancel_rx.changed() => {
                        if *cancel_rx.borrow() {
                            break;
                        }
                    }
                }
            }
        });

        Ok((session_id, sample_rx))
    }
}

pub fn calculate_statistics(samples: &[PingSample]) -> RttStatistics {
    let mut stats = RttStatistics::default();
    stats.packets_sent = samples.len() as u32;

    let mut valid_rtts: Vec<f64> = samples
        .iter()
        .filter(|s| s.status == PingProbeStatus::Success)
        .filter_map(|s| s.rtt_ms)
        .collect();

    stats.packets_received = valid_rtts.len() as u32;

    if stats.packets_sent > 0 {
        let lost = stats.packets_sent - stats.packets_received;
        stats.packet_loss_percent = (lost as f32 / stats.packets_sent as f32) * 100.0;
    }

    if !valid_rtts.is_empty() {
        valid_rtts.sort_by(|a, b| a.partial_cmp(b).unwrap_or(std::cmp::Ordering::Equal));
        let sum: f64 = valid_rtts.iter().sum();
        let count = valid_rtts.len() as f64;
        let avg = sum / count;

        let min = valid_rtts[0];
        let max = *valid_rtts.last().unwrap();

        let variance = valid_rtts.iter().map(|&x| (x - avg).powi(2)).sum::<f64>() / count;
        let stdev = variance.sqrt();

        let p95_idx = ((valid_rtts.len() as f64 * 0.95).ceil() as usize).saturating_sub(1);
        let p99_idx = ((valid_rtts.len() as f64 * 0.99).ceil() as usize).saturating_sub(1);

        stats.min = Some(min);
        stats.avg = Some(avg);
        stats.max = Some(max);
        stats.stdev = Some(stdev);
        stats.p95 = Some(valid_rtts[p95_idx.min(valid_rtts.len() - 1)]);
        stats.p99 = Some(valid_rtts[p99_idx.min(valid_rtts.len() - 1)]);

        let mut jitter_acc = JitterAccumulator::new();
        for &rtt in &valid_rtts {
            jitter_acc.update(rtt);
        }
        stats.jitter_ms = Some(jitter_acc.current());
    }

    stats
}

async fn resolve_host(host: &str) -> AppResult<IpAddr> {
    if let Ok(ip) = host.parse::<IpAddr>() {
        return Ok(ip);
    }

    let socket_str = format!("{}:0", host);
    let addrs: Vec<SocketAddr> = socket_str.to_socket_addrs().map_err(|e| {
        AppError::new(
            ErrorCode::ERR_DNS_NXDOMAIN,
            ErrorCategory::Resolution,
            format!("Failed to resolve hostname '{}': {}", host, e),
        )
    })?.collect();

    addrs.first().map(|sa| sa.ip()).ok_or_else(|| {
        AppError::new(
            ErrorCode::ERR_DNS_NXDOMAIN,
            ErrorCategory::Resolution,
            format!("Host '{}' resolved to zero IP addresses", host),
        )
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_jitter_accumulator_rfc3550() {
        let mut jitter = JitterAccumulator::new();
        // transit 10ms
        let j1 = jitter.update(10.0);
        assert_eq!(j1, 0.0);

        // transit 26ms (diff = 16) -> jitter = 0 + (16 - 0)/16 = 1.0
        let j2 = jitter.update(26.0);
        assert!((j2 - 1.0).abs() < 1e-4);

        // transit 10ms (diff = 16) -> jitter = 1 + (16 - 1)/16 = 1 + 15/16 = 1.9375
        let j3 = jitter.update(10.0);
        assert!((j3 - 1.9375).abs() < 1e-4);
    }

    #[test]
    fn test_statistics_calculation() {
        let samples = vec![
            PingSample { seq: 1, ttl: Some(56), rtt_ms: Some(10.0), status: PingProbeStatus::Success, timestamp_ms: 100 },
            PingSample { seq: 2, ttl: Some(56), rtt_ms: Some(20.0), status: PingProbeStatus::Success, timestamp_ms: 200 },
            PingSample { seq: 3, ttl: None, rtt_ms: None, status: PingProbeStatus::Timeout, timestamp_ms: 300 },
            PingSample { seq: 4, ttl: Some(56), rtt_ms: Some(30.0), status: PingProbeStatus::Success, timestamp_ms: 400 },
        ];

        let stats = calculate_statistics(&samples);
        assert_eq!(stats.packets_sent, 4);
        assert_eq!(stats.packets_received, 3);
        assert_eq!(stats.packet_loss_percent, 25.0);
        assert_eq!(stats.min, Some(10.0));
        assert_eq!(stats.avg, Some(20.0));
        assert_eq!(stats.max, Some(30.0));
    }
}
