use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum IpCategory {
    Public,
    PrivateRfc1918,
    LinkLocal,
    Loopback,
    CarrierGradeNat,
    Multicast,
    Broadcast,
    Documentation,
    Benchmarking,
    Unspecified,
    UniqueLocalIpv6,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct IpClassification {
    pub ip: IpAddr,
    pub is_bogon: bool,
    pub is_private: bool,
    pub is_loopback: bool,
    pub is_multicast: bool,
    pub is_link_local: bool,
    pub category: IpCategory,
    pub description: &'static str,
}

/// Checks whether an IP address is a bogon (unroutable on the public internet)
pub fn is_bogon(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => is_bogon_v4(ipv4),
        IpAddr::V6(ipv6) => is_bogon_v6(ipv6),
    }
}

/// Checks whether an IP address is private (RFC 1918 or IPv6 Unique Local)
pub fn is_private(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => is_private_v4(ipv4),
        IpAddr::V6(ipv6) => is_private_v6(ipv6),
    }
}

pub fn is_loopback(ip: IpAddr) -> bool {
    ip.is_loopback()
}

pub fn is_multicast(ip: IpAddr) -> bool {
    ip.is_multicast()
}

pub fn is_link_local(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => ipv4.octets()[0] == 169 && ipv4.octets()[1] == 254,
        IpAddr::V6(ipv6) => {
            let octets = ipv6.octets();
            octets[0] == 0xfe && (octets[1] & 0xc0) == 0x80
        }
    }
}

pub fn is_carrier_grade_nat(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            let octets = ipv4.octets();
            octets[0] == 100 && (octets[1] & 0xc0) == 64 // 100.64.0.0/10
        }
        IpAddr::V6(_) => false,
    }
}

pub fn is_documentation(ip: IpAddr) -> bool {
    match ip {
        IpAddr::V4(ipv4) => {
            let o = ipv4.octets();
            (o[0] == 192 && o[1] == 0 && o[2] == 2) // 192.0.2.0/24
                || (o[0] == 198 && o[1] == 51 && o[2] == 100) // 198.51.100.0/24
                || (o[0] == 203 && o[1] == 0 && o[2] == 113) // 203.0.113.0/24
        }
        IpAddr::V6(ipv6) => {
            let segs = ipv6.segments();
            segs[0] == 0x2001 && segs[1] == 0x0db8 // 2001:db8::/32
        }
    }
}

fn is_bogon_v4(ip: Ipv4Addr) -> bool {
    let o = ip.octets();
    // 0.0.0.0/8 (This host on this network)
    if o[0] == 0 {
        return true;
    }
    // 10.0.0.0/8 (RFC 1918)
    if o[0] == 10 {
        return true;
    }
    // 100.64.0.0/10 (Carrier-Grade NAT)
    if o[0] == 100 && (o[1] & 0xc0) == 64 {
        return true;
    }
    // 127.0.0.0/8 (Loopback)
    if o[0] == 127 {
        return true;
    }
    // 169.254.0.0/16 (Link-Local)
    if o[0] == 169 && o[1] == 254 {
        return true;
    }
    // 172.16.0.0/12 (RFC 1918)
    if o[0] == 172 && (o[1] >= 16 && o[1] <= 31) {
        return true;
    }
    // 192.0.0.0/24 (IETF Protocol Assignments)
    if o[0] == 192 && o[1] == 0 && o[2] == 0 {
        return true;
    }
    // 192.0.2.0/24 (TEST-NET-1)
    if o[0] == 192 && o[1] == 0 && o[2] == 2 {
        return true;
    }
    // 192.168.0.0/16 (RFC 1918)
    if o[0] == 192 && o[1] == 168 {
        return true;
    }
    // 198.18.0.0/15 (Benchmarking)
    if o[0] == 198 && (o[1] == 18 || o[1] == 19) {
        return true;
    }
    // 198.51.100.0/24 (TEST-NET-2)
    if o[0] == 198 && o[1] == 51 && o[2] == 100 {
        return true;
    }
    // 203.0.113.0/24 (TEST-NET-3)
    if o[0] == 203 && o[1] == 0 && o[2] == 113 {
        return true;
    }
    // 224.0.0.0/4 (Multicast)
    if o[0] >= 224 && o[0] <= 239 {
        return true;
    }
    // 240.0.0.0/4 (Reserved for future use / Class E) & 255.255.255.255 (Broadcast)
    if o[0] >= 240 {
        return true;
    }

    false
}

fn is_private_v4(ip: Ipv4Addr) -> bool {
    let o = ip.octets();
    o[0] == 10
        || (o[0] == 172 && (o[1] >= 16 && o[1] <= 31))
        || (o[0] == 192 && o[1] == 168)
}

