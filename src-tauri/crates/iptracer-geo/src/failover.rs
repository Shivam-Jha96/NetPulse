use std::net::IpAddr;
use std::time::Duration;
use reqwest::Client;
use serde_json::Value;
use iptracer_core::error::{AppError, AppResult, ErrorCategory, ErrorCode};
use crate::{GeoLocationRecord, GeoSource};

pub struct OnlineFailoverCascade {
    client: Client,
}

impl OnlineFailoverCascade {
    pub fn new() -> Self {
        let client = Client::builder()
            .timeout(Duration::from_millis(2500))
            .build()
            .unwrap_or_else(|_| Client::new());

        Self { client }
    }

    pub async fn lookup(&self, ip: IpAddr) -> AppResult<GeoLocationRecord> {
        let ip_str = ip.to_string();

        // Provider 1: ipapi.co
        if let Ok(record) = self.query_ipapi_co(&ip_str, ip).await {
            return Ok(record);
        }

        // Provider 2: ip-api.com
        if let Ok(record) = self.query_ip_api_com(&ip_str, ip).await {
            return Ok(record);
        }

        // Provider 3: ipinfo.io
        if let Ok(record) = self.query_ipinfo_io(&ip_str, ip).await {
            return Ok(record);
        }

        Err(AppError::new(
            ErrorCode::ERR_ALL_PROVIDERS_DOWN,
            ErrorCategory::ThirdParty,
            format!("All public egress geolocation providers failed for target {}", ip),
        ))
    }

    pub async fn discover_egress_ip(&self) -> AppResult<IpAddr> {
        let providers = [
            "https://api.ipify.org?format=json",
            "https://ipapi.co/json/",
            "https://ipinfo.io/json",
        ];

        for url in providers {
            if let Ok(resp) = self.client.get(url).send().await {
                if let Ok(json) = resp.json::<Value>().await {
                    if let Some(ip_str) = json.get("ip").and_then(|v| v.as_str()) {
                        if let Ok(parsed) = ip_str.trim().parse::<IpAddr>() {
                            return Ok(parsed);
                        }
                    }
                }
            }
        }

        // Default fallback egress if completely air-gapped
        Ok("127.0.0.1".parse().unwrap())
    }

    async fn query_ipapi_co(&self, ip_str: &str, ip: IpAddr) -> Result<GeoLocationRecord, ()> {
        let url = format!("https://ipapi.co/{}/json/", ip_str);
        let resp = self.client.get(&url).send().await.map_err(|_| ())?;
        let json: Value = resp.json().await.map_err(|_| ())?;

        if json.get("error").is_some() {
            return Err(());
        }

        let country = json["country_name"].as_str().unwrap_or("Unknown").to_string();
        let country_code = json["country_code"].as_str().unwrap_or("").to_string();
        let region = json["region"].as_str().unwrap_or("").to_string();
        let city = json["city"].as_str().unwrap_or("").to_string();
        let postal_code = json["postal"].as_str().map(|s| s.to_string());
        let lat = json["latitude"].as_f64().unwrap_or(0.0);
        let lon = json["longitude"].as_f64().unwrap_or(0.0);
        let timezone = json["timezone"].as_str().unwrap_or("UTC").to_string();
        let asn = json["asn"].as_str().and_then(|s| s.trim_start_matches("AS").parse::<u32>().ok());
        let asn_org = json["org"].as_str().map(|s| s.to_string());

        Ok(GeoLocationRecord {
            ip,
            continent: json["continent_code"].as_str().map(|s| s.to_string()),
            continent_code: json["continent_code"].as_str().map(|s| s.to_string()),
            country,
            country_code,
            region,
            region_code: None,
            city,
            postal_code,
            latitude: lat,
            longitude: lon,
            timezone,
            accuracy_radius_km: None,
            asn,
            asn_org: asn_org.clone(),
            isp: asn_org,
            source: GeoSource::OnlineFailover,
            provider: "ipapi.co".to_string(),
        })
    }

