pub mod failover;
pub mod mmdb;
pub mod threat;

use std::net::IpAddr;
use std::sync::Arc;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use iptracer_core::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct GeoLocationRecord {
    pub ip: IpAddr,
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
    pub asn: Option<u32>,
    pub asn_org: Option<String>,
    pub isp: Option<String>,
    pub source: GeoSource,
    pub provider: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum GeoSource {
    OfflineMaxmind,
    OnlineFailover,
    LocalCache,
}

#[async_trait]
pub trait GeolocationProvider: Send + Sync {
    /// Fast memory-mapped / embedded offline lookup
    fn lookup_offline(&self, ip: IpAddr) -> AppResult<Option<GeoLocationRecord>>;

    /// Fallback query across cascade of public APIs (ipapi.co, ipinfo.io, ipify)
    async fn lookup_online_cascade(&self, ip: IpAddr) -> AppResult<GeoLocationRecord>;

    /// Combined lookup: checks offline database first, cascades to online if missing or override requested
    async fn lookup_ip(&self, ip: IpAddr, force_online: bool) -> AppResult<GeoLocationRecord> {
        if !force_online {
            if let Ok(Some(record)) = self.lookup_offline(ip) {
                return Ok(record);
            }
        }
        self.lookup_online_cascade(ip).await
    }
}

pub struct DefaultGeoProvider {
    offline_reader: Arc<mmdb::GeoLite2Reader>,
    online_cascade: Arc<failover::OnlineFailoverCascade>,
}

impl DefaultGeoProvider {
    pub fn new() -> Self {
        Self {
            offline_reader: Arc::new(mmdb::GeoLite2Reader::new(None)),
            online_cascade: Arc::new(failover::OnlineFailoverCascade::new()),
        }
    }

    pub fn with_custom_mmdb(path: Option<&str>) -> Self {
        Self {
            offline_reader: Arc::new(mmdb::GeoLite2Reader::new(path)),
            online_cascade: Arc::new(failover::OnlineFailoverCascade::new()),
        }
    }
}

#[async_trait]
impl GeolocationProvider for DefaultGeoProvider {
    fn lookup_offline(&self, ip: IpAddr) -> AppResult<Option<GeoLocationRecord>> {
        self.offline_reader.lookup(ip)
    }

    async fn lookup_online_cascade(&self, ip: IpAddr) -> AppResult<GeoLocationRecord> {
        self.online_cascade.lookup(ip).await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_embedded_offline_lookup_cloudflare() {
        let provider = DefaultGeoProvider::new();
        let ip: IpAddr = "1.1.1.1".parse().unwrap();
        let record = provider.lookup_offline(ip).unwrap().unwrap();

        assert_eq!(record.country, "United States");
        assert_eq!(record.country_code, "US");
        assert_eq!(record.city, "San Jose");
        assert_eq!(record.asn, Some(13335));
        assert_eq!(record.source, GeoSource::OfflineMaxmind);
    }

    #[test]
    fn test_embedded_offline_lookup_google() {
        let provider = DefaultGeoProvider::new();
        let ip: IpAddr = "8.8.8.8".parse().unwrap();
        let record = provider.lookup_offline(ip).unwrap().unwrap();

        assert_eq!(record.country, "United States");
        assert_eq!(record.city, "Mountain View");
        assert_eq!(record.asn, Some(15169));
    }

    #[test]
    fn test_offline_lookup_bogon_address() {
        let provider = DefaultGeoProvider::new();
        let ip: IpAddr = "192.168.1.1".parse().unwrap();
        let record = provider.lookup_offline(ip).unwrap().unwrap();

        assert_eq!(record.country, "Local Network");
        assert_eq!(record.country_code, "LAN");
    }
}
