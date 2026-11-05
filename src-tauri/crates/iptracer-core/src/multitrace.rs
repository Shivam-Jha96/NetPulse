use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use tokio::sync::{mpsc, watch};

use crate::error::{AppError, AppResult, ErrorCategory, ErrorCode};
use crate::storage::VaultDatabase;
use crate::traceroute::{HopTelemetry, TracerouteConfig, TracerouteEngine};

pub const MAX_MULTITRACE_TARGETS: usize = 8;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum DeviationType {
    HopAdded,
    HopRemoved,
    IpMismatch,
    AsnShift,
    LatencyAnomaly,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RouteDeviation {
    pub hop_number: u8,
    pub baseline_ip: Option<String>,
    pub current_ip: Option<String>,
    pub baseline_asn: Option<u32>,
    pub current_asn: Option<u32>,
    pub deviation_type: DeviationType,
    pub description: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiTraceConfig {
    pub targets: Vec<String>,
    pub max_hops: Option<u8>,
    pub timeout_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct HistoricalPathRecord {
    pub target: String,
    pub recorded_at: String,
    pub total_hops: usize,
    pub hops: Vec<HopTelemetry>,
    pub is_baseline: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TargetTraceProgress {
    pub target: String,
    pub current_hop: u8,
    pub max_hops: u8,
    pub hops: Vec<HopTelemetry>,
    pub completed: bool,
    pub error: Option<String>,
    pub deviations: Vec<RouteDeviation>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum MultiTraceEvent {
    #[serde(rename = "progress")]
    Progress(TargetTraceProgress),
    #[serde(rename = "completed")]
    Completed(MultiTraceResult),
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MultiTraceResult {
    pub session_id: String,
    pub timestamp: i64,
    pub targets: Vec<TargetTraceProgress>,
    pub total_deviations: usize,
}

pub struct MultiTraceEngine {
    traceroute_engine: Arc<dyn TracerouteEngine>,
    vault: Arc<VaultDatabase>,
}

impl MultiTraceEngine {
    pub fn new(traceroute_engine: Arc<dyn TracerouteEngine>, vault: Arc<VaultDatabase>) -> Self {
        Self {
            traceroute_engine,
            vault,
        }
    }

    /// Validates and trims target list to up to MAX_MULTITRACE_TARGETS (8)
    pub fn sanitize_targets(targets: Vec<String>) -> Vec<String> {
        let mut cleaned = Vec::new();
        for t in targets {
            let trimmed = t.trim().to_string();
            if !trimmed.is_empty() && !cleaned.contains(&trimmed) {
                cleaned.push(trimmed);
            }
            if cleaned.len() >= MAX_MULTITRACE_TARGETS {
                break;
            }
        }
        cleaned
    }

    pub async fn run_multitrace(
        &self,
        config: MultiTraceConfig,
        progress_tx: Option<mpsc::Sender<MultiTraceEvent>>,
    ) -> AppResult<MultiTraceResult> {
        let targets = Self::sanitize_targets(config.targets);
        if targets.is_empty() {
            return Err(AppError::new(
                ErrorCode::ERR_INVALID_TARGET,
                ErrorCategory::Validation,
                "Multi-trace requires at least one target (up to 8 targets max)",
            ));
        }

        let session_id = format!("mtrace-{}", uuid::Uuid::new_v4());
        let max_hops = config.max_hops.unwrap_or(30).clamp(1, 64);
        let timeout_ms = config.timeout_ms.unwrap_or(1000).clamp(200, 5000);

        let mut trace_handles = Vec::new();

        for target in targets {
            let engine = self.traceroute_engine.clone();
            let tx = progress_tx.clone();
            let vault = self.vault.clone();

            trace_handles.push(tokio::spawn(async move {
                Self::trace_single_target(engine, vault, target, max_hops, timeout_ms, tx).await
            }));
        }

        let mut target_progresses = Vec::new();
        let mut total_deviations = 0;

        for handle in trace_handles {
            match handle.await {
                Ok(progress) => {
                    total_deviations += progress.deviations.len();
                    target_progresses.push(progress);
                }
                Err(e) => {
                    target_progresses.push(TargetTraceProgress {
                        target: "Unknown".to_string(),
                        current_hop: 0,
                        max_hops,
                        hops: Vec::new(),
                        completed: true,
                        error: Some(e.to_string()),
                        deviations: Vec::new(),
                    });
                }
            }
        }

        let final_result = MultiTraceResult {
            session_id,
            timestamp: chrono::Utc::now().timestamp_millis(),
            targets: target_progresses,
            total_deviations,
        };

        if let Some(ref tx) = progress_tx {
            let _ = tx.send(MultiTraceEvent::Completed(final_result.clone())).await;
        }

        Ok(final_result)
    }

    async fn trace_single_target(
        engine: Arc<dyn TracerouteEngine>,
        vault: Arc<VaultDatabase>,
        target: String,
        max_hops: u8,
        timeout_ms: u64,
        progress_tx: Option<mpsc::Sender<MultiTraceEvent>>,
    ) -> TargetTraceProgress {
        let (_cancel_tx, cancel_rx) = watch::channel(false);
        let trace_cfg = TracerouteConfig {
            target: target.clone(),
            max_hops,
            timeout: Duration::from_millis(timeout_ms),
            probes_per_hop: 1,
            is_mtr: false,
        };

        let trace_outcome = engine.start_trace(trace_cfg, cancel_rx).await;

        let mut collected_hops = Vec::new();
        let mut error_msg = None;

        match trace_outcome {
            Ok((_sid, mut hop_rx)) => {
                while let Some(hop) = hop_rx.recv().await {
                    collected_hops.push(hop.clone());

                    if let Some(ref tx) = progress_tx {
                        let progress_evt = TargetTraceProgress {
                            target: target.clone(),
                            current_hop: hop.ttl,
                            max_hops,
                            hops: collected_hops.clone(),
                            completed: false,
                            error: None,
                            deviations: Vec::new(),
                        };
                        let _ = tx.send(MultiTraceEvent::Progress(progress_evt)).await;
                    }
                }
            }
            Err(err) => {
                error_msg = Some(err.message);
            }
        }

        // Compare against SQLite baseline
        let deviations = Self::detect_deviations(&vault, &target, &collected_hops);

        // Save current run into Vault
        let _ = Self::save_historical_path(&vault, &target, &collected_hops, deviations.is_empty());

        let final_progress = TargetTraceProgress {
            target,
            current_hop: collected_hops.last().map(|h| h.ttl).unwrap_or(0),
            max_hops,
            hops: collected_hops,
            completed: true,
            error: error_msg,
            deviations,
        };

        if let Some(ref tx) = progress_tx {
            let _ = tx.send(MultiTraceEvent::Progress(final_progress.clone())).await;
        }

        final_progress
    }

    pub fn detect_deviations(
        vault: &VaultDatabase,
        target: &str,
        current_hops: &[HopTelemetry],
    ) -> Vec<RouteDeviation> {
        let mut deviations = Vec::new();

        // Load baseline from history
        let baseline = match Self::get_baseline_path(vault, target) {
            Ok(Some(base)) => base,
            _ => return deviations, // First run becomes initial baseline
        };

        let base_map: HashMap<u8, &HopTelemetry> = baseline.hops.iter().map(|h| (h.ttl, h)).collect();
        let curr_map: HashMap<u8, &HopTelemetry> = current_hops.iter().map(|h| (h.ttl, h)).collect();

        for curr_hop in current_hops {
            if let Some(base_hop) = base_map.get(&curr_hop.ttl) {
                // Check IP match
                let base_ip_str = base_hop.ip.map(|i| i.to_string());
                let curr_ip_str = curr_hop.ip.map(|i| i.to_string());

                if base_ip_str.is_some() && curr_ip_str.is_some() && base_ip_str != curr_ip_str {
                    deviations.push(RouteDeviation {
                        hop_number: curr_hop.ttl,
                        baseline_ip: base_ip_str.clone(),
                        current_ip: curr_ip_str.clone(),
                        baseline_asn: base_hop.asn,
                        current_asn: curr_hop.asn,
                        deviation_type: DeviationType::IpMismatch,
                        description: format!(
                            "Hop {} path shift: was {} ({:?}), now {} ({:?})",
                            curr_hop.ttl,
                            base_ip_str.as_deref().unwrap_or("*"),
                            base_hop.asn,
                            curr_ip_str.as_deref().unwrap_or("*"),
                            curr_hop.asn
                        ),
                    });
                } else if base_hop.asn != curr_hop.asn && curr_hop.asn.is_some() {
                    deviations.push(RouteDeviation {
                        hop_number: curr_hop.ttl,
                        baseline_ip: base_ip_str,
                        current_ip: curr_ip_str,
                        baseline_asn: base_hop.asn,
                        current_asn: curr_hop.asn,
                        deviation_type: DeviationType::AsnShift,
                        description: format!(
                            "Hop {} BGP ASN shift: was AS{:?}, now AS{:?}",
                            curr_hop.ttl, base_hop.asn, curr_hop.asn
                        ),
                    });
                }

                // Check latency anomaly (>80ms jump over baseline avg)
                if let (Some(base_rtt), Some(curr_rtt)) = (base_hop.rtt_avg, curr_hop.rtt_avg) {
                    if curr_rtt > base_rtt + 80.0 {
                        deviations.push(RouteDeviation {
                            hop_number: curr_hop.ttl,
                            baseline_ip: base_hop.ip.map(|i| i.to_string()),
                            current_ip: curr_hop.ip.map(|i| i.to_string()),
                            baseline_asn: base_hop.asn,
                            current_asn: curr_hop.asn,
                            deviation_type: DeviationType::LatencyAnomaly,
                            description: format!(
                                "Hop {} latency anomaly: {:.1}ms vs baseline {:.1}ms",
                                curr_hop.ttl, curr_rtt, base_rtt
                            ),
                        });
                    }
                }
            } else {
                deviations.push(RouteDeviation {
                    hop_number: curr_hop.ttl,
                    baseline_ip: None,
                    current_ip: curr_hop.ip.map(|i| i.to_string()),
                    baseline_asn: None,
                    current_asn: curr_hop.asn,
                    deviation_type: DeviationType::HopAdded,
                    description: format!("Hop {} added to route path", curr_hop.ttl),
                });
            }
        }

        for (ttl, base_hop) in &base_map {
            if !curr_map.contains_key(ttl) {
                deviations.push(RouteDeviation {
                    hop_number: *ttl,
                    baseline_ip: base_hop.ip.map(|i| i.to_string()),
                    current_ip: None,
                    baseline_asn: base_hop.asn,
                    current_asn: None,
                    deviation_type: DeviationType::HopRemoved,
                    description: format!("Hop {} missing from current route path", ttl),
                });
            }
        }

        deviations
    }

    pub fn get_baseline_path(
        vault: &VaultDatabase,
        target: &str,
    ) -> AppResult<Option<HistoricalPathRecord>> {
        let history = vault.get_history(&format!("multitrace:{}", target), 10)?;
        for rec in history {
            if let Ok(path) = serde_json::from_str::<HistoricalPathRecord>(&rec.result_json) {
                if path.is_baseline {
                    return Ok(Some(path));
                }
            }
        }
        Ok(None)
    }

    pub fn save_historical_path(
        vault: &VaultDatabase,
        target: &str,
        hops: &[HopTelemetry],
        is_baseline: bool,
    ) -> AppResult<()> {
        let rec = HistoricalPathRecord {
            target: target.to_string(),
            recorded_at: chrono::Utc::now().to_rfc3339(),
            total_hops: hops.len(),
            hops: hops.to_vec(),
            is_baseline,
        };
        let json = serde_json::to_string(&rec).map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Storage, e.to_string())
        })?;
        vault.save_history(&format!("multitrace:{}", target), target, &json)?;
        Ok(())
    }

    pub fn get_historical_paths(&self, target: &str) -> AppResult<Vec<HistoricalPathRecord>> {
        let history = self.vault.get_history(&format!("multitrace:{}", target), 20)?;
        let mut paths = Vec::new();
        for rec in history {
            if let Ok(path) = serde_json::from_str::<HistoricalPathRecord>(&rec.result_json) {
                paths.push(path);
            }
        }
        Ok(paths)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use async_trait::async_trait;

    struct DummyTracerouteEngine;

    #[async_trait]
    impl TracerouteEngine for DummyTracerouteEngine {
        async fn start_trace(
            &self,
            config: TracerouteConfig,
            _cancel_rx: watch::Receiver<bool>,
        ) -> AppResult<(String, mpsc::Receiver<HopTelemetry>)> {
            let (tx, rx) = mpsc::channel(16);
            let target = config.target.clone();

            tokio::spawn(async move {
                let hops = vec![
                    HopTelemetry {
                        ttl: 1,
                        ip: Some("192.168.1.1".parse().unwrap()),
                        hostname: Some("gateway.lan".to_string()),
                        asn: None,
                        asn_org: None,
                        country_code: None,
                        city: None,
                        latitude: None,
                        longitude: None,
                        loss_percent: 0.0,
                        sent: 1,
                        received: 1,
                        rtt_last: Some(1.2),
                        rtt_avg: Some(1.2),
                        rtt_best: Some(1.2),
                        rtt_worst: Some(1.2),
                        rtt_stdev: Some(0.0),
                    },
                    HopTelemetry {
                        ttl: 2,
                        ip: Some(target.parse().unwrap_or_else(|_| "1.1.1.1".parse().unwrap())),
                        hostname: None,
                        asn: Some(13335),
                        asn_org: Some("Cloudflare".to_string()),
                        country_code: Some("US".to_string()),
                        city: None,
                        latitude: None,
                        longitude: None,
                        loss_percent: 0.0,
                        sent: 1,
                        received: 1,
                        rtt_last: Some(14.0),
                        rtt_avg: Some(14.0),
                        rtt_best: Some(14.0),
                        rtt_worst: Some(14.0),
                        rtt_stdev: Some(0.0),
                    },
                ];

                for h in hops {
                    let _ = tx.send(h).await;
                }
            });

            Ok(("dummy-session".to_string(), rx))
        }
    }

    #[tokio::test]
    async fn test_multitrace_concurrency_and_targets() {
        let engine = Arc::new(DummyTracerouteEngine);
        let vault = Arc::new(VaultDatabase::open_in_memory().unwrap());
        let mtrace = MultiTraceEngine::new(engine, vault);

        let targets = vec![
            "1.1.1.1".to_string(),
            "8.8.8.8".to_string(),
            "9.9.9.9".to_string(),
        ];

        let config = MultiTraceConfig {
            targets,
            max_hops: Some(15),
            timeout_ms: Some(500),
        };

        let res = mtrace.run_multitrace(config, None).await.expect("Multitrace failed");
        assert_eq!(res.targets.len(), 3);
        assert!(res.targets.iter().all(|t| t.completed));
        assert_eq!(res.targets[0].hops.len(), 2);
    }

    #[test]
    fn test_route_deviation_detection() {
        let vault = VaultDatabase::open_in_memory().unwrap();

        let baseline_hops = vec![
            HopTelemetry {
                ttl: 1,
                ip: Some("192.168.1.1".parse().unwrap()),
                hostname: None,
                asn: None,
                asn_org: None,
                country_code: None,
                city: None,
                latitude: None,
                longitude: None,
                loss_percent: 0.0,
                sent: 1,
                received: 1,
                rtt_last: Some(1.0),
                rtt_avg: Some(1.0),
                rtt_best: Some(1.0),
                rtt_worst: Some(1.0),
                rtt_stdev: Some(0.0),
            },
            HopTelemetry {
                ttl: 2,
                ip: Some("172.16.0.1".parse().unwrap()),
                hostname: None,
                asn: Some(7018),
                asn_org: None,
                country_code: None,
                city: None,
                latitude: None,
                longitude: None,
                loss_percent: 0.0,
                sent: 1,
                received: 1,
                rtt_last: Some(10.0),
                rtt_avg: Some(10.0),
                rtt_best: Some(10.0),
                rtt_worst: Some(10.0),
                rtt_stdev: Some(0.0),
            },
        ];

        // Save as baseline
        MultiTraceEngine::save_historical_path(&vault, "1.1.1.1", &baseline_hops, true).unwrap();

        // New route with IP mismatch at Hop 2
        let current_hops = vec![
            HopTelemetry {
                ttl: 1,
                ip: Some("192.168.1.1".parse().unwrap()),
                hostname: None,
                asn: None,
                asn_org: None,
                country_code: None,
                city: None,
                latitude: None,
                longitude: None,
                loss_percent: 0.0,
                sent: 1,
                received: 1,
                rtt_last: Some(1.0),
                rtt_avg: Some(1.0),
                rtt_best: Some(1.0),
                rtt_worst: Some(1.0),
                rtt_stdev: Some(0.0),
            },
            HopTelemetry {
                ttl: 2,
                ip: Some("10.200.0.1".parse().unwrap()), // Changed!
                hostname: None,
                asn: Some(13335), // Changed!
                asn_org: None,
                country_code: None,
                city: None,
                latitude: None,
                longitude: None,
                loss_percent: 0.0,
                sent: 1,
                received: 1,
                rtt_last: Some(10.0),
                rtt_avg: Some(10.0),
                rtt_best: Some(10.0),
                rtt_worst: Some(10.0),
                rtt_stdev: Some(0.0),
            },
        ];

        let deviations = MultiTraceEngine::detect_deviations(&vault, "1.1.1.1", &current_hops);
        assert!(!deviations.is_empty());
        assert_eq!(deviations[0].hop_number, 2);
        assert_eq!(deviations[0].deviation_type, DeviationType::IpMismatch);
    }
}
