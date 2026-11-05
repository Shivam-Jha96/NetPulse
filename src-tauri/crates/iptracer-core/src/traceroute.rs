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
pub struct TracerouteConfig {
    pub target: String,
    pub max_hops: u8,
    pub timeout: Duration,
    pub probes_per_hop: u8,
    pub is_mtr: bool,
}

impl Default for TracerouteConfig {
    fn default() -> Self {
        Self {
            target: "1.1.1.1".to_string(),
            max_hops: 30,
            timeout: Duration::from_millis(1000),
            probes_per_hop: 3,
            is_mtr: false,
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HopTelemetry {
    pub ttl: u8,
    pub ip: Option<IpAddr>,
    pub hostname: Option<String>,
    pub asn: Option<u32>,
    pub asn_org: Option<String>,
    pub country_code: Option<String>,
    pub city: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub loss_percent: f32,
    pub sent: u32,
    pub received: u32,
    pub rtt_last: Option<f64>,
    pub rtt_avg: Option<f64>,
    pub rtt_best: Option<f64>,
    pub rtt_worst: Option<f64>,
    pub rtt_stdev: Option<f64>,
}

#[async_trait]
pub trait TracerouteEngine: Send + Sync {
    async fn start_trace(
        &self,
        config: TracerouteConfig,
        cancel_rx: watch::Receiver<bool>,
    ) -> AppResult<(String, mpsc::Receiver<HopTelemetry>)>;
}

pub struct DefaultTracerouteEngine {
    socket_provider: Arc<dyn PlatformSocketProvider>,
}

impl DefaultTracerouteEngine {
    pub fn new(socket_provider: Arc<dyn PlatformSocketProvider>) -> Self {
        Self { socket_provider }
    }
}

#[async_trait]
impl TracerouteEngine for DefaultTracerouteEngine {
    async fn start_trace(
        &self,
        config: TracerouteConfig,
        cancel_rx: watch::Receiver<bool>,
    ) -> AppResult<(String, mpsc::Receiver<HopTelemetry>)> {
        let target_str = config.target.clone();
        let target_ip = resolve_host(&target_str).await?;
        let target_addr = SocketAddr::new(target_ip, 0);

        let session_id = uuid::Uuid::new_v4().to_string();
        let (hop_tx, hop_rx) = mpsc::channel(64);
        let provider = self.socket_provider.clone();

        tokio::spawn(async move {
            let max_hops = config.max_hops.clamp(1, 64);
            let probes_per_hop = config.probes_per_hop.clamp(1, 5);

            for ttl in 1..=max_hops {
                if *cancel_rx.borrow() {
                    break;
                }

                let mut rtts: Vec<f64> = Vec::new();
                let mut responder_ip: Option<IpAddr> = None;
                let mut reached_destination = false;

                for probe_seq in 0..probes_per_hop {
                    if *cancel_rx.borrow() {
                        break;
                    }

                    let seq = ((ttl as u16) << 8) | (probe_seq as u16);
                    let raw_probe = RawProbe {
                        sequence: seq,
                        ttl,
                        payload_size: 32,
                        df_bit: true,
                        target: target_addr,
                        protocol: ProbeProtocol::Icmp,
                        timeout: config.timeout,
                    };

                    match provider.send_icmp_probe(raw_probe).await {
                        Ok(reply) => {
                            let ms = reply.rtt.as_secs_f64() * 1000.0;
                            rtts.push(ms);
                            responder_ip = Some(reply.responder_ip);
                            if reply.is_destination || reply.responder_ip == target_ip {
                                reached_destination = true;
                            }
                        }
                        Err(_) => {
                            // Probe timeout or packet dropped
                        }
                    }
                }

                let sent = probes_per_hop as u32;
                let received = rtts.len() as u32;
                let loss_percent = if sent > 0 {
                    ((sent - received) as f32 / sent as f32) * 100.0
                } else {
                    100.0
                };

                let (rtt_last, rtt_avg, rtt_best, rtt_worst, rtt_stdev) = if !rtts.is_empty() {
                    let last = *rtts.last().unwrap();
                    let best = rtts.iter().cloned().fold(f64::INFINITY, f64::min);
                    let worst = rtts.iter().cloned().fold(f64::NEG_INFINITY, f64::max);
                    let avg = rtts.iter().sum::<f64>() / rtts.len() as f64;
                    let variance = rtts.iter().map(|&x| (x - avg).powi(2)).sum::<f64>() / rtts.len() as f64;
                    (Some(last), Some(avg), Some(best), Some(worst), Some(variance.sqrt()))
                } else {
                    (None, None, None, None, None)
                };

                // Best-effort reverse DNS hostname
                let hostname = if let Some(ip) = responder_ip {
                    resolve_reverse_dns(ip).await
                } else {
                    None
                };

                let hop = HopTelemetry {
                    ttl,
                    ip: responder_ip,
                    hostname,
                    asn: None,
                    asn_org: None,
                    country_code: None,
                    city: None,
                    latitude: None,
                    longitude: None,
                    loss_percent,
                    sent,
                    received,
                    rtt_last,
                    rtt_avg,
                    rtt_best,
                    rtt_worst,
                    rtt_stdev,
                };

                if hop_tx.send(hop).await.is_err() {
                    break;
                }

                if reached_destination {
                    break;
                }
            }
        });

        Ok((session_id, hop_rx))
    }
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

async fn resolve_reverse_dns(ip: IpAddr) -> Option<String> {
    crate::dns::resolve_ptr(ip).await
}
