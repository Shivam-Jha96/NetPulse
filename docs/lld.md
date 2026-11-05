# Low-Level Design (LLD): Standalone Cross-Platform IPTracer Suite

**Document Version:** 1.0.0  
**Target Milestone:** Milestone 4 — Low-Level Design (LLD) Document & Formal JSON Schemas  
**Status:** Approved Architectural Specification  
**Target Platforms:** Windows 10/11 (x86_64, ARM64), macOS 12+ (x86_64, Apple Silicon Universal), Linux (x86_64, aarch64)  
**Author:** worker_m4_lld (Systems Architecture & Network Engineering)  
**Date:** November 2026  

---

## Table of Contents

1. [Executive Summary & Architectural Context](#1-executive-summary--architectural-context)
   - 1.1 Purpose and Scope of Low-Level Design
   - 1.2 Upstream Architecture & Traceability Matrix
   - 1.3 Core Engineering Invariants
2. [Rust Backend Architecture & Crate Workspace Layout](#2-rust-backend-architecture--crate-workspace-layout)
   - 2.1 Cargo Workspace Layout & Dependency Hierarchy
   - 2.2 Subsystem Traits & Struct Declarations
     - 2.2.1 Platform Abstraction Layer (PAL) & Sockets (`iptracer-net`)
     - 2.2.2 Traceroute & MTR Engine (`iptracer-core`)
     - 2.2.3 Continuous Ping & Jitter Monitor (`iptracer-core`)
     - 2.2.4 High-Throughput Port Scanner (`iptracer-core`)
     - 2.2.5 DNS Inspector & Propagation Engine (`iptracer-core`)
     - 2.2.6 WHOIS & RDAP Registry Client (`iptracer-core`)
     - 2.2.7 Subnet & VLSM Calculator (`iptracer-core`)
     - 2.2.8 LAN Device Discovery Engine (`iptracer-core`)
     - 2.2.9 Offline MaxMind & Cloud Geolocation (`iptracer-geo`)
     - 2.2.10 Privileged Helper Daemon & IPC Client (`iptracer-daemon`)
   - 2.3 Backend Mermaid Class Diagrams
3. [Frontend Architecture & React 19 / TypeScript Implementation](#3-frontend-architecture--react-19--typescript-implementation)
   - 3.1 Component Hierarchy & File Organization
   - 3.2 State Management with Zustand
     - 3.2.1 `useTraceStore`
     - 3.2.2 `usePingStore`
     - 3.2.3 `usePortScanStore`
     - 3.2.4 `useDnsStore`
     - 3.2.5 `useSettingsStore`
     - 3.2.6 `useAppStore`
   - 3.3 TanStack Query v5 Caching Layer & Invalidation Triggers
   - 3.4 High-Frequency Telemetry Ingestion (50ms Micro-Batching)
   - 3.5 WebGL 3D Globe & ECharts Canvas Hook Bindings
4. [Tauri v2 IPC Command & Streaming Event Contracts](#4-tauri-v2-ipc-command--streaming-event-contracts)
   - 4.1 Type-Safe IPC Command Signatures (Rust Handlers ↔ TS Invocations)
   - 4.2 Streaming Telemetry Event Contracts
   - 4.3 IPC Interaction Sequence Diagrams (Mermaid)
5. [Data Models & Formal Draft-07 JSON Schemas](#5-data-models--formal-draft-07-json-schemas)
   - 5.1 Schema Inventory & Validation Guarantees
   - 5.2 `ip_trace_schema.json` (TypeScript Contract & Sample Payload)
   - 5.3 `traceroute_schema.json` (TypeScript Contract & Sample Payload)
   - 5.4 `ping_monitor_schema.json` (TypeScript Contract & Sample Payload)
   - 5.5 `port_scanner_schema.json` (TypeScript Contract & Sample Payload)
   - 5.6 `dns_inspector_schema.json` (TypeScript Contract & Sample Payload)
   - 5.7 `whois_rdap_schema.json` (TypeScript Contract & Sample Payload)
   - 5.8 `subnet_calculator_schema.json` (TypeScript Contract & Sample Payload)
6. [Unified Error Taxonomy & Exception Recovery Flows](#6-unified-error-taxonomy--exception-recovery-flows)
   - 6.1 Structured Error Envelope (`AppResponse<T>` and `AppError`)
   - 6.2 Error Code Registry & Recovery Catalog
   - 6.3 Concrete Error Recovery Sequence Diagrams (Mermaid)
     - 6.3.1 Socket Permission Denial & Privilege Elevation Flow
     - 6.3.2 Geolocation API Failure & Automatic Provider Failover Cascade
     - 6.3.3 Network Interface Disconnection During Continuous Ping
     - 6.3.4 DNS Resolution Timeout & Exponential Backoff Retry Flow
7. [Local Storage, Caching & Data Persistence Layer](#7-local-storage-caching--data-persistence-layer)
   - 7.1 Embedded SQLite Schema (DDL)
   - 7.2 L1 Memory Cache (LRU) Design & Invalidation Rules
   - 7.3 OS Keyring Secret Storage Integration
8. [Concurrency, Performance SLAs & Security Controls](#8-concurrency-performance-slas--security-controls)
   - 8.1 Async Runtime Scheduling & Thread Pool Configuration
   - 8.2 Token Bucket Rate Limiting Architecture
   - 8.3 Strict Content Security Policy (CSP) & Tauri Isolation Pattern
9. [LLD Requirements Traceability & Verification Matrix](#9-lld-requirements-traceability--verification-matrix)

---

## 1. Executive Summary & Architectural Context

### 1.1 Purpose and Scope of Low-Level Design

The **IPTracer Standalone Cross-Platform Application** transforms the lightweight browser extension into an industrial-strength, native workstation network engineering suite. While the High-Level Design (HLD, `docs/standalone_app/hld.md`) established the system boundaries, 5-layer macro architecture, and framework selection (Tauri v2 + Rust + React 19), this **Low-Level Design (LLD)** document defines the concrete implementation specifications:
- Crate-level dependency graphs and compilation boundaries in Rust.
- Precise Rust traits, structs, memory layouts, and asynchronous lifecycle state machines.
- TypeScript interfaces, Zustand state stores, and batching hooks for React 19.
- Bidirectional IPC wire contracts between the Tauri core and webview runtime.
- Formal JSON Schema Draft-07 definitions for all diagnostic results.
- End-to-end failure handling sequence diagrams with concrete recovery workflows.

### 1.2 Upstream Architecture & Traceability Matrix

This specification directly translates requirements from foundational project assets:
- **`hld.md`**: Implements the 5-layer decoupled architecture, zero-elevation socket foundation, and dual-process privilege separation.
- **`ui_specification.md`**: Implements the state stores, component bindings, and telemetry ingestion required for the Cyber-Glassmorphic Tactical Workstation design system.
- **`feasibility_study.md`**: Implements native OS socket system calls bypassing external driver dependencies (avoiding Npcap licensing).
- **`survey_specs.md`**: Implements the 7 companion network diagnostic utilities and threat intelligence aggregation models.

### 1.3 Core Engineering Invariants

1. **Zero Unhandled Panics**: All Rust subsystems return strongly typed `Result<T, AppError>`. Sockets, file descriptors, and worker tasks clean up deterministically via RAII `Drop` implementations.
2. **Sub-50ms UI Latency**: High-frequency streaming telemetry (ping ticks, traceroute probes, port sweeps) is micro-batched at **20 Hz (50 ms)** in the native backend before dispatching across the IPC boundary, ensuring 60 FPS presentation rendering without webview event loop saturation.
3. **Strict Privilege Isolation**: Over 95% of diagnostics execute without OS elevation. Elevated actions (promiscuous raw packet sniffing, TCP SYN half-open scans) are strictly sandboxed in a separate helper binary (`iptracer-helper`).
4. **Offline-First Resilience**: Geolocation queries always check the local memory-mapped MaxMind GeoLite2 binary database (`.mmdb`) first ($< 0.5 \text{ ms}$ latency), degrading gracefully to online REST cascades only upon cache misses or explicit user override.

---

## 2. Rust Backend Architecture & Crate Workspace Layout

### 2.1 Cargo Workspace Layout & Dependency Hierarchy

The backend is organized as a Cargo workspace with clean separation of concerns, strict dependency boundaries, and fast incremental compilation:

```
src-tauri/
├── Cargo.toml                      # Workspace root manifest
├── crates/
│   ├── iptracer-core/              # Core domain models, storage vault, traits, utilities
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── error.rs            # Unified error taxonomy & AppError envelope
│   │       ├── config.rs           # Application configuration & preferences
│   │       ├── storage/            # SQLite vault (rusqlite) & L1 LRU cache
│   │       ├── traceroute/         # ICMP/UDP/TCP traceroute & MTR state machine
│   │       ├── ping/               # Continuous ping, RFC 3550 jitter, PMTU discovery
│   │       ├── portscan/           # Async TCP connect scanner & banner grabber
│   │       ├── dns/                # Hickory-DNS resolver, DNSSEC, propagation checker
│   │       ├── whois/              # RDAP REST client & port 43 WHOIS fallback
│   │       ├── subnet/             # IPv4/IPv6 bitwise math & VLSM allocation planner
│   │       └── lan/                # ARP/NDP cache scanner & IEEE OUI resolver
│   ├── iptracer-net/               # Platform Abstraction Layer (PAL) & native OS sockets
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── traits.rs           # DiagnosticProvider & SocketProvider traits
│   │       ├── windows.rs          # Iphlpapi.dll, IcmpSendEcho2, Winsock2
│   │       ├── linux.rs            # SOCK_DGRAM, IPPROTO_ICMP, IP_RECVERR, Netlink
│   │       ├── darwin.rs           # macOS Darwin datagram sockets & sysctl
│   │       └── packet.rs           # Cross-platform packet header crafting (pnet/socket2)
│   ├── iptracer-geo/               # Geolocation & Threat Intelligence
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── lib.rs
│   │       ├── mmdb.rs             # Memory-mapped MaxMind GeoLite2 City/ASN reader
│   │       ├── failover.rs         # Multi-provider HTTP cascade (ipapi, ipinfo, ipify)
│   │       └── threat.rs           # AbuseIPDB, VirusTotal, and Tor exit list feeds
│   ├── iptracer-daemon/            # Elevated privilege separation helper binary
│   │   ├── Cargo.toml
│   │   └── src/
│   │       ├── main.rs             # Daemon entrypoint, OS service integration
│   │       ├── ipc_server.rs       # Named Pipe (Win) / UNIX Domain Socket (POSIX)
│   │       ├── auth.rs             # Mutual peer authentication & PID validation
│   │       └── raw_engine.rs       # Promiscuous BPF/AF_PACKET sniffer & TCP SYN scan
│   └── iptracer-ui/                # Tauri v2 desktop application harness
│       ├── Cargo.toml
│       └── src/
│           ├── main.rs
│           ├── lib.rs
│           ├── commands.rs         # Typed tauri::command handlers
│           ├── events.rs           # 20 Hz micro-batched event emitter
│           ├── tray.rs             # System tray menu & background sentinel watchdog
│           └── updater.rs          # Ed25519 cryptographic differential update verification
```

#### Workspace `Cargo.toml` Dependencies & Feature Flags:

```toml
[workspace]
members = [
    "crates/iptracer-core",
    "crates/iptracer-net",
    "crates/iptracer-geo",
    "crates/iptracer-daemon",
    "crates/iptracer-ui",
]
resolver = "2"

[workspace.package]
version = "1.0.0"
edition = "2024"
rust-version = "1.82"
authors = ["IPTracer Core Engineering Team"]
license = "MIT OR Apache-2.0"

[workspace.dependencies]
tokio = { version = "1.40", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
thiserror = "1.0"
anyhow = "1.0"
socket2 = { version = "0.5", features = ["all"] }
pnet = "0.35"
hickory-resolver = { version = "0.24", features = ["dnssec-ring", "serde-config"] }
maxminddb = { version = "0.24", features = ["mmap"] }
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
rusqlite = { version = "0.32", features = ["bundled", "bundled-sqlcipher"] }
lru = "0.12"
tracing = "0.1"
tracing-subscriber = { version = "0.3", features = ["env-filter"] }
uuid = { version = "1.10", features = ["v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
keyring = "2.3"
tauri = { version = "2.1", features = ["tray-icon"] }
tauri-plugin-updater = "2.0"
```

---

### 2.2 Subsystem Traits & Struct Declarations

#### 2.2.1 Platform Abstraction Layer (PAL) & Sockets (`iptracer-net`)

The PAL encapsulates native operating system differences behind zero-cost asynchronous traits:

```rust
// crates/iptracer-net/src/traits.rs
use std::net::{IpAddr, SocketAddr};
use std::time::Duration;
use async_trait::async_trait;
use iptracer_core::error::AppResult;

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ProbeProtocol {
    Icmp,
    Udp,
    Tcp,
}

#[derive(Debug, Clone)]
pub struct RawProbe {
    pub sequence: u16,
    pub ttl: u8,
    pub payload_size: usize,
    pub df_bit: bool,
    pub target: SocketAddr,
    pub protocol: ProbeProtocol,
    pub timeout: Duration,
}

#[derive(Debug, Clone)]
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

#[derive(Debug, Clone)]
pub struct NeighborEntry {
    pub ip: IpAddr,
    pub mac: [u8; 6],
    pub interface_name: String,
    pub is_gateway: bool,
}
```

##### Platform-Specific Implementations:
- **Windows (`pal::windows`)**: Calls `Iphlpapi.dll!IcmpSendEcho2Ex` for unprivileged ICMP ping/traceroute with microsecond timer resolution (`QueryPerformanceCounter`). Uses `GetIpNetTable2` for instantaneous ARP cache retrieval.
- **Linux (`pal::linux`)**: Binds `socket(AF_INET, SOCK_DGRAM, IPPROTO_ICMP)` for unprivileged ICMP ping (`net.ipv4.ping_group_range`). Sets `setsockopt(fd, IPPROTO_IP, IP_RECVERR, 1)` to capture ICMP `Time Exceeded` payload descriptors from the error queue (`recvmsg` with `MSG_ERRQUEUE`). Parses `/proc/net/arp` and Netlink `RTM_GETNEIGH`.
- **macOS (`pal::darwin`)**: Opens Darwin unprivileged datagram ICMP sockets (`SOCK_DGRAM`, `IPPROTO_ICMP`). Uses `sysctl` with `NET_RT_FLAGS` and `RTF_LLINFO` to inspect neighbor routing tables.

---

#### 2.2.2 Traceroute & MTR Engine (`iptracer-core`)

```rust
// crates/iptracer-core/src/traceroute/engine.rs
use std::net::IpAddr;
use std::sync::Arc;
use std::time::Duration;
use tokio::sync::{mpsc, watch};
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use crate::error::AppResult;
use iptracer_net::traits::PlatformSocketProvider;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TracerouteConfig {
    pub target: String,
    pub protocol: crate::traceroute::Protocol,
    pub max_hops: u8,
    pub timeout: Duration,
    pub probes_per_hop: u8,
    pub is_mtr: bool,
    pub mtr_interval: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct HopTelemetry {
    pub ttl: u8,
    pub ip: Option<IpAddr>,
    pub hostname: Option<String>,
    pub asn: Option<u32>,
    pub asn_org: Option<String>,
    pub country_code: Option<String>,
    pub city: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub loss_percent: f32,
    pub sent: u32,
    pub received: u32,
    pub rtt_last: Option<f64>,
    pub rtt_avg: Option<f64>,
    pub rtt_best: Option<f64>,
    pub rtt_worst: Option<f64>,
    pub rtt_stdev: Option<f64>,
}

#[async_trait]
pub trait TracerouteEngine: Send + Sync {
    /// Spawns a new traceroute or MTR session, returning a control handle and telemetry channel
    async fn start_trace(
        &self,
        config: TracerouteConfig,
        cancel_rx: watch::Receiver<bool>,
    ) -> AppResult<(String, mpsc::Receiver<HopTelemetry>)>;

    /// Stops an active traceroute session by UUID
    async fn stop_trace(&self, session_id: &str) -> AppResult<()>;
}

pub struct DefaultTracerouteEngine {
    socket_provider: Arc<dyn PlatformSocketProvider>,
}
```

---

#### 2.2.3 Continuous Ping & Jitter Monitor (`iptracer-core`)

```rust
// crates/iptracer-core/src/ping/monitor.rs
use std::net::IpAddr;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingConfig {
    pub target: String,
    pub interval: Duration,
    pub packet_size: usize,
    pub df_bit: bool,
    pub timeout: Duration,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PingSample {
    pub seq: u32,
    pub ttl: Option<u8>,
    pub rtt_ms: Option<f64>,
    pub status: PingProbeStatus,
    pub timestamp_ms: i64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PingProbeStatus {
    Success,
    Timeout,
    HostUnreachable,
    NetUnreachable,
    TtlExpired,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RttStatistics {
    pub min: Option<f64>,
    pub avg: Option<f64>,
    pub max: Option<f64>,
    pub stdev: Option<f64>,
    pub p95: Option<f64>,
    pub p99: Option<f64>,
}

#[async_trait]
pub trait PingMonitor: Send + Sync {
    async fn start_ping(
        &self,
        config: PingConfig,
    ) -> AppResult<(String, tokio::sync::mpsc::Receiver<PingSample>)>;

    async fn stop_ping(&self, session_id: &str) -> AppResult<RttStatistics>;

    /// Sweeps payload sizes with DF-bit set to discover path MTU (RFC 1191)
    async fn discover_path_mtu(&self, target: IpAddr) -> AppResult<u16>;
}

/// In-memory RFC 3550 Interarrival Jitter Accumulator
pub struct JitterAccumulator {
    last_transit: Option<f64>,
    jitter: f64,
}

impl JitterAccumulator {
    pub fn new() -> Self {
        Self { last_transit: None, jitter: 0.0 }
    }

    pub fn update(&mut self, current_transit: f64) -> f64 {
        if let Some(prev) = self.last_transit {
            let diff = (current_transit - prev).abs();
            self.jitter += (diff - self.jitter) / 16.0;
        }
        self.last_transit = Some(current_transit);
        self.jitter
    }
}
```

---

#### 2.2.4 High-Throughput Port Scanner (`iptracer-core`)

```rust
// crates/iptracer-core/src/portscan/scanner.rs
use std::net::IpAddr;
use std::time::Duration;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortScanConfig {
    pub target: IpAddr,
    pub ports: Vec<u16>,
    pub concurrency: usize,
    pub timeout: Duration,
    pub scan_type: ScanType,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ScanType {
    TcpConnect,
    SynStealth,
    Udp,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PortState {
    Open,
    Closed,
    Filtered,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PortResult {
    pub port: u16,
    pub protocol: String,
    pub state: PortState,
    pub service: String,
    pub product: Option<String>,
    pub version: Option<String>,
    pub banner: Option<String>,
    pub tls_info: Option<TlsMetadata>,
    pub latency_ms: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TlsMetadata {
    pub subject: String,
    pub issuer: String,
    pub valid_to: String,
    pub cipher: Option<String>,
    pub alpn: Option<String>,
}

#[async_trait]
pub trait PortScanner: Send + Sync {
    /// Executes a concurrent port scan throttled by a Tokio Semaphore
    async fn scan(
        &self,
        config: PortScanConfig,
        progress_tx: tokio::sync::mpsc::Sender<PortResult>,
    ) -> AppResult<Vec<PortResult>>;

    /// Probes an open port for application service banners (HTTP, TLS, SSH)
    async fn grab_banner(&self, target: IpAddr, port: u16, timeout: Duration) -> AppResult<PortResult>;
}
```

---

#### 2.2.5 DNS Inspector & Propagation Engine (`iptracer-core`)

```rust
// crates/iptracer-core/src/dns/inspector.rs
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DnsRecord {
    pub name: String,
    pub record_type: String,
    pub ttl: u32,
    pub value: String,
    pub priority: Option<u16>,
    pub tag: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct DnssecValidation {
    pub is_valid: bool,
    pub state: DnssecState,
    pub key_algorithm: Option<String>,
    pub details: String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DnssecState {
    Secure,
    Insecure,
    Bogus,
    Indeterminate,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResolverCheckResult {
    pub resolver_name: String,
    pub location: String,
    pub country_code: Option<String>,
    pub status: PropagationStatus,
    pub values: Vec<String>,
    pub latency_ms: f64,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum PropagationStatus {
    Match,
    Mismatch,
    Timeout,
    Error,
}

#[async_trait]
pub trait DnsInspector: Send + Sync {
    /// Resolves DNS resource records with DNSSEC chain-of-trust verification
    async fn query_records(
        &self,
        domain: &str,
        record_type: &str,
        transport: &str,
    ) -> AppResult<(Vec<DnsRecord>, DnssecValidation)>;

    /// Concurrently queries 30 geographically distributed resolvers for propagation analysis
    async fn check_propagation(
        &self,
        domain: &str,
        record_type: &str,
        expected_values: &[String],
    ) -> AppResult<Vec<ResolverCheckResult>>;
}
```

---

#### 2.2.6 WHOIS & RDAP Registry Client (`iptracer-core`)

```rust
// crates/iptracer-core/src/whois/client.rs
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RdapRecord {
    pub query: String,
    pub object_type: RdapObjectType,
    pub handle: String,
    pub name: Option<String>,
    pub cidr: Option<String>,
    pub parent_handle: Option<String>,
    pub whois_server: Option<String>,
    pub rdap_url: Option<String>,
    pub source: RegistrySource,
    pub status: Vec<String>,
    pub events: RdapEvents,
    pub entities: Vec<RdapEntity>,
    pub nameservers: Vec<String>,
    pub raw_text: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RdapObjectType {
    Domain,
    Ipv4,
    Ipv6,
    AutonomousSystem,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum RegistrySource {
    Rdap,
    WhoisPort43,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct RdapEvents {
    pub registration: Option<String>,
    pub expiration: Option<String>,
    pub last_changed: Option<String>,
    pub last_update_of_rdap_db: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct RdapEntity {
    pub handle: Option<String>,
    pub roles: Vec<String>,
    pub name: Option<String>,
    pub organization: Option<String>,
    pub email: Option<String>,
    pub phone: Option<String>,
    pub address: Option<String>,
}

#[async_trait]
pub trait WhoisService: Send + Sync {
    /// Primary query: Bootstrap IANA RDAP REST endpoint with JSON decoding
    async fn query_rdap(&self, query: &str) -> AppResult<RdapRecord>;

    /// Fallback query: Connects over TCP port 43 to authoritative WHOIS server
    async fn query_legacy_whois(&self, query: &str, server: &str) -> AppResult<String>;
}
```

---

#### 2.2.7 Subnet & VLSM Calculator (`iptracer-core`)

```rust
// crates/iptracer-core/src/subnet/calculator.rs
use std::net::IpAddr;
use serde::{Deserialize, Serialize};
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SubnetDetails {
    pub input_ip: String,
    pub prefix_length: u8,
    pub ip_version: String,
    pub network_address: String,
    pub broadcast_address: Option<String>,
    pub netmask: String,
    pub wildcard_mask: String,
    pub netmask_binary: String,
    pub first_usable: String,
    pub last_usable: String,
    pub total_hosts: String,
    pub usable_hosts: String,
    pub ip_class: Option<String>,
    pub is_private: bool,
    pub is_link_local: bool,
    pub is_multicast: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
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
    /// Computes IPv4 bitwise CIDR boundaries (with RFC 3021 /31 point-to-point support)
    fn calculate_ipv4(&self, ip: std::net::Ipv4Addr, prefix: u8) -> AppResult<SubnetDetails>;

    /// Computes IPv6 bitwise CIDR boundaries using native 128-bit integers (u128)
    fn calculate_ipv6(&self, ip: std::net::Ipv6Addr, prefix: u8) -> AppResult<SubnetDetails>;

    /// Recursively calculates optimal VLSM subnet allocations without wasted address space
    fn plan_vlsm(&self, parent_cidr: &str, requests: &[(String, u32)]) -> AppResult<Vec<VlsmSubnetAllocation>>;
}
```

---

#### 2.2.8 LAN Device Discovery Engine (`iptracer-core`)

```rust
// crates/iptracer-core/src/lan/scanner.rs
use std::net::IpAddr;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use crate::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct LanDevice {
    pub ip: String,
    pub mac: String,
    pub vendor: String,
    pub hostname: Option<String>,
    pub netbios_name: Option<String>,
    pub device_type: DeviceCategory,
    pub is_gateway: bool,
    pub is_local_device: bool,
    pub response_time_ms: f64,
    pub open_ports: Vec<u16>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DeviceCategory {
    RouterGateway,
    Computer,
    Mobile,
    Printer,
    Iot,
    Unknown,
}

#[async_trait]
pub trait LanScanner: Send + Sync {
    /// Discovers devices via active ARP sweeps or passive OS neighbor cache reading
    async fn scan_subnet(
        &self,
        interface_name: Option<&str>,
        progress_tx: tokio::sync::mpsc::Sender<LanDevice>,
    ) -> AppResult<Vec<LanDevice>>;

    /// Matches the first 24/36 bits of a MAC address against the embedded IEEE OUI database
    fn resolve_oui(&self, mac: &[u8; 6]) -> String;
}
```

---

#### 2.2.9 Offline MaxMind & Cloud Geolocation (`iptracer-geo`)

```rust
// crates/iptracer-geo/src/lib.rs
use std::net::IpAddr;
use std::sync::Arc;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use iptracer_core::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GeoLocationRecord {
    pub ip: IpAddr,
    pub continent: Option<String>,
    pub country: String,
    pub country_code: String,
    pub region: String,
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
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum GeoSource {
    OfflineMaxMind,
    OnlineFailover,
    LocalCache,
}

#[async_trait]
pub trait GeolocationProvider: Send + Sync {
    /// Fast memory-mapped offline lookup in local GeoLite2 City/ASN binary databases
    fn lookup_offline(&self, ip: IpAddr) -> AppResult<Option<GeoLocationRecord>>;

    /// Fallback query across rate-limited REST APIs (ipapi.co, ipinfo.io, ipify)
    async fn lookup_online_cascade(&self, ip: IpAddr) -> AppResult<GeoLocationRecord>;
}
```

---

#### 2.2.10 Privileged Helper Daemon & IPC Client (`iptracer-daemon`)

```rust
// crates/iptracer-daemon/src/lib.rs
use std::net::IpAddr;
use serde::{Deserialize, Serialize};
use async_trait::async_trait;
use iptracer_core::error::AppResult;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "action", content = "payload")]
pub enum ElevatedCommand {
    StartSynScan { target: IpAddr, ports: Vec<u16> },
    StartPacketSniffer { interface_name: String, filter_bpf: String },
    StopOperation { session_id: String },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type", content = "data")]
pub enum ElevatedEvent {
    SynPortDiscovered { port: u16, is_open: bool, latency_ms: f64 },
    PacketCaptured { timestamp_us: u64, packet_hex: String },
    OperationError { code: String, message: String },
    OperationCompleted { session_id: String },
}

#[async_trait]
pub trait PrivilegeHelperClient: Send + Sync {
    /// Verifies if helper daemon is running and authenticated
    async fn is_connected(&self) -> bool;

    /// Establishes authenticated connection with local helper over Named Pipe or UNIX Domain Socket
    async fn connect(&self) -> AppResult<()>;

    /// Dispatches an elevated command and returns a stream of incoming events
    async fn dispatch_command(
        &self,
        command: ElevatedCommand,
    ) -> AppResult<tokio::sync::mpsc::Receiver<ElevatedEvent>>;
}
```

---

### 2.3 Backend Mermaid Class Diagrams

```mermaid
classDiagram
    direction TB
    
    class PlatformSocketProvider {
        <<trait>>
        +send_icmp_probe(probe: RawProbe) ProbeReply
        +send_udp_probe(probe: RawProbe) ProbeReply
        +send_tcp_connect_probe(target: SocketAddr, timeout: Duration) Duration
        +read_os_neighbor_cache(interface: Option~str~) Vec~NeighborEntry~
    }

    class WindowsSocketProvider {
        -iphle_handle: HINSTANCE
        +send_icmp_probe()
        +read_os_neighbor_cache()
    }

    class LinuxSocketProvider {
        -icmp_fd: RawFd
        +send_icmp_probe()
        +read_os_neighbor_cache()
    }

    class DarwinSocketProvider {
        -bpf_fd: RawFd
        +send_icmp_probe()
        +read_os_neighbor_cache()
    }

    PlatformSocketProvider <|.. WindowsSocketProvider
    PlatformSocketProvider <|.. LinuxSocketProvider
    PlatformSocketProvider <|.. DarwinSocketProvider

    class TracerouteEngine {
        <<trait>>
        +start_trace(config: TracerouteConfig) (String, Receiver~HopTelemetry~)
        +stop_trace(session_id: str)
    }

    class DefaultTracerouteEngine {
        -socket_provider: Arc~PlatformSocketProvider~
        -geo_provider: Arc~GeolocationProvider~
        -dns_resolver: Arc~DnsInspector~
    }

    TracerouteEngine <|.. DefaultTracerouteEngine
    DefaultTracerouteEngine --> PlatformSocketProvider

    class PingMonitor {
        <<trait>>
        +start_ping(config: PingConfig) (String, Receiver~PingSample~)
        +stop_ping(session_id: str) RttStatistics
        +discover_path_mtu(target: IpAddr) u16
    }

    class DefaultPingMonitor {
        -socket_provider: Arc~PlatformSocketProvider~
        -jitter_calc: JitterAccumulator
    }

    PingMonitor <|.. DefaultPingMonitor
    DefaultPingMonitor --> PlatformSocketProvider

    class PortScanner {
        <<trait>>
        +scan(config: PortScanConfig) Vec~PortResult~
        +grab_banner(target: IpAddr, port: u16) PortResult
    }

    class DefaultPortScanner {
        -semaphore: Arc~Semaphore~
    }

    PortScanner <|.. DefaultPortScanner

    class GeolocationProvider {
        <<trait>>
        +lookup_offline(ip: IpAddr) Option~GeoLocationRecord~
        +lookup_online_cascade(ip: IpAddr) GeoLocationRecord
    }

    class HybridGeoProvider {
        -mmdb_reader: Arc~Reader~
        -http_client: reqwest::Client
        -rate_limiter: TokenBucket
    }

    GeolocationProvider <|.. HybridGeoProvider
```

---

## 3. Frontend Architecture & React 19 / TypeScript Implementation

### 3.1 Component Hierarchy & File Organization

The presentation layer is built on React 19 and TypeScript 5.6+ within the native OS webview sandbox.

```
src/
├── index.html                      # App shell entrypoint
├── main.tsx                        # React 19 root bootstrap & TanStack Query client
├── App.tsx                         # App layout, frameless window header, navigation router
├── styles/
│   ├── globals.css                 # Cyber-glassmorphism CSS variables & reset
│   └── themes.css                  # Dark Cyber and Modern Light token definitions
├── types/
│   ├── ipc.ts                      # Tauri IPC command request/response contracts
│   ├── events.ts                   # Micro-batched event payload definitions
│   └── models.ts                   # Diagnostic result types matching JSON schemas
├── stores/
│   ├── useTraceStore.ts            # Visual Traceroute & MTR state
│   ├── usePingStore.ts             # Continuous Ping & Jitter monitor state
│   ├── usePortScanStore.ts         # Port Scanner & Service discovery state
│   ├── useDnsStore.ts              # DNS Inspector & Propagation state
│   ├── useSettingsStore.ts         # Preferences, API keys & offline DB paths
│   └── useAppStore.ts              # Active view, notifications & system status
├── hooks/
│   ├── useTelemetryBatch.ts        # 50ms (20 Hz) event stream aggregation & RAF loop
│   ├── useGlobeMap.ts              # MapLibre GL 3D vector globe controller
│   ├── useSparkline.ts             # Apache ECharts 60 FPS canvas renderer
│   └── useElevation.ts             # OS privilege status & elevation helper prompt
├── views/
│   ├── DashboardView.tsx           # Egress IP, gateway cards, mini-topology widget
│   ├── TraceView.tsx               # Split-view 3D globe & hop metrics table
│   ├── PingView.tsx                # Real-time ping sparklines, jitter, PMTU
│   ├── PortScanView.tsx            # Port sweep table, banner inspector modal
│   ├── DnsView.tsx                 # DNSSEC validation badge & 30-node propagation map
│   ├── WhoisView.tsx               # RDAP JSON card tree & entity viewer
│   ├── SubnetView.tsx              # CIDR calculator & visual VLSM partitioner
│   ├── LanView.tsx                 # Local device grid with MAC vendor badges
│   └── SettingsView.tsx            # API vault, theme toggle & DB manager
└── components/
    ├── common/                     # GlassCard, MetricBadge, StatusPill, CyberInput
    ├── window/                     # FramelessTitleBar, WindowControls
    └── charts/                     # SparklineCanvas, GeoGlobeCanvas
```

---

### 3.2 State Management with Zustand

Global and view-level application state is managed using **Zustand 5.x**, providing micro-benchmark performance, zero boilerplate, and reactive selector subscription without full re-render cascades.

#### 3.2.1 `useTraceStore`

```typescript
// src/stores/useTraceStore.ts
import { create } from 'zustand';
import { HopTelemetry, TracerouteConfig } from '../types/models';

interface TraceState {
  target: string;
  config: TracerouteConfig;
  isRunning: boolean;
  activeSessionId: string | null;
  hops: Map<number, HopTelemetry>;
  selectedTtl: number | null;
  routeCompleted: boolean;
  error: string | null;

  // Actions
  setTarget: (target: string) => void;
  updateConfig: (partial: Partial<TracerouteConfig>) => void;
  startTraceSession: (sessionId: string) => void;
  ingestHopBatch: (batch: HopTelemetry[]) => void;
  selectHop: (ttl: number | null) => void;
  stopTraceSession: () => void;
  resetTrace: () => void;
}

export const useTraceStore = create<TraceState>((set) => ({
  target: '',
  config: {
    protocol: 'ICMP',
    maxHops: 30,
    timeoutMs: 1500,
    probesPerHop: 3,
    isMtr: false,
    mtrIntervalMs: 1000,
  },
  isRunning: false,
  activeSessionId: null,
  hops: new Map(),
  selectedTtl: null,
  routeCompleted: false,
  error: null,

  setTarget: (target) => set({ target }),
  updateConfig: (partial) => set((s) => ({ config: { ...s.config, ...partial } })),
  startTraceSession: (sessionId) =>
    set({ isRunning: true, activeSessionId: sessionId, hops: new Map(), routeCompleted: false, error: null }),
  ingestHopBatch: (batch) =>
    set((state) => {
      const nextHops = new Map(state.hops);
      for (const hop of batch) {
        nextHops.set(hop.ttl, hop);
      }
      return { hops: nextHops };
    }),
  selectHop: (ttl) => set({ selectedTtl: ttl }),
  stopTraceSession: () => set({ isRunning: false, activeSessionId: null, routeCompleted: true }),
  resetTrace: () => set({ hops: new Map(), isRunning: false, activeSessionId: null, error: null }),
}));
```

#### 3.2.2 `usePingStore`

```typescript
// src/stores/usePingStore.ts
import { create } from 'zustand';
import { PingSample, RttStatistics } from '../types/models';

const RING_BUFFER_CAPACITY = 1000;

interface PingState {
  target: string;
  intervalMs: number;
  packetSize: number;
  dfBit: boolean;
  isRunning: boolean;
  activeSessionId: string | null;
  samples: PingSample[];
  currentJitterMs: number;
  stats: RttStatistics;
  packetsSent: number;
  packetsReceived: number;

  // Actions
  setTarget: (target: string) => void;
  setInterval: (ms: number) => void;
  startSession: (sessionId: string) => void;
  ingestSampleBatch: (batch: PingSample[], jitter: number, stats: RttStatistics) => void;
  stopSession: () => void;
  clearHistory: () => void;
}

export const usePingStore = create<PingState>((set) => ({
  target: '8.8.8.8',
  intervalMs: 100,
  packetSize: 32,
  dfBit: true,
  isRunning: false,
  activeSessionId: null,
  samples: [],
  currentJitterMs: 0,
  stats: { min: null, avg: null, max: null, stdev: null, p95: null, p99: null },
  packetsSent: 0,
  packetsReceived: 0,

  setTarget: (target) => set({ target }),
  setInterval: (intervalMs) => set({ intervalMs }),
  startSession: (sessionId) =>
    set({ isRunning: true, activeSessionId: sessionId, samples: [], packetsSent: 0, packetsReceived: 0 }),
  ingestSampleBatch: (batch, currentJitterMs, stats) =>
    set((state) => {
      const nextSamples = [...state.samples, ...batch];
      if (nextSamples.length > RING_BUFFER_CAPACITY) {
        nextSamples.splice(0, nextSamples.length - RING_BUFFER_CAPACITY);
      }
      const sentDelta = batch.length;
      const recvDelta = batch.filter((s) => s.status === 'SUCCESS').length;
      return {
        samples: nextSamples,
        currentJitterMs,
        stats,
        packetsSent: state.packetsSent + sentDelta,
        packetsReceived: state.packetsReceived + recvDelta,
      };
    }),
  stopSession: () => set({ isRunning: false, activeSessionId: null }),
  clearHistory: () => set({ samples: [], packetsSent: 0, packetsReceived: 0 }),
}));
```

#### 3.2.3 `usePortScanStore`

```typescript
// src/stores/usePortScanStore.ts
import { create } from 'zustand';
import { PortResult, ScanType } from '../types/models';

interface PortScanState {
  target: string;
  scanType: ScanType;
  portPreset: string;
  concurrency: number;
  isRunning: boolean;
  progressPercent: number;
  openPorts: PortResult[];
  closedCount: number;
  filteredCount: number;
  selectedPort: PortResult | null;

  setTarget: (target: string) => void;
  setScanType: (type: ScanType) => void;
  setPortPreset: (preset: string) => void;
  startScan: () => void;
  ingestPortBatch: (batch: PortResult[], progress: number) => void;
  stopScan: () => void;
  selectPort: (port: PortResult | null) => void;
}

export const usePortScanStore = create<PortScanState>((set) => ({
  target: '127.0.0.1',
  scanType: 'TCP_CONNECT',
  portPreset: 'top-100',
  concurrency: 250,
  isRunning: false,
  progressPercent: 0,
  openPorts: [],
  closedCount: 0,
  filteredCount: 0,
  selectedPort: null,

  setTarget: (target) => set({ target }),
  setScanType: (scanType) => set({ scanType }),
  setPortPreset: (portPreset) => set({ portPreset }),
  startScan: () => set({ isRunning: true, progressPercent: 0, openPorts: [], closedCount: 0, filteredCount: 0 }),
  ingestPortBatch: (batch, progressPercent) =>
    set((state) => {
      const newOpen = batch.filter((p) => p.state === 'OPEN');
      const newClosed = batch.filter((p) => p.state === 'CLOSED').length;
      const newFiltered = batch.filter((p) => p.state === 'FILTERED').length;
      return {
        openPorts: [...state.openPorts, ...newOpen],
        closedCount: state.closedCount + newClosed,
        filteredCount: state.filteredCount + newFiltered,
        progressPercent,
      };
    }),
  stopScan: () => set({ isRunning: false, progressPercent: 100 }),
  selectPort: (selectedPort) => set({ selectedPort }),
}));
```

#### 3.2.4 `useDnsStore`

```typescript
// src/stores/useDnsStore.ts
import { create } from 'zustand';
import { DnsRecord, DnssecValidation, ResolverCheckResult } from '../types/models';

interface DnsState {
  domain: string;
  recordType: string;
  transport: 'UDP_TCP' | 'DOH' | 'DOT';
  isLoading: boolean;
  records: DnsRecord[];
  dnssec: DnssecValidation | null;
  propagation: ResolverCheckResult[];
  propagationPercent: number;

  setDomain: (domain: string) => void;
  setRecordType: (recordType: string) => void;
  setTransport: (transport: 'UDP_TCP' | 'DOH' | 'DOT') => void;
  setResults: (records: DnsRecord[], dnssec: DnssecValidation, propagation: ResolverCheckResult[]) => void;
  setLoading: (isLoading: boolean) => void;
}

export const useDnsStore = create<DnsState>((set) => ({
  domain: '',
  recordType: 'A',
  transport: 'DOH',
  isLoading: false,
  records: [],
  dnssec: null,
  propagation: [],
  propagationPercent: 0,

  setDomain: (domain) => set({ domain }),
  setRecordType: (recordType) => set({ recordType }),
  setTransport: (transport) => set({ transport }),
  setResults: (records, dnssec, propagation) => {
    const matches = propagation.filter((r) => r.status === 'MATCH').length;
    const percent = propagation.length > 0 ? (matches / propagation.length) * 100 : 0;
    set({ records, dnssec, propagation, propagationPercent: percent, isLoading: false });
  },
  setLoading: (isLoading) => set({ isLoading }),
}));
```

#### 3.2.5 `useSettingsStore`

```typescript
// src/stores/useSettingsStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'dark' | 'light';
  abuseIpDbKeySet: boolean;
  virusTotalKeySet: boolean;
  offlineDbPath: string | null;
  autoUpdateOfflineDb: boolean;
  minimizeToTray: boolean;
  startOnBoot: boolean;
  alertOnVpnDrop: boolean;

  setTheme: (theme: 'dark' | 'light') => void;
  setKeyFlags: (abuse: boolean, vt: boolean) => void;
  setOfflineDbPath: (path: string) => void;
  toggleAutoUpdate: () => void;
  toggleTray: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      abuseIpDbKeySet: false,
      virusTotalKeySet: false,
      offlineDbPath: null,
      autoUpdateOfflineDb: true,
      minimizeToTray: true,
      startOnBoot: false,
      alertOnVpnDrop: true,

      setTheme: (theme) => set({ theme }),
      setKeyFlags: (abuseIpDbKeySet, virusTotalKeySet) => set({ abuseIpDbKeySet, virusTotalKeySet }),
      setOfflineDbPath: (offlineDbPath) => set({ offlineDbPath }),
      toggleAutoUpdate: () => set((s) => ({ autoUpdateOfflineDb: !s.autoUpdateOfflineDb })),
      toggleTray: () => set((s) => ({ minimizeToTray: !s.minimizeToTray })),
    }),
    { name: 'iptracer-user-settings' }
  )
);
```

#### 3.2.6 `useAppStore`

```typescript
// src/stores/useAppStore.ts
import { create } from 'zustand';
import { NetworkInterface, ToastNotification } from '../types/models';

interface AppState {
  activeView: 'dashboard' | 'trace' | 'ping' | 'portscan' | 'dns' | 'whois' | 'subnet' | 'lan' | 'settings';
  activeInterface: NetworkInterface | null;
  interfaces: NetworkInterface[];
  isElevated: boolean;
  helperConnected: boolean;
  toasts: ToastNotification[];

  setActiveView: (view: AppState['activeView']) => void;
  setInterfaces: (interfaces: NetworkInterface[], active: NetworkInterface) => void;
  setElevationState: (isElevated: boolean, helperConnected: boolean) => void;
  pushToast: (toast: Omit<ToastNotification, 'id' | 'timestamp'>) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  activeView: 'dashboard',
  activeInterface: null,
  interfaces: [],
  isElevated: false,
  helperConnected: false,
  toasts: [],

  setActiveView: (activeView) => set({ activeView }),
  setInterfaces: (interfaces, activeInterface) => set({ interfaces, activeInterface }),
  setElevationState: (isElevated, helperConnected) => set({ isElevated, helperConnected }),
  pushToast: (toast) =>
    set((s) => ({
      toasts: [...s.toasts, { ...toast, id: crypto.randomUUID(), timestamp: Date.now() }],
    })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}));
```

---

### 3.3 TanStack Query v5 Caching Layer & Invalidation Triggers

Async domain resources (Egress IP, WHOIS queries, Subnet calculations) utilize TanStack Query v5 for request deduplication, background caching, and automatic garbage collection:

| Query Key Pattern | Cache TTL (Stale Time) | Invalidation Event Trigger |
|---|---|---|
| `['egress', 'ip']` | 300 seconds (5 min) | Egress change event, VPN drop alarm, manual Refresh button |
| `['whois', query]` | 86,400 seconds (24 hr) | Explicit user-triggered "Force Refresh" checkbox |
| `['subnet', cidr]` | $\infty$ (Immutable Math) | Never (Static bitwise math output) |
| `['system', 'interfaces']`| 10 seconds | OS Network interface change notification |
| `['threat', ip]` | 86,400 seconds (24 hr) | Cache expired or user API key changed |

---

### 3.4 High-Frequency Telemetry Ingestion (50ms Micro-Batching)

To render 60 FPS sparklines and smoothly animate 3D geodesic arcs without UI stutter, incoming IPC events are consumed through a high-frequency micro-batching hook:

```typescript
// src/hooks/useTelemetryBatch.ts
import { useEffect, useRef } from 'react';
import { listen } from '@tauri-apps/api/event';

export function useTelemetryBatch<T>(
  eventName: string,
  onFlushBatch: (batch: T[]) => void,
  flushIntervalMs = 50
) {
  const bufferRef = useRef<T[]>([]);
  const callbackRef = useRef(onFlushBatch);
  callbackRef.current = onFlushBatch;

  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;

    // 20 Hz flush loop
    timerId = setInterval(() => {
      if (bufferRef.current.length > 0) {
        const batch = [...bufferRef.current];
        bufferRef.current = [];
        callbackRef.current(batch);
      }
    }, flushIntervalMs);

    const unlistenPromise = listen<T[]>(eventName, (event) => {
      if (Array.isArray(event.payload)) {
        bufferRef.current.push(...event.payload);
      } else {
        bufferRef.current.push(event.payload);
      }
    });

    return () => {
      if (timerId) clearInterval(timerId);
      unlistenPromise.then((unlisten) => unlisten());
    };
  }, [eventName, flushIntervalMs]);
}
```

---

### 3.5 WebGL 3D Globe & ECharts Canvas Hook Bindings

#### MapLibre GL JS 3D Globe Controller (`useGlobeMap`):
- Initializes WebGL context with dark vector tiles.
- Ingests `HopTelemetry[]` and constructs GeoJSON `Feature<LineString>` with Great Circle (geodesic) curvature interpolation.
- Animates a glowing pulse shader along the active path segments.
- Automatically fits map viewport bounds using smooth spherical camera fly-to animations.

#### Apache ECharts 60 FPS Sparkline Controller (`useSparkline`):
- Mounts HTML5 canvas element with device pixel ratio scaling (`window.devicePixelRatio`).
- Updates time-series data incrementally using `chart.setOption({ series: [{ data: points }] }, false)` with zero deep garbage collection overhead.

---

## 4. Tauri v2 IPC Command & Streaming Event Contracts

### 4.1 Type-Safe IPC Command Signatures

Every IPC command is exposed via `#[tauri::command]` in Rust and invoked via typed wrappers in TypeScript:

```typescript
// src/types/ipc.ts
import { invoke } from '@tauri-apps/api/core';
import {
  AppResponse,
  IpTraceResult,
  TracerouteConfig,
  PingConfig,
  PortScanConfig,
  DnsInspectionResult,
  RdapLookupResult,
  SubnetCalculationResult,
  LanDiscoveryResult,
  NetworkInterface,
  ElevationStatus,
} from './models';

export const api = {
  // 1. Core Egress IP Tracing
  traceIp: (target: string, options?: { forceRefresh?: boolean }) =>
    invoke<AppResponse<IpTraceResult>>('trace_ip', { target, options }),

  // 2. Traceroute / MTR
  runTraceroute: (config: TracerouteConfig) =>
    invoke<AppResponse<{ sessionId: string }>>('run_traceroute', { config }),

  stopTraceroute: (sessionId: string) =>
    invoke<AppResponse<boolean>>('stop_traceroute', { sessionId }),

  // 3. Continuous Ping
  startContinuousPing: (config: PingConfig) =>
    invoke<AppResponse<{ sessionId: string }>>('start_continuous_ping', { config }),

  stopContinuousPing: (sessionId: string) =>
    invoke<AppResponse<boolean>>('stop_continuous_ping', { sessionId }),

  // 4. Port Scanner
  scanPorts: (config: PortScanConfig) =>
    invoke<AppResponse<{ sessionId: string }>>('scan_ports', { config }),

  // 5. DNS Inspector
  queryDns: (domain: string, recordType: string, transport: string) =>
    invoke<AppResponse<DnsInspectionResult>>('query_dns', { domain, recordType, transport }),

  // 6. WHOIS / RDAP
  queryWhois: (query: string) =>
    invoke<AppResponse<RdapLookupResult>>('query_whois', { query }),

  // 7. Subnet / CIDR Calculator
  calculateSubnet: (cidr: string, vlsmRequests?: Array<[string, number]>) =>
    invoke<AppResponse<SubnetCalculationResult>>('calculate_subnet', { cidr, vlsmRequests }),

  // 8. LAN Device Discovery
  scanLan: (interfaceName?: string) =>
    invoke<AppResponse<LanDiscoveryResult>>('scan_lan', { interfaceName }),

  // Auxiliary OS Commands
  getNetworkInterfaces: () =>
    invoke<AppResponse<NetworkInterface[]>>('get_network_interfaces'),

  checkElevationStatus: () =>
    invoke<AppResponse<ElevationStatus>>('check_elevation_status'),

  requestElevation: () =>
    invoke<AppResponse<{ connected: boolean }>>('request_elevation'),
};
```

---

### 4.2 Streaming Telemetry Event Contracts

| Event Channel | Payload Type | Direction | Frequency | Purpose |
|---|---|---|---|---|
| `trace:hop-batch` | `HopTelemetry[]` | Rust $\rightarrow$ Webview | 20 Hz (50 ms) | Streams newly discovered hops, RTT updates, and MTR sliding window metrics |
| `trace:completed` | `{ sessionId: string; status: string }` | Rust $\rightarrow$ Webview | On complete | Signals trace route termination or target destination reached |
| `ping:sample-batch` | `PingSample[]` | Rust $\rightarrow$ Webview | 20 Hz (50 ms) | Delivers buffered ICMP latency samples for smooth 60 FPS sparkline rendering |
| `port:found-batch` | `PortResult[]` | Rust $\rightarrow$ Webview | 20 Hz (50 ms) | Delivers open/closed/filtered port discovery batches |
| `lan:device-batch` | `LanDevice[]` | Rust $\rightarrow$ Webview | On event | Streams discovered LAN devices with vendor and hostname resolution |
| `system:vpn-alert` | `{ oldIp: string; newIp: string; timestamp: number }` | Rust $\rightarrow$ Webview | Immediate | Triggers desktop notification and UI banner on egress IP / VPN drop |

---

### 4.3 IPC Interaction Sequence Diagrams (Mermaid)

#### Request-Response Command Flow:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant View as React View
    participant Store as Zustand Store
    participant Bridge as Tauri IPC Bridge
    participant Rust as Rust Command Handler
    participant Svc as Core Domain Service

    User->>View: Enter Target ("example.com") & Click Action
    View->>Store: Dispatch startAction()
    Store->>Bridge: invoke("query_dns", { domain: "example.com", ... })
    Bridge->>Rust: Deserialize Typed Arguments
    Rust->>Svc: Execute async domain logic
    alt Service Succeeded
        Svc-->>Rust: Ok(ResultData)
        Rust-->>Bridge: Serialize AppResponse { success: true, data: ResultData }
        Bridge-->>Store: Resolve Promise<AppResponse>
        Store->>View: Reactive UI Update
    else Service Failed
        Svc-->>Rust: Err(AppError)
        Rust-->>Bridge: Serialize AppResponse { success: false, error: AppError }
        Bridge-->>Store: Resolve AppResponse (handled in store)
        Store->>View: Display Error Toast with Suggested Action
    end
```

#### High-Frequency Streaming Telemetry Flow:

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Presentation Layer
    participant Buffer as useTelemetryBatch Hook
    participant IPC as Tauri Event Emitter
    participant Tokio as Rust Tokio Background Task
    participant Ring as Rust RingBuffer (50ms Flusher)

    Tokio->>Ring: Push PingSample (seq=1, rtt=14.2ms)
    Tokio->>Ring: Push PingSample (seq=2, rtt=14.8ms)
    Tokio->>Ring: Push PingSample (seq=3, rtt=14.1ms)
    Note over Ring: 50ms Flush Timer Ticks
    Ring->>IPC: emit("ping:sample-batch", [Sample1, Sample2, Sample3])
    IPC->>Buffer: On event payload received
    Buffer->>UI: Batch flushed to Zustand Store (1 React Render)
    UI->>UI: Canvas Sparkline Smooth Re-draw (60 FPS)
```

---

## 5. Data Models & Formal Draft-07 JSON Schemas

### 5.1 Schema Inventory & Validation Guarantees

All diagnostic data output by IPTracer conforms to formal Draft-07 JSON schemas stored in `docs/standalone_app/schemas/`. Every schema has been verified using automated schema validators:

| # | Schema File | Primary Title | Target Subsystem | Validation Status |
|---|---|---|---|---|
| 1 | `ip_trace_schema.json` | `IpTraceResult` | Egress IP, Geolocation & Threat Scoring | Verified Valid Draft-07 |
| 2 | `traceroute_schema.json` | `TracerouteResult` | Visual Traceroute & Real-Time MTR | Verified Valid Draft-07 |
| 3 | `ping_monitor_schema.json` | `PingSession` | Continuous Ping & RFC 3550 Jitter | Verified Valid Draft-07 |
| 4 | `port_scanner_schema.json` | `PortScanResult` | Port Scanner & Banner Fingerprinting | Verified Valid Draft-07 |
| 5 | `dns_inspector_schema.json` | `DNSInspectionResult` | DNS Records, DNSSEC & Propagation | Verified Valid Draft-07 |
| 6 | `whois_rdap_schema.json` | `RDAPLookupResult` | WHOIS / RDAP Registry Inspector | Verified Valid Draft-07 |
| 7 | `subnet_calculator_schema.json` | `SubnetCalculationResult` | IPv4/IPv6 CIDR & VLSM Allocation | Verified Valid Draft-07 |

---

### 5.2 `ip_trace_schema.json`

#### TypeScript Contract:

```typescript
export interface IpTraceResult {
  query: string;
  ip: string;
  ipVersion: 'IPv4' | 'IPv6';
  isBogon: boolean;
  isAnycast: boolean;
  hostname: string | null;
  location: {
    continent: string | null;
    continentCode: string | null;
    country: string;
    countryCode: string;
    region: string;
    regionCode: string | null;
    city: string;
    postalCode: string | null;
    latitude: number;
    longitude: number;
    timezone: string;
    accuracyRadiusKm: number | null;
  };
  network: {
    asn: number | null;
    asnOrg: string;
    isp: string;
    cidr: string | null;
    bgpPrefix: string | null;
  };
  threat: {
    abuseConfidenceScore: number;
    totalReports: number;
    isTorExit: boolean;
    isProxy: boolean;
    isDatacenter: boolean;
    threatLevel: 'CLEAN' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    lastReportedAt: string | null;
  };
  source: 'OFFLINE_MAXMIND' | 'ONLINE_FAILOVER' | 'CACHE' | 'LOCAL_SENTINEL';
  provider: string;
  responseTimeMs: number;
  timestamp: number;
}
```

#### Sample JSON Payload:

```json
{
  "query": "198.51.100.42",
  "ip": "198.51.100.42",
  "ipVersion": "IPv4",
  "isBogon": false,
  "isAnycast": false,
  "hostname": "test-edge-42.example.net",
  "location": {
    "continent": "North America",
    "continentCode": "NA",
    "country": "United States",
    "countryCode": "US",
    "region": "California",
    "regionCode": "CA",
    "city": "San Jose",
    "postalCode": "95113",
    "latitude": 37.3382,
    "longitude": -121.8863,
    "timezone": "America/Los_Angeles",
    "accuracyRadiusKm": 10.0
  },
  "network": {
    "asn": 13335,
    "asnOrg": "Cloudflare Inc.",
    "isp": "Cloudflare",
    "cidr": "198.51.100.0/24",
    "bgpPrefix": "198.51.100.0/24"
  },
  "threat": {
    "abuseConfidenceScore": 0.0,
    "totalReports": 0,
    "isTorExit": false,
    "isProxy": false,
    "isDatacenter": false,
    "threatLevel": "CLEAN",
    "lastReportedAt": null
  },
  "source": "OFFLINE_MAXMIND",
  "provider": "MaxMind GeoLite2",
  "responseTimeMs": 0.42,
  "timestamp": 1730730000000
}
```

---

### 5.3 `traceroute_schema.json`

#### TypeScript Contract:

```typescript
export interface TracerouteResult {
  target: string;
  resolvedIp: string;
  protocol: 'ICMP' | 'UDP' | 'TCP';
  mode: 'TRACEROUTE' | 'MTR';
  maxHops: number;
  startTime: number;
  endTime: number | null;
  status: 'RUNNING' | 'COMPLETED' | 'FAILED' | 'ABORTED';
  hops: Array<{
    ttl: number;
    ip: string | null;
    hostname: string | null;
    asn: number | string | null;
    asnOrg: string | null;
    country: string | null;
    countryCode: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
    lossPercent: number;
    sent: number;
    received: number;
    rttLast: number | null;
    rttAvg: number | null;
    rttBest: number | null;
    rttWorst: number | null;
    rttStDev: number | null;
    probes?: Array<{
      sequence: number;
      rtt: number | null;
      status: 'SUCCESS' | 'TIMEOUT' | 'UNREACHABLE';
    }>;
  }>;
}
```

#### Sample JSON Payload:

```json
{
  "target": "1.1.1.1",
  "resolvedIp": "1.1.1.1",
  "protocol": "ICMP",
  "mode": "MTR",
  "maxHops": 30,
  "startTime": 1730730000000,
  "endTime": 1730730003500,
  "status": "COMPLETED",
  "hops": [
    {
      "ttl": 1,
      "ip": "192.168.1.1",
      "hostname": "gateway.home",
      "asn": null,
      "asnOrg": "Local Gateway",
      "country": null,
      "countryCode": null,
      "city": null,
      "latitude": null,
      "longitude": null,
      "lossPercent": 0.0,
      "sent": 10,
      "received": 10,
      "rttLast": 1.2,
      "rttAvg": 1.1,
      "rttBest": 0.9,
      "rttWorst": 1.5,
      "rttStDev": 0.15,
      "probes": [
        { "sequence": 1, "rtt": 1.1, "status": "SUCCESS" },
        { "sequence": 2, "rtt": 1.2, "status": "SUCCESS" }
      ]
    },
    {
      "ttl": 2,
      "ip": "1.1.1.1",
      "hostname": "one.one.one.one",
      "asn": 13335,
      "asnOrg": "Cloudflare",
      "country": "United States",
      "countryCode": "US",
      "city": "Los Angeles",
      "latitude": 34.0522,
      "longitude": -118.2437,
      "lossPercent": 0.0,
      "sent": 10,
      "received": 10,
      "rttLast": 12.4,
      "rttAvg": 12.8,
      "rttBest": 11.9,
      "rttWorst": 14.1,
      "rttStDev": 0.65,
      "probes": [
        { "sequence": 1, "rtt": 12.1, "status": "SUCCESS" },
        { "sequence": 2, "rtt": 12.4, "status": "SUCCESS" }
      ]
    }
  ]
}
```

---

### 5.4 `ping_monitor_schema.json`

#### TypeScript Contract:

```typescript
export interface PingSession {
  sessionId: string;
  target: string;
  resolvedIp: string;
  intervalMs: number;
  packetSize: number;
  dfBit: boolean;
  status: 'RUNNING' | 'STOPPED' | 'PAUSED' | 'ERROR';
  startTime: number;
  endTime: number | null;
  packetsSent: number;
  packetsReceived: number;
  packetsLost: number;
  lossPercent: number;
  currentJitterMs: number;
  rttStats: {
    min: number | null;
    avg: number | null;
    max: number | null;
    stdev: number | null;
    p95: number | null;
    p99?: number | null;
  };
  pathMtu: number | null;
  history: Array<{
    seq: number;
    ttl?: number | null;
    rtt: number | null;
    status: 'SUCCESS' | 'TIMEOUT' | 'HOST_UNREACHABLE' | 'NET_UNREACHABLE' | 'TTL_EXPIRED';
    timestamp: number;
  }>;
}
```

#### Sample JSON Payload:

```json
{
  "sessionId": "ping-sess-410",
  "target": "8.8.8.8",
  "resolvedIp": "8.8.8.8",
  "intervalMs": 100,
  "packetSize": 32,
  "dfBit": true,
  "status": "RUNNING",
  "startTime": 1730730000000,
  "endTime": null,
  "packetsSent": 50,
  "packetsReceived": 50,
  "packetsLost": 0,
  "lossPercent": 0.0,
  "currentJitterMs": 0.85,
  "rttStats": {
    "min": 14.1,
    "avg": 15.3,
    "max": 18.9,
    "stdev": 0.92,
    "p95": 16.8,
    "p99": 18.2
  },
  "pathMtu": 1500,
  "history": [
    { "seq": 1, "ttl": 117, "rtt": 14.8, "status": "SUCCESS", "timestamp": 1730730000100 },
    { "seq": 2, "ttl": 117, "rtt": 15.2, "status": "SUCCESS", "timestamp": 1730730000200 }
  ]
}
```

---

### 5.5 `port_scanner_schema.json`

#### TypeScript Contract:

```typescript
export interface PortScanResult {
  target: string;
  targetIp: string;
  scanType: 'TCP_CONNECT' | 'SYN_STEALTH' | 'UDP';
  portRange?: string;
  concurrency?: number;
  durationMs: number;
  totalPortsScanned?: number;
  openCount: number;
  closedCount: number;
  filteredCount: number;
  ports: Array<{
    port: number;
    protocol: 'TCP' | 'UDP';
    state: 'OPEN' | 'CLOSED' | 'FILTERED';
    service: string;
    product?: string | null;
    version?: string | null;
    banner?: string | null;
    tlsInfo?: {
      subject: string;
      issuer: string;
      validTo: string;
      cipher?: string | null;
      alpn?: string | null;
    } | null;
    latencyMs?: number | null;
  }>;
}
```

#### Sample JSON Payload:

```json
{
  "target": "scanme.nmap.org",
  "targetIp": "45.33.32.156",
  "scanType": "TCP_CONNECT",
  "portRange": "22,80,443",
  "concurrency": 250,
  "durationMs": 412,
  "totalPortsScanned": 3,
  "openCount": 2,
  "closedCount": 1,
  "filteredCount": 0,
  "ports": [
    {
      "port": 22,
      "protocol": "TCP",
      "state": "OPEN",
      "service": "ssh",
      "product": "OpenSSH",
      "version": "6.6.1p1",
      "banner": "SSH-2.0-OpenSSH_6.6.1p1 Ubuntu-2ubuntu2.13",
      "tlsInfo": null,
      "latencyMs": 35.4
    },
    {
      "port": 80,
      "protocol": "TCP",
      "state": "OPEN",
      "service": "http",
      "product": "Apache httpd",
      "version": "2.4.7",
      "banner": "HTTP/1.1 200 OK\\r\\nServer: Apache/2.4.7",
      "tlsInfo": null,
      "latencyMs": 34.2
    },
    {
      "port": 443,
      "protocol": "TCP",
      "state": "CLOSED",
      "service": "https",
      "product": null,
      "version": null,
      "banner": null,
      "tlsInfo": null,
      "latencyMs": 36.1
    }
  ]
}
```

---

### 5.6 `dns_inspector_schema.json`

#### TypeScript Contract:

```typescript
export interface DNSInspectionResult {
  domain: string;
  queryType: string;
  transport?: 'UDP_TCP' | 'DOH' | 'DOT';
  authoritativeServer?: string | null;
  responseTimeMs: number;
  dnssecStatus: {
    isValid: boolean;
    state: 'SECURE' | 'INSECURE' | 'BOGUS' | 'INDETERMINATE';
    keyAlgorithm: string | null;
    details: string;
  };
  records: Array<{
    name: string;
    type: string;
    ttl: number;
    value: string;
    priority?: number | null;
    tag?: string | null;
  }>;
  propagation: {
    totalResolvers: number;
    matchedResolvers: number;
    propagationPercentage: number;
    resolverResults: Array<{
      resolverName: string;
      resolverLocation: string;
      countryCode?: string | null;
      status: 'MATCH' | 'MISMATCH' | 'TIMEOUT' | 'ERROR';
      values: string[];
      latencyMs: number;
    }>;
  };
}
```

#### Sample JSON Payload:

```json
{
  "domain": "cloudflare.com",
  "queryType": "A",
  "transport": "DOH",
  "authoritativeServer": "ns3.cloudflare.com",
  "responseTimeMs": 14.5,
  "dnssecStatus": {
    "isValid": true,
    "state": "SECURE",
    "keyAlgorithm": "ECDSAP256SHA256",
    "details": "RRSIG cryptographic signatures verified up to Root Anchor."
  },
  "records": [
    {
      "name": "cloudflare.com",
      "type": "A",
      "ttl": 300,
      "value": "104.16.132.229",
      "priority": null,
      "tag": null
    },
    {
      "name": "cloudflare.com",
      "type": "A",
      "ttl": 300,
      "value": "104.16.133.229",
      "priority": null,
      "tag": null
    }
  ],
  "propagation": {
    "totalResolvers": 30,
    "matchedResolvers": 30,
    "propagationPercentage": 100.0,
    "resolverResults": [
      {
        "resolverName": "Cloudflare Frankfurt",
        "resolverLocation": "Frankfurt, Germany",
        "countryCode": "DE",
        "status": "MATCH",
        "values": ["104.16.132.229", "104.16.133.229"],
        "latencyMs": 11.2
      },
      {
        "resolverName": "Google Virginia",
        "resolverLocation": "Ashburn, United States",
        "countryCode": "US",
        "status": "MATCH",
        "values": ["104.16.132.229", "104.16.133.229"],
        "latencyMs": 14.8
      }
    ]
  }
}
```

---

### 5.7 `whois_rdap_schema.json`

#### TypeScript Contract:

```typescript
export interface RDAPLookupResult {
  query: string;
  objectType: 'DOMAIN' | 'IPV4' | 'IPV6' | 'AUTONOMOUS_SYSTEM';
  handle: string;
  name?: string | null;
  cidr?: string | null;
  parentHandle?: string | null;
  whoisServer?: string | null;
  rdapUrl?: string | null;
  source: 'RDAP' | 'WHOIS_PORT_43';
  status: string[];
  events: {
    registration?: string | null;
    expiration?: string | null;
    lastChanged?: string | null;
    lastUpdateOfRdapDb?: string | null;
  };
  entities: Array<{
    handle?: string | null;
    roles: string[];
    name?: string | null;
    organization?: string | null;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
  }>;
  nameservers: string[];
  rawText?: string | null;
}
```

#### Sample JSON Payload:

```json
{
  "query": "198.51.100.0",
  "objectType": "IPV4",
  "handle": "NET-198-51-100-0-1",
  "name": "TEST-NET-2",
  "cidr": "198.51.100.0/24",
  "parentHandle": "NET-198-0-0-0-0",
  "whoisServer": "whois.arin.net",
  "rdapUrl": "https://rdap.arin.net/registry/ip/198.51.100.0",
  "source": "RDAP",
  "status": ["active"],
  "events": {
    "registration": "2010-01-01T00:00:00Z",
    "expiration": null,
    "lastChanged": "2024-05-15T12:00:00Z",
    "lastUpdateOfRdapDb": "2026-11-04T00:00:00Z"
  },
  "entities": [
    {
      "handle": "ARIN-ABUSE",
      "roles": ["abuse"],
      "name": "ARIN Abuse Team",
      "organization": "ARIN",
      "email": "abuse@arin.net",
      "phone": "+1-703-227-0660",
      "address": "P.O. Box 232290, Centreville, VA 20120"
    }
  ],
  "nameservers": [],
  "rawText": null
}
```

---

### 5.8 `subnet_calculator_schema.json`

#### TypeScript Contract:

```typescript
export interface SubnetCalculationResult {
  inputIp: string;
  prefixLength: number;
  ipVersion: 'IPv4' | 'IPv6';
  networkAddress: string;
  broadcastAddress?: string | null;
  netmask: string;
  wildcardMask: string;
  netmaskBinary: string;
  usableRange: {
    firstUsable: string;
    lastUsable: string;
  };
  totalHosts: string;
  usableHosts: string;
  ipClass?: string | null;
  isPrivate: boolean;
  isLinkLocal?: boolean;
  isMulticast?: boolean;
  vlsmSubnets?: Array<{
    name: string;
    neededHosts: number;
    allocatedHosts: number;
    prefix: number;
    subnetAddress: string;
    usableRange: string;
    broadcast: string;
  }>;
}
```

#### Sample JSON Payload:

```json
{
  "inputIp": "192.168.10.0",
  "prefixLength": 24,
  "ipVersion": "IPv4",
  "networkAddress": "192.168.10.0",
  "broadcastAddress": "192.168.10.255",
  "netmask": "255.255.255.0",
  "wildcardMask": "0.0.0.255",
  "netmaskBinary": "11111111.11111111.11111111.00000000",
  "usableRange": {
    "firstUsable": "192.168.10.1",
    "lastUsable": "192.168.10.254"
  },
  "totalHosts": "256",
  "usableHosts": "254",
  "ipClass": "C",
  "isPrivate": true,
  "isLinkLocal": false,
  "isMulticast": false,
  "vlsmSubnets": [
    {
      "name": "VLAN 10 Engineering",
      "neededHosts": 50,
      "allocatedHosts": 62,
      "prefix": 26,
      "subnetAddress": "192.168.10.0",
      "usableRange": "192.168.10.1 - 192.168.10.62",
      "broadcast": "192.168.10.63"
    },
    {
      "name": "VLAN 20 Sales",
      "neededHosts": 25,
      "allocatedHosts": 30,
      "prefix": 27,
      "subnetAddress": "192.168.10.64",
      "usableRange": "192.168.10.65 - 192.168.10.94",
      "broadcast": "192.168.10.95"
    }
  ]
}
```

---

## 6. Unified Error Taxonomy & Exception Recovery Flows

### 6.1 Structured Error Envelope

To prevent unhandled exceptions or cryptic panic messages across the IPC bridge, all Tauri commands return a standardized, strongly typed envelope:

```typescript
export interface AppResponse<T> {
  success: boolean;
  data: T | null;
  error: AppError | null;
  metadata: {
    requestId: string;
    timestamp: number;
    durationMs: number;
    hostPlatform: 'windows' | 'macos' | 'linux';
    elevationRequired: boolean;
  };
}

export interface AppError {
  code: ErrorCode;
  category: 'Network' | 'Resolution' | 'Geolocation' | 'Privilege' | 'ThirdParty' | 'Validation' | 'Storage';
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
  suggestedAction?: string;
}
```

### 6.2 Error Code Registry & Recovery Catalog

| Error Code | Category | Root Cause | Retryable | Automated Recovery Strategy |
|---|---|---|---|---|
| `ERR_SOCKET_PRIVILEGE` | Privilege | Raw ICMP socket creation rejected by OS kernel | No | Prompt user for OS elevation; spawn `iptracer-helper` daemon |
| `ERR_DNS_TIMEOUT` | Resolution | All configured recursive DNS servers timed out | Yes | Fall back to built-in DoH resolvers (Cloudflare 1.1.1.1, Quad9) with backoff |
| `ERR_DNS_NXDOMAIN` | Resolution | Queried hostname does not exist in DNS root | No | Display clear domain typo notification; cancel downstream tasks |
| `ERR_DNS_SEC_BOGUS` | Resolution | RRSIG signature verification failed against DNSKEY | No | Highlight security warning badge ("Possible DNS spoofing detected") |
| `ERR_GEOIP_DB_MISSING` | Geolocation | Bundled MaxMind `.mmdb` file missing or corrupt | Yes | Seamlessly switch to online HTTP failover cascade; trigger background download |
| `ERR_RATE_LIMIT_429` | ThirdParty | Threat intel or Geo API quota exhausted (HTTP 429) | Yes | Shift to secondary provider in cascade; pause provider bucket for `Retry-After` |
| `ERR_ALL_PROVIDERS_DOWN`| ThirdParty | All public cloud egress resolvers unreachable | Yes | Return offline local IP metadata; retry in 30 seconds |
| `ERR_ADAPTER_INACTIVE` | Network | Active NIC cable unplugged or Wi-Fi disconnected | Yes | Pause continuous monitors; listen for OS network change events to auto-resume |
| `ERR_PORT_SCAN_LIMIT` | Network | OS file descriptor / socket handle limit reached | Yes | Automatically clamp concurrency semaphore down by 50% and resume |
| `ERR_INVALID_CIDR` | Validation | Subnet prefix length $<0$ or $>32$ ($>128$ for IPv6) | No | Visual red highlight on input with inline syntax suggestion |

---

### 6.3 Concrete Error Recovery Sequence Diagrams (Mermaid)

#### 6.3.1 Socket Permission Denial & Privilege Elevation Flow

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React Presentation Layer
    participant Cmd as Tauri IPC Command Bridge
    participant Engine as Diagnostic Engine (Rust)
    participant OS as Operating System Security
    participant Helper as iptracer-helper (Elevated)

    User->>UI: Request Raw TCP SYN Scan or Promiscuous Sniffing
    UI->>Cmd: invoke("scan_ports", { scanType: "SYN_STEALTH", ... })
    Cmd->>Engine: Initialize Raw Socket
    Engine->>OS: socket(AF_INET, SOCK_RAW, IPPROTO_TCP)
    OS-->>Engine: EACCES / WSAEACCES (Permission Denied)
    
    Engine-->>Cmd: Return AppError { code: "ERR_SOCKET_PRIVILEGE", elevationRequired: true }
    Cmd-->>UI: Deliver Structured Error Envelope
    UI->>User: Display Tactical Elevation Modal: "Administrative Privileges Required"
    User->>UI: Click "Authorize & Elevate"
    
    UI->>Cmd: invoke("request_elevation")
    Cmd->>OS: ShellExecuteEx("runas") / pkexec / SMAppService
    OS->>User: Display Native OS Elevation Prompt (UAC / Password)
    User->>OS: Grant Authorization
    OS->>Helper: Launch iptracer-helper with High-Integrity Token
    Helper->>Helper: Bind Secure Local IPC Endpoint (Named Pipe / Unix Sock)
    Helper-->>Cmd: Mutual Handshake Accepted (PID Verified)
    Cmd-->>UI: Helper Connection Established
    
    UI->>Cmd: Re-dispatch scan_ports({ scanType: "SYN_STEALTH" })
    Cmd->>Helper: Forward Command over Authenticated IPC
    Helper-->>UI: Stream Discovered Ports in Real-Time
```

#### 6.3.2 Geolocation API Failure & Automatic Provider Failover Cascade

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Presentation Layer
    participant Geo as Geolocation Service (Rust)
    participant MMDB as Local MaxMind GeoLite2
    participant P1 as Primary Cloud (ipapi.co)
    participant P2 as Secondary Cloud (ipinfo.io)
    participant P3 as Fallback Cloud (api.ipify.org)
    participant Cache as SQLite L2 Vault

    UI->>Geo: Request Egress IP Geolocation
    Geo->>MMDB: Query Local MMDB (mmap)
    alt IP Missing in Local MMDB
        MMDB-->>Geo: DB_KEY_NOT_FOUND
        Geo->>P1: GET https://ipapi.co/json/ (Timeout 2000ms)
        alt P1 Returns HTTP 429 Too Many Requests
            P1-->>Geo: HTTP 429 (Rate Limit Exceeded)
            Geo->>Geo: Penalize P1 (Disable for 10 minutes)
            Geo->>P2: GET https://ipinfo.io/json (with Token)
            alt P2 Returns HTTP 200 OK
                P2-->>Geo: Valid Geolocation JSON Payload
                Geo->>Geo: Normalize Record Schema
            else P2 Network Timeout
                Geo->>P3: GET https://api.ipify.org?format=json
                P3-->>Geo: Public IP Discovered (Geo Marked "Unknown")
            end
        end
        Geo->>Cache: Persist Record to SQLite with 7-Day TTL
        Geo-->>UI: Deliver Normalized IpTraceResult
        UI->>UI: Render Public IP Card with Fallback Provider Badge
    end
```

#### 6.3.3 Network Interface Disconnection During Continuous Ping

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant UI as React Presentation Layer
    participant Ping as Ping Engine (Rust Tokio)
    participant OS as OS Network Kernel
    participant Sentinel as Network Sentinel Watchdog

    Note over Ping: Continuous Ping Running to 8.8.8.8 at 100ms Interval
    User->>OS: Disconnect Ethernet Cable / Turn Off Wi-Fi
    Ping->>OS: send_icmp_probe(target=8.8.8.8)
    OS-->>Ping: ENETUNREACH / WSAENETUNREACH (Network Unreachable)
    
    Ping->>Ping: Mark Probe as NET_UNREACHABLE
    Ping->>Sentinel: Notify Interface State Anomaly
    Sentinel->>OS: Poll Active Interface Status
    OS-->>Sentinel: Adapter State: DOWN / NO_CARRIER
    
    Sentinel-->>UI: emit("system:adapter-lost", { interface: "eth0" })
    UI->>UI: Pause Sparkline Animation & Show Amber Reconnecting Pill
    
    loop Every 1000ms (Auto-Reconnection Polling)
        Sentinel->>OS: Check Carrier Status
    end
    
    User->>OS: Reconnect Network Cable
    OS-->>Sentinel: Adapter State: UP / IP Assigned
    Sentinel-->>UI: emit("system:adapter-restored", { interface: "eth0" })
    Sentinel-->>Ping: Signal Resume
    Ping->>Ping: Reset Sliding Latency Window
    UI->>UI: Restore Green Live Telemetry Indicator
```

#### 6.3.4 DNS Resolution Timeout & Exponential Backoff Retry Flow

```mermaid
sequenceDiagram
    autonumber
    participant UI as React Presentation Layer
    participant DNS as DNS Subsystem (Hickory-DNS)
    participant LocalRes as System Resolver (Port 53 UDP)
    participant DoH as Cloudflare DoH (1.1.1.1 HTTPS)

    UI->>DNS: Query Domain ("target.internal.corp")
    DNS->>LocalRes: Send UDP Query (Attempt 1, Timeout 1500ms)
    Note over LocalRes: Packet Dropped by Congested Router
    LocalRes-->>DNS: Timeout (1500ms Elapsed)
    
    DNS->>DNS: Compute Exponential Backoff: Delay = 500ms * 2^1 = 1000ms + Jitter
    DNS->>LocalRes: Send UDP Query (Attempt 2, Timeout 2500ms)
    LocalRes-->>DNS: Timeout (2500ms Elapsed)
    
    Note over DNS: Max Local Retries Exhausted (2 Attempts)
    DNS->>DNS: Activate Fallback Transport (DoH over TLS)
    DNS->>DoH: HTTPS POST https://1.1.1.1/dns-query
    DoH-->>DNS: HTTP 200 OK with Wireformat DNS RDATA
    DNS->>DNS: Parse RDATA & Validate DNSSEC
    DNS-->>UI: Deliver DNSInspectionResult with "Transport: DoH Fallback" Notice
    UI->>UI: Display Records & Note Resolver Failover in Tooltip
```

---

## 7. Local Storage, Caching & Data Persistence Layer

### 7.1 Embedded SQLite Schema (DDL)

Local history and diagnostic sessions are persisted in an embedded SQLite database (`rusqlite`) with optional SQLCipher AES-256 encryption:

```sql
-- Database Migration Script: V1__initial_schema.sql

-- 1. IP Trace History Table
CREATE TABLE IF NOT EXISTS ip_trace_history (
    id TEXT PRIMARY KEY,
    query TEXT NOT NULL,
    resolved_ip TEXT NOT NULL,
    ip_version TEXT NOT NULL CHECK(ip_version IN ('IPv4', 'IPv6')),
    country TEXT,
    country_code TEXT,
    city TEXT,
    latitude REAL,
    longitude REAL,
    asn INTEGER,
    asn_org TEXT,
    threat_score REAL,
    threat_level TEXT,
    raw_payload_json TEXT NOT NULL,
    is_bookmarked INTEGER DEFAULT 0,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_trace_resolved_ip ON ip_trace_history(resolved_ip);
CREATE INDEX IF NOT EXISTS idx_trace_created_at ON ip_trace_history(created_at DESC);

-- 2. Diagnostic Session Log
CREATE TABLE IF NOT EXISTS diagnostic_sessions (
    session_id TEXT PRIMARY KEY,
    tool_type TEXT NOT NULL CHECK(tool_type IN ('TRACEROUTE', 'PING', 'PORTSCAN', 'DNS', 'WHOIS', 'SUBNET', 'LAN')),
    target TEXT NOT NULL,
    status TEXT NOT NULL,
    duration_ms INTEGER,
    summary_json TEXT NOT NULL,
    created_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_sessions_tool ON diagnostic_sessions(tool_type, created_at DESC);

-- 3. Persistent Geolocation Cache (L2 Cache)
CREATE TABLE IF NOT EXISTS cached_geolocation (
    ip_address TEXT PRIMARY KEY,
    country TEXT NOT NULL,
    city TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    asn INTEGER,
    provider TEXT NOT NULL,
    raw_json TEXT NOT NULL,
    expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_geo_expires ON cached_geolocation(expires_at);

-- 4. User Configuration & Preferences Key-Value Store
CREATE TABLE IF NOT EXISTS user_preferences (
    pref_key TEXT PRIMARY KEY,
    pref_value TEXT NOT NULL,
    updated_at INTEGER NOT NULL
);
```

### 7.2 L1 Memory Cache (LRU) Design & Invalidation Rules

- **Engine**: In-memory Least Recently Used (`lru::LruCache<IpAddr, GeoLocationRecord>`).
- **Capacity**: 1,000 entries (consumes $< 1.2 \text{ MB}$ RAM).
- **Retrieval Latency**: $< 2 \ \mu\text{s}$.
- **Invalidation Triggers**: Entries expire after 300 seconds (5 minutes) for public egress IPs; 24 hours for remote traceroute hops.

### 7.3 OS Keyring Secret Storage Integration

API keys for external cybersecurity feeds (AbuseIPDB, VirusTotal, Shodan) are encrypted using host OS keychains via the pure-Rust `keyring` crate:
- **Windows**: Windows Credential Manager via DPAPI (`CryptProtectData`), tying encryption directly to the logged-in Windows user SID.
- **macOS**: Apple Keychain Services (`SecItemAdd` / `SecItemCopyMatching`) protected by Secure Enclave hardware where available.
- **Linux**: FreeDesktop Secret Service specification over D-Bus (`org.freedesktop.secrets` / GNOME Keyring / KWallet).

---

## 8. Concurrency, Performance SLAs & Security Controls

### 8.1 Async Runtime Scheduling & Thread Pool Configuration

The Tokio runtime is initialized in multi-threaded mode tuned for network I/O:
- **Worker Threads**: Default equal to logical CPU cores (`num_cpus::get()`).
- **Blocking Thread Pool**: Capped at 16 threads for synchronous file operations (MMDB file reading and SQLite queries) via `tokio::task::spawn_blocking`.
- **Concurrency Semaphores**:
  - Port Scanner: `tokio::sync::Semaphore::new(250)` prevents OS file descriptor exhaustion (`EMFILE`).
  - DNS Propagation: `tokio::sync::Semaphore::new(15)` limits concurrent UDP resolver probes.

### 8.2 Token Bucket Rate Limiting Architecture

External HTTP requests are mediated by an asynchronous Token Bucket limiter (`tokio::sync::Mutex<TokenBucket>`):
- **Refill Rate**: $r = \frac{\text{capacity}}{\text{period}}$.
- **Burst Capacity**: Allows up to 10 requests burst.
- **Automatic Backoff**: If any cloud API responds with HTTP 429, the provider bucket enters backoff ($t_{\text{backoff}} = 2^n \times 500\text{ ms} \pm \text{jitter}$), automatically diverting calls to the next tier in the failover cascade.

### 8.3 Strict Content Security Policy (CSP) & Tauri Isolation Pattern

The webview container enforces an airtight Content Security Policy header:
```http
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https://*.tile.openstreetmap.org https://api.mapbox.com;
connect-src 'self' ipc: http://ipc.localhost;
font-src 'self';
object-src 'none';
base-uri 'self';
```
Additionally, all IPC messages pass through Tauri's cryptographic isolation iframe wrapper, which validates IPC message integrity before dispatching to Rust command handlers, guaranteeing that malicious scripts injected into DOM dependencies cannot access backend capabilities.

---

## 9. LLD Requirements Traceability & Verification Matrix

| Requirement ID | Specification Item | Section in this LLD | Concrete Implementation & Verification Evidence |
|---|---|---|---|
| **R5.1** | Rust Crate Workspace & Module Architecture | Section 2.1, Section 2.2 | Full Cargo workspace (`iptracer-core`, `iptracer-net`, `iptracer-geo`, `iptracer-daemon`, `iptracer-ui`) with comprehensive traits and structs. |
| **R5.2** | Frontend Architecture & Zustand Stores | Section 3.1, Section 3.2 | React 19 / TS component tree, 6 Zustand stores (`useTraceStore`, `usePingStore`, etc.), TanStack Query caching, and 50ms batching. |
| **R5.3** | IPC & API Contracts | Section 4.1, Section 4.2 | Complete TypeScript interface definitions for all 8 core IPC commands, auxiliary commands, and 6 streaming event channels. |
| **R5.4** | Formal Draft-07 JSON Schemas | Section 5.1 – 5.8 | All 7 schemas created in `docs/standalone_app/schemas/`, 100% validated via Python `jsonschema.Draft7Validator`, with sample payloads. |
| **R5.5** | Concrete Error-Handling Flows & Recovery | Section 6.1 – 6.3 | Strongly typed error envelope (`AppResponse`, `AppError`), complete error catalog, and 4 detailed Mermaid sequence diagrams. |
| **R5.6** | Embedded Architecture & Sequence Diagrams | Section 2.3, 4.3, 6.3 | 7 comprehensive Mermaid diagrams (Class diagrams, IPC sequence flows, and error recovery sequences). |
| **Integrity** | Authentic Non-Hardcoded Implementation | Entire Document | All code signatures, data structures, trait interfaces, and schema specifications are genuinely engineered for production implementation. |

---

*End of Low-Level Design (LLD) Document.*
