use std::collections::VecDeque;
use std::sync::{Arc, Mutex};
use serde::{Deserialize, Serialize};

use crate::error::{AppError, AppResult, ErrorCategory, ErrorCode};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EnterprisePolicyProfile {
    pub profile_id: String,
    pub profile_name: String,
    pub version: String,
    pub enforce_strict_egress: bool,
    pub max_port_scan_concurrency: usize,
    pub allowed_port_ranges: Vec<(u16, u16)>,
    pub prohibited_ports: Vec<u16>,
    pub min_probe_interval_ms: u64,
    pub latency_alert_threshold_ms: f64,
    pub loss_alert_threshold_pct: f64,
    pub cloud_sync_interval_mins: u32,
    pub telemetry_enabled: bool,
}

impl Default for EnterprisePolicyProfile {
    fn default() -> Self {
        Self {
            profile_id: "corp-standard-v1".to_string(),
            profile_name: "NetPulse Corporate Standard Diagnostic Policy".to_string(),
            version: "1.0.0".to_string(),
            enforce_strict_egress: false,
            max_port_scan_concurrency: 100,
            allowed_port_ranges: vec![(1, 10000), (20000, 30000)],
            prohibited_ports: vec![23, 135, 139, 445], // Telnet, RPC, NetBIOS, SMB
            min_probe_interval_ms: 100,
            latency_alert_threshold_ms: 100.0,
            loss_alert_threshold_pct: 5.0,
            cloud_sync_interval_mins: 15,
            telemetry_enabled: true,
        }
    }
}

pub struct EnterprisePolicyEngine {
    active_profile: Arc<Mutex<EnterprisePolicyProfile>>,
}

impl Default for EnterprisePolicyEngine {
    fn default() -> Self {
        Self::new()
    }
}

impl EnterprisePolicyEngine {
    pub fn new() -> Self {
        Self {
            active_profile: Arc::new(Mutex::new(EnterprisePolicyProfile::default())),
        }
    }

    pub fn get_policy(&self) -> EnterprisePolicyProfile {
        self.active_profile.lock().unwrap().clone()
    }

    pub fn set_policy(&self, profile: EnterprisePolicyProfile) {
        let mut p = self.active_profile.lock().unwrap();
        *p = profile;
    }

    pub fn switch_profile(&self, profile_id: &str) -> AppResult<EnterprisePolicyProfile> {
        let profile = match profile_id {
            "corp-standard-v1" => EnterprisePolicyProfile::default(),
            "soc2-hardened" => EnterprisePolicyProfile {
                profile_id: "soc2-hardened".to_string(),
                profile_name: "SOC 2 Type II Compliance Baseline".to_string(),
                version: "2.1.0".to_string(),
                enforce_strict_egress: true,
                max_port_scan_concurrency: 20,
                allowed_port_ranges: vec![(80, 80), (443, 443), (53, 53), (8080, 8080), (8443, 8443)],
                prohibited_ports: vec![21, 22, 23, 25, 110, 135, 139, 445, 1433, 3306, 3389, 5432],
                min_probe_interval_ms: 500,
                latency_alert_threshold_ms: 50.0,
                loss_alert_threshold_pct: 2.0,
                cloud_sync_interval_mins: 5,
                telemetry_enabled: true,
            },
            "fintech-strict" => EnterprisePolicyProfile {
                profile_id: "fintech-strict".to_string(),
                profile_name: "FinTech PCI-DSS High Security Profile".to_string(),
                version: "3.0.0".to_string(),
                enforce_strict_egress: true,
                max_port_scan_concurrency: 10,
                allowed_port_ranges: vec![(443, 443), (8443, 8443)],
                prohibited_ports: vec![21, 23, 25, 80, 135, 139, 445, 3389],
                min_probe_interval_ms: 1000,
                latency_alert_threshold_ms: 30.0,
                loss_alert_threshold_pct: 1.0,
                cloud_sync_interval_mins: 1,
                telemetry_enabled: true,
            },
            _ => {
                return Err(AppError::new(
                    ErrorCode::ERR_INVALID_TARGET,
                    ErrorCategory::Validation,
                    format!("Unknown enterprise policy profile '{}'", profile_id),
                ));
            }
        };

        self.set_policy(profile.clone());
        Ok(profile)
    }

    pub fn validate_port_scan(&self, port: u16, requested_concurrency: usize) -> AppResult<usize> {
        let policy = self.get_policy();

        if policy.prohibited_ports.contains(&port) {
            return Err(AppError::new(
                ErrorCode::ERR_PORT_SCAN_LIMIT,
                ErrorCategory::Privilege,
                format!("Port {} is prohibited by Enterprise Security Policy '{}'", port, policy.profile_name),
            ));
        }

        let is_allowed = policy.allowed_port_ranges.iter().any(|&(start, end)| port >= start && port <= end);
        if !is_allowed {
            return Err(AppError::new(
                ErrorCode::ERR_PORT_SCAN_LIMIT,
                ErrorCategory::Privilege,
                format!("Port {} falls outside allowed ranges for Policy '{}'", port, policy.profile_name),
            ));
        }

        let clamped_concurrency = requested_concurrency.min(policy.max_port_scan_concurrency);
        Ok(clamped_concurrency)
    }
}

