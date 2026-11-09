# Welcome to the NetPulse Wiki 🌐⚡

> **Official Documentation & User Guide for NetPulse**  
> *Next-Generation Zero-Elevation Desktop Network Diagnostics, IP Telemetry & Geolocation Suite*  
> *Engineered with Tauri v2 (Native Rust Core + React 19 / TypeScript)*

---

## 📖 Welcome

Welcome to the **NetPulse Official Wiki**. NetPulse is a unified, lightning-fast desktop network command center engineered with **Tauri v2**, a native **Rust core**, and a **React 19 / TypeScript** cyber-glassmorphic frontend.

NetPulse was created to eliminate the friction of juggling multiple disjointed command-line utilities (`ping`, `traceroute`, `nmap`, `dig`, `whois`, `ipconfig`) or running resource-heavy, 300+ MB Electron-based applications that demand administrative elevation or kernel-level packet filter drivers (such as Npcap OEM).

Whether you are a network engineer troubleshooting BGP route anomalies, a cybersecurity auditor scanning ports, a system administrator planning VLSM subnets, or a developer diagnosing local latency spikes, this wiki provides complete documentation and step-by-step guidance.

---

## 🗺️ Wiki Quick Navigation

| Wiki Section | Description |
| :--- | :--- |
| **[[Product-Overview]]** | Product vision, key benefits, comparison matrix, target audience, and design philosophy |
| **[[Getting-Started]]** | System requirements, package manager (`winget`) install, desktop execution, web preview, and production builds |
| **[[Diagnostic-Modules]]** | In-depth operational guide for all 11 core diagnostic modules and workstation tools |
| **[[Troubleshooting-Guide]]** | Step-by-step recipes for real-world network diagnosis, Wireshark PCAP generation, and incident resolution |
| **[[Architecture-and-Security]]** | Under-the-hood look at the zero-elevation model, Tauri v2 IPC, Libpcap 2.4 serializer, and Rust Tokio engine |
| **[[Keyboard-Shortcuts]]** | Power-user keyboard shortcut cheatsheet for rapid navigation |

---

## 💎 Key Highlights at a Glance

```
┌────────────────────────────────────────────────────────────────────────┐
│                              NETPULSE                                  │
│   Tactical Network Diagnostics • Zero-Elevation • Cyber-Glassmorphic   │
├────────────────────────────────────────────────────────────────────────┤
│  [🌐 Dashboard]  [🗺️ Visual MTR]  [📈 Ping & Jitter]  [🔍 Port Scanner]  │
│  [🔎 DNS Nodes]  [📋 WHOIS/RDAP]  [🔢 Subnet/VLSM]   [📡 LAN Discovery] │
│  [🛡️ Multi-Trace] [🔔 Watchdog]   [📑 Report Export]  [⚙️ Settings]      │
└────────────────────────────────────────────────────────────────────────┘
```

- **Zero-Elevation Simplicity**: Runs immediately without root/admin permissions using native OS socket APIs (`IcmpSendEcho2`, `IPPROTO_ICMP`).
- **Blazing-Fast Native Speed**: Sub-35 MB RAM idle usage and instant sub-second launch times.
- **Hardware-Accelerated Route Mapping**: Live geodesic routes and 60 FPS sparkline telemetry charts.
- **Offline-First & Privacy-Focused**: Automatic fallback to local MaxMind GeoLite2 databases; zero user tracking or data harvesting.
- **Instant Diagnostic Reports**: Export session audits to self-contained HTML dashboards, RFC 4180 CSV, binary Libpcap 2.4 (PCAP for Wireshark), or Draft-07 JSON with a single click.
- **Commercial Package Distribution**: Official Windows Package Manager deployment (`winget install Shivam-Jha96.NetPulse`), signed NSIS installers, and Ed25519 cryptographic update verification.
- **Rigorous Test Verification**: Dual-track quality assurance with 28/28 specification tests and 25/25 live desktop E2E test cases passed (100% pass rate).

---

## 🔗 Useful Links

- **Source Code Repository**: [github.com/Shivam-Jha96/NetPulse](https://github.com/Shivam-Jha96/NetPulse)
- **Releases & Binary Downloads**: [github.com/Shivam-Jha96/NetPulse/releases](https://github.com/Shivam-Jha96/NetPulse/releases)
- **Windows Package Manager**: `winget install Shivam-Jha96.NetPulse`
- **Issue Tracker & Feature Requests**: [github.com/Shivam-Jha96/NetPulse/issues](https://github.com/Shivam-Jha96/NetPulse/issues)
- **Automated Specification Tests**: 28/28 Passing Acceptance Tests (`npm run test:spec`)
- **E2E Manual Testing Report**: [docs/E2E_MANUAL_TESTING_REPORT.md](https://github.com/Shivam-Jha96/NetPulse/blob/master/docs/E2E_MANUAL_TESTING_REPORT.md) (25/25 Master Cases PASS)
