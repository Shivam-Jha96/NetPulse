use std::net::{IpAddr, Ipv4Addr, Ipv6Addr};
use std::str::FromStr;
use serde::{Deserialize, Serialize};
use crate::bogon::{is_link_local, is_multicast, is_private};
use crate::error::{AppError, AppResult, ErrorCategory, ErrorCode};

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SubnetDetails {
    pub input_ip: String,
    pub prefix_length: u8,
    pub ip_version: String,
    pub network_address: String,
    pub broadcast_address: Option<String>,
    pub netmask: String,
    pub wildcard_mask: String,
    pub netmask_binary: String,
    pub usable_range: UsableRange,
    pub total_hosts: String,
    pub usable_hosts: String,
    pub ip_class: Option<String>,
    pub is_private: bool,
    pub is_link_local: bool,
    pub is_multicast: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub vlsm_subnets: Option<Vec<VlsmSubnetAllocation>>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct UsableRange {
    pub first_usable: String,
    pub last_usable: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VlsmSubnetAllocation {
    pub name: String,
    pub needed_hosts: u32,
    pub allocated_hosts: u32,
    pub prefix: u8,
    pub subnet_address: String,
    pub usable_range: String,
    pub broadcast: String,
}

pub trait SubnetCalculator: Send + Sync {
    fn calculate(&self, cidr: &str, vlsm_requests: Option<Vec<(String, u32)>>) -> AppResult<SubnetDetails>;
    fn calculate_ipv4(&self, ip: Ipv4Addr, prefix: u8) -> AppResult<SubnetDetails>;
    fn calculate_ipv6(&self, ip: Ipv6Addr, prefix: u8) -> AppResult<SubnetDetails>;
    fn plan_vlsm(&self, parent_cidr: &str, requests: &[(String, u32)]) -> AppResult<Vec<VlsmSubnetAllocation>>;
}

#[derive(Debug, Default, Clone)]
pub struct DefaultSubnetCalculator;

impl DefaultSubnetCalculator {
    pub fn new() -> Self {
        Self
    }
}

impl SubnetCalculator for DefaultSubnetCalculator {
    fn calculate(&self, cidr: &str, vlsm_requests: Option<Vec<(String, u32)>>) -> AppResult<SubnetDetails> {
        let trimmed = cidr.trim();
        let parts: Vec<&str> = trimmed.split('/').collect();

        if parts.len() != 2 {
            return Err(AppError::new(
                ErrorCode::ERR_INVALID_CIDR,
                ErrorCategory::Validation,
                format!("Invalid CIDR notation '{}'. Expected format IP/prefix (e.g. 192.168.1.0/24)", trimmed),
            ));
        }

        let ip_str = parts[0];
        let prefix: u8 = parts[1].parse().map_err(|_| {
            AppError::new(
                ErrorCode::ERR_INVALID_CIDR,
                ErrorCategory::Validation,
                format!("Prefix '{}' is not a valid integer", parts[1]),
            )
        })?;

        let mut details = if let Ok(ipv4) = Ipv4Addr::from_str(ip_str) {
            if prefix > 32 {
                return Err(AppError::new(
                    ErrorCode::ERR_INVALID_CIDR,
                    ErrorCategory::Validation,
                    format!("IPv4 prefix length /{} exceeds maximum 32", prefix),
                ));
            }
            self.calculate_ipv4(ipv4, prefix)?
        } else if let Ok(ipv6) = Ipv6Addr::from_str(ip_str) {
            if prefix > 128 {
                return Err(AppError::new(
                    ErrorCode::ERR_INVALID_CIDR,
                    ErrorCategory::Validation,
                    format!("IPv6 prefix length /{} exceeds maximum 128", prefix),
                ));
            }
            self.calculate_ipv6(ipv6, prefix)?
        } else {
            return Err(AppError::new(
                ErrorCode::ERR_INVALID_CIDR,
                ErrorCategory::Validation,
                format!("Invalid IP address '{}'", ip_str),
            ));
        };

        if let Some(requests) = vlsm_requests {
            if !requests.is_empty() && details.ip_version == "IPv4" {
                let allocations = self.plan_vlsm(cidr, &requests)?;
                details.vlsm_subnets = Some(allocations);
            }
        }

        Ok(details)
    }

    fn calculate_ipv4(&self, ip: Ipv4Addr, prefix: u8) -> AppResult<SubnetDetails> {
        let ip_u32 = u32::from(ip);
        let mask_u32 = if prefix == 0 {
            0u32
        } else {
            (!0u32) << (32 - prefix)
        };
        let wildcard_u32 = !mask_u32;
        let network_u32 = ip_u32 & mask_u32;
        let broadcast_u32 = ip_u32 | wildcard_u32;

        let network_ip = Ipv4Addr::from(network_u32);
        let broadcast_ip = Ipv4Addr::from(broadcast_u32);
        let netmask_ip = Ipv4Addr::from(mask_u32);
        let wildcard_ip = Ipv4Addr::from(wildcard_u32);

        let netmask_binary = format!(
            "{:08b}.{:08b}.{:08b}.{:08b}",
            (mask_u32 >> 24) & 0xff,
            (mask_u32 >> 16) & 0xff,
            (mask_u32 >> 8) & 0xff,
            mask_u32 & 0xff
        );

        let (total_hosts, usable_hosts, first_usable, last_usable) = match prefix {
            32 => (
                "1".to_string(),
                "1".to_string(),
                ip.to_string(),
                ip.to_string(),
            ),
            31 => (
                "2".to_string(),
                "2".to_string(),
                network_ip.to_string(),
                broadcast_ip.to_string(),
            ),
            _ => {
                let total = 2u64.pow(32 - prefix as u32);
                let usable = total.saturating_sub(2);
                let first = Ipv4Addr::from(network_u32 + 1).to_string();
                let last = Ipv4Addr::from(broadcast_u32 - 1).to_string();
                (total.to_string(), usable.to_string(), first, last)
            }
        };

        let first_octet = ip.octets()[0];
        let ip_class = match first_octet {
            1..=126 => Some("A".to_string()),
            128..=191 => Some("B".to_string()),
            192..=223 => Some("C".to_string()),
            224..=239 => Some("D (Multicast)".to_string()),
            240..=255 => Some("E (Experimental)".to_string()),
            _ => None,
        };

        let ip_addr = IpAddr::V4(ip);

        Ok(SubnetDetails {
            input_ip: ip.to_string(),
            prefix_length: prefix,
            ip_version: "IPv4".to_string(),
            network_address: network_ip.to_string(),
            broadcast_address: Some(broadcast_ip.to_string()),
            netmask: netmask_ip.to_string(),
            wildcard_mask: wildcard_ip.to_string(),
            netmask_binary,
            usable_range: UsableRange {
                first_usable,
                last_usable,
            },
            total_hosts,
            usable_hosts,
            ip_class,
            is_private: is_private(ip_addr),
            is_link_local: is_link_local(ip_addr),
            is_multicast: is_multicast(ip_addr),
            vlsm_subnets: None,
        })
    }

    fn calculate_ipv6(&self, ip: Ipv6Addr, prefix: u8) -> AppResult<SubnetDetails> {
        let ip_u128 = u128::from(ip);
        let mask_u128 = if prefix == 0 {
            0u128
        } else {
            (!0u128) << (128 - prefix)
        };
        let wildcard_u128 = !mask_u128;
        let network_u128 = ip_u128 & mask_u128;
        let broadcast_u128 = ip_u128 | wildcard_u128;

        let network_ip = Ipv6Addr::from(network_u128);
        let last_ip = Ipv6Addr::from(broadcast_u128);
        let netmask_ip = Ipv6Addr::from(mask_u128);
        let wildcard_ip = Ipv6Addr::from(wildcard_u128);

        let total_hosts_exp = 128 - prefix;
        let total_hosts = if total_hosts_exp <= 64 {
            format!("{}", 2u128.pow(total_hosts_exp as u32))
        } else {
            format!("2^{}", total_hosts_exp)
        };

        let usable_hosts = if total_hosts_exp <= 64 {
            format!("{}", 2u128.pow(total_hosts_exp as u32))
        } else {
            format!("2^{}", total_hosts_exp)
        };

        let first_usable = Ipv6Addr::from(network_u128 + 1).to_string();
        let last_usable = last_ip.to_string();

        let netmask_binary = (0..8)
            .map(|i| {
                let seg = (mask_u128 >> (112 - i * 16)) & 0xffff;
                format!("{:016b}", seg)
            })
            .collect::<Vec<_>>()
            .join(":");

        let ip_addr = IpAddr::V6(ip);

        Ok(SubnetDetails {
            input_ip: ip.to_string(),
            prefix_length: prefix,
            ip_version: "IPv6".to_string(),
            network_address: network_ip.to_string(),
            broadcast_address: None,
            netmask: netmask_ip.to_string(),
            wildcard_mask: wildcard_ip.to_string(),
            netmask_binary,
            usable_range: UsableRange {
                first_usable,
                last_usable,
            },
            total_hosts,
            usable_hosts,
            ip_class: None,
            is_private: is_private(ip_addr),
            is_link_local: is_link_local(ip_addr),
            is_multicast: is_multicast(ip_addr),
            vlsm_subnets: None,
        })
    }

    fn plan_vlsm(&self, parent_cidr: &str, requests: &[(String, u32)]) -> AppResult<Vec<VlsmSubnetAllocation>> {
        let parts: Vec<&str> = parent_cidr.split('/').collect();
        if parts.len() != 2 {
            return Err(AppError::new(
                ErrorCode::ERR_INVALID_CIDR,
                ErrorCategory::Validation,
                "Invalid parent CIDR format",
            ));
        }

        let base_ip = Ipv4Addr::from_str(parts[0]).map_err(|_| {
            AppError::new(
                ErrorCode::ERR_INVALID_CIDR,
                ErrorCategory::Validation,
                "Parent CIDR must be a valid IPv4 address for VLSM",
            )
        })?;
        let base_prefix: u8 = parts[1].parse().map_err(|_| {
            AppError::new(
                ErrorCode::ERR_INVALID_CIDR,
                ErrorCategory::Validation,
                "Parent prefix is invalid",
            )
        })?;

        let base_mask = if base_prefix == 0 { 0u32 } else { (!0u32) << (32 - base_prefix) };
        let base_net = u32::from(base_ip) & base_mask;
        let parent_broadcast = base_net | (!base_mask);

        // Sort descending by needed hosts
        let mut sorted_requests = requests.to_vec();
        sorted_requests.sort_by(|a, b| b.1.cmp(&a.1));

        let mut allocations = Vec::new();
        let mut current_ip = base_net;

        for (name, needed) in sorted_requests {
            // Needed hosts + 2 for network & broadcast
            let needed_total = if needed == 1 { 2 } else { needed + 2 };
            // Find smallest power of 2 >= needed_total
            let mut host_bits = 1u8;
            while (1u64 << host_bits) < (needed_total as u64) {
                host_bits += 1;
                if host_bits > 32 {
                    break;
                }
            }

            let prefix = 32 - host_bits;
            let block_size = 1u32 << host_bits;
            let allocated_hosts = if host_bits == 1 { 2 } else { block_size - 2 };

            let subnet_addr = Ipv4Addr::from(current_ip);
            let broadcast_addr = Ipv4Addr::from(current_ip + block_size - 1);

            if current_ip + block_size - 1 > parent_broadcast {
                return Err(AppError::new(
                    ErrorCode::ERR_INVALID_CIDR,
                    ErrorCategory::Validation,
                    format!(
                        "VLSM request '{}' for {} hosts exceeds available parent network space (/{}).",
                        name, needed, base_prefix
                    ),
                ));
            }

            let first_usable = Ipv4Addr::from(current_ip + 1);
            let last_usable = Ipv4Addr::from(current_ip + block_size - 2);

            allocations.push(VlsmSubnetAllocation {
                name,
                needed_hosts: needed,
                allocated_hosts,
                prefix,
                subnet_address: subnet_addr.to_string(),
                usable_range: format!("{} - {}", first_usable, last_usable),
                broadcast: broadcast_addr.to_string(),
            });

            current_ip += block_size;
        }

        Ok(allocations)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_calculate_ipv4_standard_c() {
        let calc = DefaultSubnetCalculator::new();
        let res = calc.calculate("192.168.10.0/24", None).unwrap();
        assert_eq!(res.network_address, "192.168.10.0");
        assert_eq!(res.broadcast_address.as_deref(), Some("192.168.10.255"));
        assert_eq!(res.netmask, "255.255.255.0");
        assert_eq!(res.usable_range.first_usable, "192.168.10.1");
        assert_eq!(res.usable_range.last_usable, "192.168.10.254");
        assert_eq!(res.total_hosts, "256");
        assert_eq!(res.usable_hosts, "254");
        assert_eq!(res.ip_class.as_deref(), Some("C"));
        assert!(res.is_private);
    }

    #[test]
    fn test_calculate_ipv4_point_to_point_31() {
        let calc = DefaultSubnetCalculator::new();
        let res = calc.calculate("10.0.0.0/31", None).unwrap();
        assert_eq!(res.usable_hosts, "2");
        assert_eq!(res.usable_range.first_usable, "10.0.0.0");
        assert_eq!(res.usable_range.last_usable, "10.0.0.1");
    }

    #[test]
    fn test_vlsm_allocation_success() {
        let calc = DefaultSubnetCalculator::new();
        let requests = vec![
            ("VLAN 10 Engineering".to_string(), 50),
            ("VLAN 20 Sales".to_string(), 25),
        ];
        let res = calc.calculate("192.168.10.0/24", Some(requests)).unwrap();
        let subnets = res.vlsm_subnets.unwrap();
        assert_eq!(subnets.len(), 2);
        assert_eq!(subnets[0].name, "VLAN 10 Engineering");
        assert_eq!(subnets[0].prefix, 26);
        assert_eq!(subnets[0].allocated_hosts, 62);
        assert_eq!(subnets[0].subnet_address, "192.168.10.0");

        assert_eq!(subnets[1].name, "VLAN 20 Sales");
        assert_eq!(subnets[1].prefix, 27);
        assert_eq!(subnets[1].allocated_hosts, 30);
        assert_eq!(subnets[1].subnet_address, "192.168.10.64");
    }

    #[test]
    fn test_vlsm_overflow_error() {
        let calc = DefaultSubnetCalculator::new();
        let requests = vec![
            ("Huge Subnet".to_string(), 300),
        ];
        let err = calc.calculate("192.168.1.0/24", Some(requests)).unwrap_err();
        assert_eq!(err.code, ErrorCode::ERR_INVALID_CIDR);
    }
}