fn is_bogon_v6(ip: Ipv6Addr) -> bool {
    if ip.is_unspecified() || ip.is_loopback() {
        return true;
    }
    let segs = ip.segments();
    // Unique Local (fc00::/7)
    if (segs[0] & 0xfe00) == 0xfc00 {
        return true;
    }
    // Link-Local (fe80::/10)
    if (segs[0] & 0xffc0) == 0xfe80 {
        return true;
    }
    // Multicast (ff00::/8)
    if (segs[0] & 0xff00) == 0xff00 {
        return true;
    }
    // Documentation (2001:db8::/32)
    if segs[0] == 0x2001 && segs[1] == 0x0db8 {
        return true;
    }
    // Discard prefix (100::/64)
    if segs[0] == 0x0100 && segs[1] == 0 && segs[2] == 0 && segs[3] == 0 {
        return true;
    }

    false
}

fn is_private_v6(ip: Ipv6Addr) -> bool {
    // Unique Local Addresses (ULA) fc00::/7
    let segs = ip.segments();
    (segs[0] & 0xfe00) == 0xfc00
}

pub fn classify_ip(ip: IpAddr) -> IpClassification {
    let is_bg = is_bogon(ip);
    let is_priv = is_private(ip);
    let is_loop = is_loopback(ip);
    let is_multi = is_multicast(ip);
    let is_ll = is_link_local(ip);

    let (category, description) = if is_loop {
        (IpCategory::Loopback, "Loopback interface address")
    } else if is_ll {
        (IpCategory::LinkLocal, "Link-Local self-assigned address (RFC 3927)")
    } else if is_priv {
        (IpCategory::PrivateRfc1918, "Private local network address (RFC 1918 / ULA)")
    } else if is_carrier_grade_nat(ip) {
        (IpCategory::CarrierGradeNat, "Carrier-Grade NAT address (RFC 6598)")
    } else if is_documentation(ip) {
        (IpCategory::Documentation, "Documentation / Test network address (RFC 5737)")
    } else if is_multi {
        (IpCategory::Multicast, "Multicast group address (RFC 5771)")
    } else if ip == IpAddr::V4(Ipv4Addr::new(255, 255, 255, 255)) {
        (IpCategory::Broadcast, "Limited broadcast address")
    } else if ip.is_unspecified() {
        (IpCategory::Unspecified, "Unspecified address")
    } else {
        (IpCategory::Public, "Globally routable public internet address")
    };

    IpClassification {
        ip,
        is_bogon: is_bg,
        is_private: is_priv,
        is_loopback: is_loop,
        is_multicast: is_multi,
        is_link_local: is_ll,
        category,
        description,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_bogon_rfc1918() {
        assert!(is_bogon(IpAddr::from_str("10.0.0.1").unwrap()));
        assert!(is_bogon(IpAddr::from_str("172.16.5.42").unwrap()));
        assert!(is_bogon(IpAddr::from_str("192.168.1.1").unwrap()));
        assert!(is_private(IpAddr::from_str("10.254.0.1").unwrap()));
        assert!(is_private(IpAddr::from_str("172.31.255.255").unwrap()));
        assert!(is_private(IpAddr::from_str("192.168.254.254").unwrap()));
    }

    #[test]
    fn test_bogon_cgnat_and_link_local() {
        assert!(is_bogon(IpAddr::from_str("100.64.0.1").unwrap()));
        assert!(is_carrier_grade_nat(IpAddr::from_str("100.127.255.255").unwrap()));
        assert!(is_link_local(IpAddr::from_str("169.254.1.1").unwrap()));
        assert!(is_bogon(IpAddr::from_str("169.254.20.10").unwrap()));
    }

    #[test]
    fn test_bogon_loopback_and_multicast() {
        assert!(is_loopback(IpAddr::from_str("127.0.0.1").unwrap()));
        assert!(is_bogon(IpAddr::from_str("127.0.0.1").unwrap()));
        assert!(is_multicast(IpAddr::from_str("224.0.0.1").unwrap()));
        assert!(is_bogon(IpAddr::from_str("239.255.255.250").unwrap()));
    }

    #[test]
    fn test_public_ips_not_bogon() {
        assert!(!is_bogon(IpAddr::from_str("1.1.1.1").unwrap()));
        assert!(!is_bogon(IpAddr::from_str("8.8.8.8").unwrap()));
        assert!(!is_bogon(IpAddr::from_str("142.250.190.46").unwrap()));
        assert!(!is_private(IpAddr::from_str("1.1.1.1").unwrap()));
    }

    #[test]
    fn test_ipv6_classification() {
        assert!(is_bogon(IpAddr::from_str("::1").unwrap()));
        assert!(is_loopback(IpAddr::from_str("::1").unwrap()));
        assert!(is_bogon(IpAddr::from_str("fe80::1").unwrap()));
        assert!(is_link_local(IpAddr::from_str("fe80::1").unwrap()));
        assert!(is_private(IpAddr::from_str("fc00::1").unwrap()));
        assert!(is_bogon(IpAddr::from_str("2001:db8::1").unwrap()));
        assert!(!is_bogon(IpAddr::from_str("2606:4700:4700::1111").unwrap()));
    }
}