    async fn query_ip_api_com(&self, ip_str: &str, ip: IpAddr) -> Result<GeoLocationRecord, ()> {
        let url = format!("http://ip-api.com/json/{}?fields=status,message,continent,continentCode,country,countryCode,region,regionName,city,zip,lat,lon,timezone,as,isp,org", ip_str);
        let resp = self.client.get(&url).send().await.map_err(|_| ())?;
        let json: Value = resp.json().await.map_err(|_| ())?;

        if json["status"].as_str() != Some("success") {
            return Err(());
        }

        let country = json["country"].as_str().unwrap_or("Unknown").to_string();
        let country_code = json["countryCode"].as_str().unwrap_or("").to_string();
        let region = json["regionName"].as_str().unwrap_or("").to_string();
        let city = json["city"].as_str().unwrap_or("").to_string();
        let lat = json["lat"].as_f64().unwrap_or(0.0);
        let lon = json["lon"].as_f64().unwrap_or(0.0);
        let timezone = json["timezone"].as_str().unwrap_or("UTC").to_string();
        let asn_str = json["as"].as_str().unwrap_or("");
        let asn = asn_str.split_whitespace().next().and_then(|s| s.trim_start_matches("AS").parse::<u32>().ok());
        let isp = json["isp"].as_str().map(|s| s.to_string());
        let org = json["org"].as_str().map(|s| s.to_string());

        Ok(GeoLocationRecord {
            ip,
            continent: json["continent"].as_str().map(|s| s.to_string()),
            continent_code: json["continentCode"].as_str().map(|s| s.to_string()),
            country,
            country_code,
            region,
            region_code: json["region"].as_str().map(|s| s.to_string()),
            city,
            postal_code: json["zip"].as_str().map(|s| s.to_string()),
            latitude: lat,
            longitude: lon,
            timezone,
            accuracy_radius_km: None,
            asn,
            asn_org: org,
            isp,
            source: GeoSource::OnlineFailover,
            provider: "ip-api.com".to_string(),
        })
    }

    async fn query_ipinfo_io(&self, ip_str: &str, ip: IpAddr) -> Result<GeoLocationRecord, ()> {
        let url = format!("https://ipinfo.io/{}/json", ip_str);
        let resp = self.client.get(&url).send().await.map_err(|_| ())?;
        let json: Value = resp.json().await.map_err(|_| ())?;

        let country_code = json["country"].as_str().unwrap_or("").to_string();
        let region = json["region"].as_str().unwrap_or("").to_string();
        let city = json["city"].as_str().unwrap_or("").to_string();

        let (lat, lon) = if let Some(loc) = json["loc"].as_str() {
            let parts: Vec<&str> = loc.split(',').collect();
            if parts.len() == 2 {
                (parts[0].parse::<f64>().unwrap_or(0.0), parts[1].parse::<f64>().unwrap_or(0.0))
            } else {
                (0.0, 0.0)
            }
        } else {
            (0.0, 0.0)
        };

        let timezone = json["timezone"].as_str().unwrap_or("UTC").to_string();
        let org = json["org"].as_str().map(|s| s.to_string());
        let asn = org.as_ref().and_then(|s| s.split_whitespace().next()).and_then(|s| s.trim_start_matches("AS").parse::<u32>().ok());

        Ok(GeoLocationRecord {
            ip,
            continent: None,
            continent_code: None,
            country: country_code.clone(),
            country_code,
            region,
            region_code: None,
            city,
            postal_code: json["postal"].as_str().map(|s| s.to_string()),
            latitude: lat,
            longitude: lon,
            timezone,
            accuracy_radius_km: None,
            asn,
            asn_org: org.clone(),
            isp: org,
            source: GeoSource::OnlineFailover,
            provider: "ipinfo.io".to_string(),
        })
    }
}
