use std::net::{IpAddr, SocketAddr};
use std::time::Duration;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::error::AppResult;

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ProbeProtocol {
    Icmp,
    Udp,
    Tcp,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RawProbe {
    pub sequence: u16,
    pub ttl: u8,
    pub payload_size: usize,
    pub df_bit: bool,
    pub target: SocketAddr,
    pub protocol: ProbeProtocol,
    pub timeout: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProbeReply {
    pub sequence: u16,
    pub responder_ip: IpAddr,
    pub rtt: Duration,
    pub reply_ttl: u8,
    pub is_destination: bool,
    pub is_time_exceeded: bool,
    pub is_fragmentation_needed: bool,
    pub next_hop_mtu: Option<u16>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct NeighborEntry {
    pub ip: IpAddr,
    pub mac: [u8; 6],
    pub interface_name: String,
    pub is_gateway: bool,
}

#[async_trait]
pub trait PlatformSocketProvider: Send + Sync {
    /// Dispatches an unprivileged ICMP Echo probe and awaits response
    async fn send_icmp_probe(&self, probe: RawProbe) -> AppResult<ProbeReply>;

    /// Dispatches an unprivileged UDP probe with custom TTL
    async fn send_udp_probe(&self, probe: RawProbe) -> AppResult<ProbeReply>;

    /// Tests TCP connection establishment to target port
    async fn send_tcp_connect_probe(&self, target: SocketAddr, timeout: Duration) -> AppResult<Duration>;

    /// Queries the local OS ARP/NDP table for a given interface
    async fn read_os_neighbor_cache(&self, interface_name: Option<&str>) -> AppResult<Vec<NeighborEntry>>;
}
