use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct IpTraceResult {
    pub query: String,
    pub ip: String,
    pub ip_version: String,
    pub is_bogon: bool,
    pub is_anycast: bool,
    pub hostname: Option<String>,
    pub location: LocationModel,
    pub network: NetworkModel,
    pub threat: ThreatModel,
    pub source: String,
    pub provider: String,
    pub response_time_ms: f64,
    pub timestamp: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct LocationModel {
    pub continent: Option<String>,
    pub continent_code: Option<String>,
    pub country: String,
    pub country_code: String,
    pub region: String,
    pub region_code: Option<String>,
    pub city: String,
    pub postal_code: Option<String>,
    pub latitude: f64,
    pub longitude: f64,
    pub timezone: String,
    pub accuracy_radius_km: Option<f32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkModel {
    pub asn: Option<u32>,
    pub asn_org: String,
    pub isp: String,
    pub cidr: Option<String>,
    pub bgp_prefix: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreatModel {
    pub abuse_confidence_score: f64,
    pub total_reports: u32,
    pub is_tor_exit: bool,
    pub is_proxy: bool,
    pub is_datacenter: bool,
    pub threat_level: String,
    pub last_reported_at: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct NetworkInterface {
    pub name: String,
    pub ip_addresses: Vec<String>,
    pub mac_address: Option<String>,
    pub is_up: bool,
    pub is_loopback: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElevationStatus {
    pub is_elevated: bool,
    pub helper_connected: bool,
}

pub use iptracer_core::lan::{LanDevice, LanScanResult};
