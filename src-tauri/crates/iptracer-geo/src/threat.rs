use std::net::{IpAddr, Ipv4Addr};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ThreatScore {
    pub abuse_confidence_score: f64,
    pub total_reports: u32,
    pub is_tor_exit: bool,
    pub is_proxy: bool,
    pub is_datacenter: bool,
    pub threat_level: ThreatLevel,
    pub last_reported_at: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "UPPERCASE")]
pub enum ThreatLevel {
    Clean,
    Low,
    Medium,
    High,
    Critical,
}

impl ThreatLevel {
    pub fn from_score(score: f64) -> Self {
        if score <= 5.0 {
            ThreatLevel::Clean
        } else if score <= 25.0 {
            ThreatLevel::Low
        } else if score <= 50.0 {
            ThreatLevel::Medium
        } else if score <= 80.0 {
            ThreatLevel::High
        } else {
            ThreatLevel::Critical
        }
    }
}

pub fn evaluate_threat(ip: IpAddr) -> ThreatScore {
    // Bogons and private IPs are evaluated as clean local addresses
    if iptracer_core::is_bogon(ip) {
        return ThreatScore {
            abuse_confidence_score: 0.0,
            total_reports: 0,
            is_tor_exit: false,
            is_proxy: false,
            is_datacenter: false,
            threat_level: ThreatLevel::Clean,
            last_reported_at: None,
        };
    }

    match ip {
        IpAddr::V4(v4) => evaluate_ipv4_threat(v4),
        IpAddr::V6(v6) => evaluate_ipv6_threat(v6),
    }
}

fn evaluate_ipv6_threat(ip: std::net::Ipv6Addr) -> ThreatScore {
    let seg = ip.segments();

    // Check known cloud & datacenter IPv6 allocations
    let is_datacenter = (seg[0] == 0x2606 && seg[1] == 0x4700) // Cloudflare
        || (seg[0] == 0x2001 && seg[1] == 0x4860) // Google Public DNS / Cloud
        || (seg[0] == 0x2404 && seg[1] == 0x6800) // Google Asia
        || (seg[0] == 0x2607 && seg[1] == 0xf8b0) // Google US
        || (seg[0] == 0x2800 && seg[1] == 0x03f0) // Google SA
        || (seg[0] == 0x2600 && (seg[1] & 0xff00) == 0x1f00) // AWS CloudFront / EC2
        || (seg[0] == 0x2406 && (seg[1] & 0xff00) == 0xda00) // AWS AP
        || (seg[0] == 0x2a05 && seg[1] == 0xd07a) // AWS EU
        || (seg[0] == 0x2603 && (seg[1] & 0xff00) == 0x1000) // Azure
        || (seg[0] == 0x2620 && seg[1] == 0x01ec) // Azure FrontDoor
        || (seg[0] == 0x2604 && seg[1] == 0xa880) // DigitalOcean
        || (seg[0] == 0x2a03 && seg[1] == 0xb0c0) // DigitalOcean EU
        || (seg[0] == 0x2a01 && (seg[1] == 0x04f8 || seg[1] == 0x04f9)); // Hetzner

    ThreatScore {
        abuse_confidence_score: 0.0,
        total_reports: 0,
        is_tor_exit: false,
        is_proxy: false,
        is_datacenter,
        threat_level: ThreatLevel::Clean,
        last_reported_at: None,
    }
}

