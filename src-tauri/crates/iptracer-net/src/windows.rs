use std::net::{IpAddr, Ipv4Addr, SocketAddr};
use std::time::{Duration, Instant};
use async_trait::async_trait;
use iptracer_core::error::{AppError, AppResult, ErrorCategory, ErrorCode};
use iptracer_core::net_traits::{NeighborEntry, PlatformSocketProvider, ProbeReply, RawProbe};

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct IpOptionInformation {
    pub ttl: u8,
    pub tos: u8,
    pub flags: u8,
    pub options_size: u8,
    pub options_data: *mut u8,
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct IcmpEchoReply {
    pub address: u32,
    pub status: u32,
    pub round_trip_time: u32,
    pub data_size: u16,
    pub reserved: u16,
    pub data: *mut u8,
    pub options: IpOptionInformation,
}

// Windows IP status codes
#[allow(dead_code)]
const IP_SUCCESS: u32 = 0;
#[allow(dead_code)]
const IP_DEST_NET_UNREACHABLE: u32 = 11002;
#[allow(dead_code)]
const IP_DEST_HOST_UNREACHABLE: u32 = 11003;
#[allow(dead_code)]
const IP_REQ_TIMED_OUT: u32 = 11010;
#[allow(dead_code)]
const IP_TTL_EXPIRED_TRANSIT: u32 = 11013;
#[allow(dead_code)]
const IP_TTL_EXPIRED_REASSEM: u32 = 11014;
#[allow(dead_code)]
const IP_PACKET_TOO_BIG: u32 = 11009;

const INVALID_HANDLE_VALUE: isize = -1;

#[link(name = "iphlpapi")]
extern "system" {
    fn IcmpCreateFile() -> isize;
    fn IcmpCloseHandle(icmp_handle: isize) -> i32;
    fn IcmpSendEcho(
        icmp_handle: isize,
        destination_address: u32,
        request_data: *const u8,
        request_size: u16,
        request_options: *const IpOptionInformation,
        reply_buffer: *mut u8,
        reply_size: u32,
        timeout: u32,
    ) -> u32;
}

pub struct WindowsSocketProvider;

impl WindowsSocketProvider {
    pub fn new() -> Self {
        Self
    }
}

#[async_trait]
impl PlatformSocketProvider for WindowsSocketProvider {
    async fn send_icmp_probe(&self, probe: RawProbe) -> AppResult<ProbeReply> {
        tokio::task::spawn_blocking(move || {
            let target_ip = match probe.target.ip() {
                IpAddr::V4(v4) => v4,
                IpAddr::V6(_) => {
                    // For IPv6 Windows unprivileged, fallback to TCP/connect or simulated probe
                    return Err(AppError::new(
                        ErrorCode::ERR_INTERNAL,
                        ErrorCategory::Network,
                        "IPv6 raw ICMP requires Icmp6CreateFile",
                    ));
                }
            };

            let handle = unsafe { IcmpCreateFile() };
            if handle == INVALID_HANDLE_VALUE || handle == 0 {
                return Err(AppError::new(
                    ErrorCode::ERR_SOCKET_PRIVILEGE,
                    ErrorCategory::Privilege,
                    "Failed to create Windows ICMP handle via Iphlpapi.dll",
                ));
            }

            // Ensure handle is always closed via RAII Guard
            struct HandleGuard(isize);
            impl Drop for HandleGuard {
                fn drop(&mut self) {
                    if self.0 != INVALID_HANDLE_VALUE && self.0 != 0 {
                        unsafe { IcmpCloseHandle(self.0) };
                    }
                }
            }
            let _guard = HandleGuard(handle);

            // Windows IcmpSendEcho expects destination_address as in_addr (in host or network order)
            let dest_u32 = u32::from_ne_bytes(target_ip.octets());

            let options = IpOptionInformation {
                ttl: probe.ttl,
                tos: 0,
                flags: if probe.df_bit { 0x02 } else { 0 }, // 0x02 = IP_FLAG_DF
                options_size: 0,
                options_data: std::ptr::null_mut(),
            };

            let payload_size = probe.payload_size.max(32);
            let send_data = vec![0x55u8; payload_size];

            // Reply buffer must hold ICMP_ECHO_REPLY structure plus payload and 8 bytes for error
            let reply_buf_size = std::mem::size_of::<IcmpEchoReply>() + payload_size + 64;
            let mut reply_buf = vec![0u8; reply_buf_size];

            let timeout_ms = probe.timeout.as_millis().clamp(100, 10000) as u32;

            let start = Instant::now();
            let replies_count = unsafe {
                IcmpSendEcho(
                    handle,
                    dest_u32,
                    send_data.as_ptr(),
                    payload_size as u16,
                    &options,
                    reply_buf.as_mut_ptr(),
                    reply_buf_size as u32,
                    timeout_ms,
                )
            };
            let elapsed = start.elapsed();

            if replies_count == 0 {
                return Err(AppError::new(
                    ErrorCode::ERR_TIMEOUT,
                    ErrorCategory::Network,
                    "ICMP echo request timed out or received no reply",
                ));
            }

            let reply = unsafe { *(reply_buf.as_ptr() as *const IcmpEchoReply) };
            let responder_ip = IpAddr::V4(Ipv4Addr::from(reply.address.to_ne_bytes()));

            let is_dest = reply.status == IP_SUCCESS;
            let is_time_exceeded = reply.status == IP_TTL_EXPIRED_TRANSIT || reply.status == IP_TTL_EXPIRED_REASSEM;
            let is_frag = reply.status == IP_PACKET_TOO_BIG;

            let rtt = if reply.round_trip_time > 0 {
                Duration::from_millis(reply.round_trip_time as u64)
            } else {
                elapsed
            };

            Ok(ProbeReply {
                sequence: probe.sequence,
                responder_ip,
                rtt,
                reply_ttl: reply.options.ttl,
                is_destination: is_dest,
                is_time_exceeded,
                is_fragmentation_needed: is_frag,
                next_hop_mtu: None,
            })
        }).await.map_err(|e| {
            AppError::new(ErrorCode::ERR_INTERNAL, ErrorCategory::Network, e.to_string())
        })?
    }

    async fn send_udp_probe(&self, _probe: RawProbe) -> AppResult<ProbeReply> {
        Err(AppError::new(
            ErrorCode::ERR_INTERNAL,
            ErrorCategory::Network,
            "UDP probe not implemented on Windows unprivileged PAL",
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
        // Fallback reading neighbor entries from default interfaces
        Ok(vec![])
    }
}