// ---------------------------------------------------------------------------
// Enterprise Cloud Telemetry Sync Client Stub
// ---------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TelemetryEvent {
    pub id: String,
    pub event_type: String,
    pub timestamp: i64,
    pub payload: serde_json::Value,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudSyncRequest {
    pub endpoint_url: Option<String>,
    pub bearer_token: Option<String>,
    pub organization_id: Option<String>,
    pub events: Option<Vec<TelemetryEvent>>,
    pub flush_offline_spool: Option<bool>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CloudSyncResult {
    pub synced_count: usize,
    pub spooled_count: usize,
    pub server_ack_id: String,
    pub status: String,
    pub synced_at: String,
}

pub struct CloudTelemetryClient {
    offline_spool: Arc<Mutex<VecDeque<TelemetryEvent>>>,
}

impl Default for CloudTelemetryClient {
    fn default() -> Self {
        Self::new()
    }
}

impl CloudTelemetryClient {
    pub fn new() -> Self {
        Self {
            offline_spool: Arc::new(Mutex::new(VecDeque::with_capacity(500))),
        }
    }

    pub fn enqueue_offline(&self, event: TelemetryEvent) {
        let mut spool = self.offline_spool.lock().unwrap();
        if spool.len() >= 500 {
            spool.pop_front();
        }
        spool.push_back(event);
    }

    pub fn get_spooled_count(&self) -> usize {
        self.offline_spool.lock().unwrap().len()
    }

    pub async fn sync_telemetry(&self, req: CloudSyncRequest) -> AppResult<CloudSyncResult> {
        let token = req.bearer_token.as_deref().unwrap_or("").trim();
        let flush = req.flush_offline_spool.unwrap_or(true);

        // Validate Bearer Auth (format: Bearer <token> or raw token)
        let is_authenticated = !token.is_empty();

        let mut events_to_sync = req.events.unwrap_or_default();

        if !is_authenticated {
            // Unauthenticated or offline: Spool events to offline queue
            for ev in events_to_sync {
                self.enqueue_offline(ev);
            }

            let spooled_total = self.get_spooled_count();
            return Ok(CloudSyncResult {
                synced_count: 0,
                spooled_count: spooled_total,
                server_ack_id: "OFFLINE_SPOOL_HOLD".to_string(),
                status: "SPOOLED_OFFLINE".to_string(),
                synced_at: chrono::Utc::now().to_rfc3339(),
            });
        }

        // Authenticated: Include offline spooled events if requested
        if flush {
            let mut spool = self.offline_spool.lock().unwrap();
            while let Some(spooled_ev) = spool.pop_front() {
                events_to_sync.push(spooled_ev);
            }
        }

        let synced_count = events_to_sync.len();
        let server_ack_id = format!("ack-np-cloud-{}", uuid::Uuid::new_v4());

        Ok(CloudSyncResult {
            synced_count,
            spooled_count: self.get_spooled_count(),
            server_ack_id,
            status: "SYNCED".to_string(),
            synced_at: chrono::Utc::now().to_rfc3339(),
        })
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_enterprise_policy_profiles() {
        let engine = EnterprisePolicyEngine::new();
        let def = engine.get_policy();
        assert_eq!(def.profile_id, "corp-standard-v1");

        // Allowed port test
        let c1 = engine.validate_port_scan(443, 50).expect("Port 443 should be allowed");
        assert_eq!(c1, 50);

        // Prohibited port test (e.g. 23 Telnet)
        let err = engine.validate_port_scan(23, 50);
        assert!(err.is_err());

        // Switch to SOC 2 Profile
        let soc2 = engine.switch_profile("soc2-hardened").expect("SOC2 profile switch failed");
        assert_eq!(soc2.max_port_scan_concurrency, 20);

        // In SOC2, port 22 is prohibited
        assert!(engine.validate_port_scan(22, 10).is_err());
    }

    #[tokio::test]
    async fn test_cloud_telemetry_sync_and_offline_spool() {
        let client = CloudTelemetryClient::new();

        // 1. Unauthenticated request: Spools to offline queue
        let unauth_req = CloudSyncRequest {
            endpoint_url: Some("https://telemetry.netpulse.io/v1".to_string()),
            bearer_token: None,
            organization_id: Some("org-test-1".to_string()),
            events: Some(vec![TelemetryEvent {
                id: "ev-1".to_string(),
                event_type: "latency_spike".to_string(),
                timestamp: 123456,
                payload: serde_json::json!({ "latencyMs": 150.0 }),
            }]),
            flush_offline_spool: Some(true),
        };

        let res1 = client.sync_telemetry(unauth_req).await.unwrap();
        assert_eq!(res1.status, "SPOOLED_OFFLINE");
        assert_eq!(res1.synced_count, 0);
        assert_eq!(res1.spooled_count, 1);
        assert_eq!(client.get_spooled_count(), 1);

        // 2. Authenticated request: Syncs new event and flushes spool
        let auth_req = CloudSyncRequest {
            endpoint_url: Some("https://telemetry.netpulse.io/v1".to_string()),
            bearer_token: Some("Bearer test-token-xyz".to_string()),
            organization_id: Some("org-test-1".to_string()),
            events: Some(vec![TelemetryEvent {
                id: "ev-2".to_string(),
                event_type: "audit_summary".to_string(),
                timestamp: 123457,
                payload: serde_json::json!({ "health": "OK" }),
            }]),
            flush_offline_spool: Some(true),
        };

        let res2 = client.sync_telemetry(auth_req).await.unwrap();
        assert_eq!(res2.status, "SYNCED");
        assert_eq!(res2.synced_count, 2); // 1 spooled + 1 new
        assert_eq!(res2.spooled_count, 0);
        assert_eq!(client.get_spooled_count(), 0);
    }
}
