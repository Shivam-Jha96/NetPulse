use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AppConfig {
    pub theme: String,
    pub default_dns: Vec<String>,
    pub ping_interval_ms: u64,
    pub ping_packet_size: usize,
    pub ping_timeout_ms: u64,
    pub traceroute_max_hops: u8,
    pub traceroute_timeout_ms: u64,
    pub traceroute_probes_per_hop: u8,
    pub geoip_offline_enabled: bool,
    pub custom_geoip_db_path: Option<String>,
    pub telemetry_flush_interval_ms: u64,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            theme: "dark".to_string(),
            default_dns: vec![
                "1.1.1.1".to_string(),
                "8.8.8.8".to_string(),
                "9.9.9.9".to_string(),
            ],
            ping_interval_ms: 1000,
            ping_packet_size: 56,
            ping_timeout_ms: 1500,
            traceroute_max_hops: 30,
            traceroute_timeout_ms: 1000,
            traceroute_probes_per_hop: 3,
            geoip_offline_enabled: true,
            custom_geoip_db_path: None,
            telemetry_flush_interval_ms: 50,
        }
    }
}
