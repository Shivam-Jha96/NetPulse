use std::net::SocketAddr;
use std::time::{Duration, Instant};
use async_trait::async_trait;
use iptracer_core::error::{AppError, AppResult, ErrorCategory, ErrorCode};
use iptracer_core::net_traits::{NeighborEntry, PlatformSocketProvider, ProbeReply, RawProbe};

pub struct FallbackSocketProvider;

impl FallbackSocketProvider {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl PlatformSocketProvider for FallbackSocketProvider {
    async fn send_icmp_probe(&self, probe: RawProbe) -> AppResult<ProbeReply> {
        // Try TCP connect to port 53 (DNS) or 443 (HTTPS) to simulate an unprivileged ping RTT
        let test_port = 53;
        let test_addr = SocketAddr::new(probe.target.ip(), test_port);
        let start = Instant::now();

        let rtt = match tokio::time::timeout(probe.timeout, tokio::net::TcpStream::connect(test_addr)).await {
            Ok(Ok(_stream)) => start.elapsed(),
            Ok(Err(_)) => {
                // Connection rejected or reset still implies host responded!
                start.elapsed()
            }
            Err(_) => {
                return Err(AppError::new(
                    ErrorCode::ERR_TIMEOUT,
                    ErrorCategory::Network,
                    "Probe timed out",
                ));
            }
        };

        Ok(ProbeReply {
            sequence: probe.sequence,
            responder_ip: probe.target.ip(),
            rtt,
            reply_ttl: 56,
            is_destination: true,
            is_time_exceeded: false,
            is_fragmentation_needed: false,
            next_hop_mtu: None,
        })
    }

    async fn send_udp_probe(&self, _probe: RawProbe) -> AppResult<ProbeReply> {
        Err(AppError::new(
            ErrorCode::ERR_INTERNAL,
            ErrorCategory::Network,
            "UDP probe not available in fallback mode",
        ))
    }

    async fn send_tcp_connect_probe(&self, target: SocketAddr, timeout: Duration) -> AppResult<Duration> {
        let start = Instant::now();
        match tokio::time::timeout(timeout, tokio::net::TcpStream::connect(target)).await {
            Ok(Ok(_stream)) => Ok(start.elapsed()),
            Ok(Err(e)) => Err(AppError::new(ErrorCode::ERR_TIMEOUT, ErrorCategory::Network, e.to_string())),
            Err(_) => Err(AppError::new(ErrorCode::ERR_TIMEOUT, ErrorCategory::Network, "TCP connect timed out")),
        }
    }

    async fn read_os_neighbor_cache(&self, _interface_name: Option<&str>) -> AppResult<Vec<NeighborEntry>> {
        Ok(vec![])
    }
}
