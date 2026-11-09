# Architecture & Security 🏛️

> Technical architecture, zero-elevation socket implementation, privilege separation model, and privacy guarantees.

---

## 🏗️ System Architecture

NetPulse is built on a 3-tier reactive architecture that separates UI rendering, IPC event dispatching, and kernel socket operations:

```
┌────────────────────────────────────────────────────────────────────────┐
│                      NETPULSE FRONTEND (React 19)                      │
│   • Cyber-Glassmorphic Design System (Tailwind CSS)                    │
│   • Hardware-Accelerated 60 FPS Canvas Telemetry & Sparklines          │
│   • Zustand Reactive State Stores & 20 Hz IPC Micro-Batching           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Tauri v2 Zero-Cost IPC Bridge
┌───────────────────────────────────▼────────────────────────────────────┐
│                    NETPULSE RUST CORE ENGINE (Tauri v2)                │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ │
│ │ Egress & Geo Engine  │ │ Traceroute & Ping    │ │ Port Scanner     │ │
│ │ (Cascade + MaxMind)  │ │ (Win32 / POSIX ICMP) │ │ (Tokio Workers)  │ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────┘ │
│ ┌──────────────────────┐ ┌──────────────────────┐ ┌──────────────────┐ │
│ │ DNS & RDAP Inspector │ │ Subnet Calculator    │ │ Sentinel Daemon  │ │
│ │ (DNSSEC + DoH/DoT)   │ │ (Bitwise Rust Math)  │ │ (Uptime Watchdog)│ │
│ └──────────────────────┘ └──────────────────────┘ └──────────────────┘ │
│ ┌────────────────────────────────────────────────────────────────────┐ │
│ │ Libpcap 2.4 Binary Packet Serializer & Multi-Format Report Engine  │ │
│ └────────────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │ Zero-Elevation OS Socket Layer
         ┌──────────────────────────┴──────────────────────────┐
         ▼                                                     ▼
┌─────────────────────────────────┐           ┌──────────────────────────────────┐
│  Unprivileged Native OS Sockets │           │ Remote Networks & Public APIs    │
│  • Windows: IcmpSendEcho2       │           │ • Cloudflare / Google DoH        │
│  • macOS: IPPROTO_ICMP          │           │ • Multi-Provider IP Cascade      │
│  • Linux: IP_RECVERR            │           │ • Offline MaxMind GeoLite2 DB    │
└─────────────────────────────────┘           └──────────────────────────────────┘
```

---

## 🔒 Zero-Elevation Security Guarantee

Legacy network tools often require full administrative privileges or install kernel-mode network drivers (such as WinPcap or Npcap) that introduce driver vulnerabilities and licensing complexities.

NetPulse operates under a **Zero-Elevation Security Guarantee**:
- **Windows**: Uses unprivileged Win32 `IcmpSendEcho2` APIs provided by `Iphlpapi.dll`.
- **Linux**: Uses unprivileged datagram sockets (`IPPROTO_ICMP`) combined with `IP_RECVERR` socket flags.
- **macOS**: Uses native unprivileged BSD ICMP sockets.

### Graceful Elevation Escalation
When launched normally, NetPulse functions with 100% of its diagnostic features active under standard user privileges. If the application is intentionally run with administrative privileges (e.g. `sudo` or Run as Administrator):
- The title bar displays a green `ROOT` badge.
- Advanced raw socket capabilities (such as SYN stealth port scanning) are unlocked.
- Standard operations continue using safe OS APIs.

---

## ⚡ High-Frequency Telemetry & 20 Hz IPC Micro-Batching

To deliver smooth 60 FPS sparkline rendering without overloading the UI thread with thousands of individual IPC messages, the Rust engine uses a **micro-batched ring buffer**:
1. High-frequency packet samples are buffered in native Tokio channels.
2. The core flushes samples to the frontend over Tauri v2 event streams at **20 Hz** (every 50 ms).
3. The React 19 UI receives batched arrays and updates the hardware-accelerated canvas via `requestAnimationFrame`.

---

## 📦 Native Libpcap 2.4 Packet Generation

NetPulse includes a pure Rust implementation of the standard `libpcap 2.4` binary packet format (`src-tauri/crates/iptracer-core/src/report.rs`):
- Generates standard Ethernet frame encapsulation with IPv4/IPv6 and ICMP/TCP headers directly from socket timestamps and telemetry data.
- Does **not** require Npcap, WinPcap, or promiscuous network adapter drivers.
- The resulting `.pcap` files can be opened immediately in Wireshark, tcpdump, or Snort.

---

## 🔐 Cryptographic Update Verification

NetPulse features an in-app software updater backed by asymmetric Ed25519 cryptography:
- Update manifests are signed with an official offline release key.
- The desktop runtime validates signatures against a built-in trust anchor public key (`e3b0c442...`) before accepting any update payload.
- Users can switch release channels between `Stable`, `Beta`, and `Canary` from Workstation Settings.

---

## 🛡️ Privacy & Offline Architecture

NetPulse is strictly client-side and privacy-respecting:
- **No Analytics or Telemetry Harvesting**: NetPulse does not phone home, track usage statistics, or log target queries.
- **Direct Queries**: All network packets travel directly from your machine to the queried destination.
- **Offline MaxMind Database**: NetPulse includes built-in offline IP geolocation using MaxMind GeoLite2 `.mmdb` files, enabling full country and ASN resolution even on air-gapped or disconnected networks.