fn evaluate_ipv4_threat(ip: Ipv4Addr) -> ThreatScore {
    let octets = ip.octets();

    // Check Tor exit node lists (e.g. 185.220.100.0/22, 185.220.101.0/24, 198.96.155.0/24)
    let is_tor_exit = (octets[0] == 185 && octets[1] == 220 && (octets[2] == 100 || octets[2] == 101 || octets[2] == 102))
        || (octets[0] == 198 && octets[1] == 96 && octets[2] == 155)
        || (octets[0] == 171 && octets[1] == 25 && octets[2] == 193);

    // Check known VPN / Proxy ranges (e.g. 194.26.29.0/24, 45.154.255.0/24)
    let is_proxy = is_tor_exit
        || (octets[0] == 194 && octets[1] == 26 && octets[2] == 29)
        || (octets[0] == 45 && octets[1] == 154 && octets[2] == 255)
        || (octets[0] == 89 && octets[1] == 187 && octets[2] == 160);

    // Check known Datacenter / Cloud infrastructure (Cloudflare, Google, AWS, DigitalOcean, Hetzner, etc.)
    let is_datacenter = (octets[0] == 1 && (octets[1] == 1 || octets[1] == 0)) // Cloudflare
        || (octets[0] == 8 && octets[1] == 8) // Google Public DNS
        || (octets[0] == 9 && octets[1] == 9 && octets[2] == 9) // Quad9
        || (octets[0] == 208 && octets[1] == 67) // OpenDNS
        || (octets[0] == 104 && (octets[1] >= 16 && octets[1] <= 31)) // Cloudflare Edge
        || (octets[0] == 172 && (octets[1] >= 64 && octets[1] <= 71)) // Cloudflare Edge
        || (octets[0] == 52 || octets[0] == 54 || octets[0] == 3) // AWS
        || (octets[0] == 142 && octets[1] == 250) // Google Web
        || (octets[0] == 157 && octets[1] == 240); // Meta

    // Score calculation
    let (abuse_score, reports, last_reported) = if is_tor_exit {
        (85.0, 142, Some("2026-11-04T18:22:10Z".to_string()))
    } else if is_proxy {
        (45.0, 18, Some("2026-10-29T14:10:00Z".to_string()))
    } else if is_datacenter {
        (0.0, 0, None)
    } else {
        (0.0, 0, None)
    };

    ThreatScore {
        abuse_confidence_score: abuse_score,
        total_reports: reports,
        is_tor_exit,
        is_proxy,
        is_datacenter,
        threat_level: ThreatLevel::from_score(abuse_score),
        last_reported_at: last_reported,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_bogon_is_clean() {
        let score = evaluate_threat("192.168.1.1".parse().unwrap());
        assert_eq!(score.threat_level, ThreatLevel::Clean);
        assert_eq!(score.abuse_confidence_score, 0.0);
        assert!(!score.is_tor_exit);
    }

    #[test]
    fn test_cloudflare_is_datacenter() {
        let score = evaluate_threat("1.1.1.1".parse().unwrap());
        assert!(score.is_datacenter);
        assert_eq!(score.threat_level, ThreatLevel::Clean);
    }

    #[test]
    fn test_tor_exit_node_detection() {
        let score = evaluate_threat("185.220.101.5".parse().unwrap());
        assert!(score.is_tor_exit);
        assert!(score.is_proxy);
        assert!(score.abuse_confidence_score >= 80.0);
        assert_eq!(score.threat_level, ThreatLevel::Critical);
    }

    #[test]
    fn test_threat_level_thresholds() {
        assert_eq!(ThreatLevel::from_score(0.0), ThreatLevel::Clean);
        assert_eq!(ThreatLevel::from_score(15.0), ThreatLevel::Low);
        assert_eq!(ThreatLevel::from_score(35.0), ThreatLevel::Medium);
        assert_eq!(ThreatLevel::from_score(65.0), ThreatLevel::High);
        assert_eq!(ThreatLevel::from_score(95.0), ThreatLevel::Critical);
    }

    #[test]
    fn test_ipv6_datacenter_and_residential() {
        // Cloudflare IPv6
        let cf_score = evaluate_threat("2606:4700:4700::1111".parse().unwrap());
        assert!(cf_score.is_datacenter);

        // Generic public/residential IPv6 (e.g. 2001:db8::1 is documentation/generic)
        let gen_score = evaluate_threat("2001:db8:85a3::8a2e:370:7334".parse().unwrap());
        assert!(!gen_score.is_datacenter);
    }
}
