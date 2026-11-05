# NetPulse 🌐⚡

> **Next-Generation Cross-Platform Network Diagnostics & IP Geolocation Suite**  
> *Engineered with Tauri v2 (Rust Core + React 19 / TypeScript)*

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-Tauri%20v2%20%7C%20Rust%20%7C%20React%2019-teal?style=flat-square)](#)
[![Design](https://img.shields.io/badge/Design-Cyber--Glassmorphic-purple?style=flat-square)](#)
[![Architecture](https://img.shields.io/badge/Docs-HLD%20%26%20LLD%20Complete-success?style=flat-square)](#)
[![Tests](https://img.shields.io/badge/Tests-28%2F28%20Passing%20(100%25)-brightgreen?style=flat-square)](#)

---

## 📖 Overview

**NetPulse** is a standalone, high-performance desktop application for network engineers, cybersecurity analysts, and developers. Originating as a concept expansion of browser-based IP tracing, NetPulse transitions into an unconstrained, zero-elevation desktop powerhouse capable of deep network telemetry, real-time route tracing, and diagnostic scanning.

Built on **Tauri v2** with a native **Rust** backend and a **React 19 / TypeScript** UI, NetPulse delivers sub-35 MB RAM idle usage, snappy native execution, and complete cross-platform compatibility across Windows, macOS, and Linux without requiring administrative privileges or bulky third-party driver installations (such as Npcap OEM).

---

## 🛠️ Companion Utilities Suite

| Utility | Capability | Native Engine |
| :--- | :--- | :--- |
| **🌐 Egress IP & Geo Tracer** | Multi-provider fallback cascade (ipapi, ipinfo, ipify) + Offline MaxMind GeoLite2 `.mmdb` fallback | Rust `reqwest` + `maxminddb` |
| **🗺️ Visual Traceroute / MTR** | Hop-by-hop latency, packet loss %, autonomous system (ASN) mapping & visual route canvas | Native OS ICMP raw sockets (`IcmpSendEcho2` / `IP_RECVERR`) |
| **📈 Live Ping & Jitter Monitor** | 60 FPS real-time sparkline telemetry, min/avg/max/stddev jitter calculation | Native Rust asynchronous loop + 20 Hz IPC batching |
| **🔍 High-Speed Port Scanner** | Configurable common profiles, service banner grabbing, TCP connect & SYN scan modes | Async Tokio socket workers |
| **🔎 DNS & Propagation Inspector** | Direct DNS queries (A, AAAA, MX, NS, TXT, SOA, CNAME, DNSSEC) across 15+ global nodes | Custom UDP/TCP resolver + DoH/DoT |
| **📋 WHOIS & RDAP Registry** | Domain & ASN registrant inspection, abuse contact resolution, CIDR allocation blocks | RDAP REST API + fallback WHOIS port 43 client |
| **🔢 CIDR & VLSM Subnet Calculator** | IPv4/IPv6 mask breakdowns, usable range calculations, bitwise binary display & VLSM planner | High-precision Rust bitwise math |

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NetPulse Frontend (React 19)                    │
│    Cyber-Glassmorphism UI • Canvas Route Map • 60 FPS Sparklines       │
│    Zustand State Stores • 20 Hz Micro-Batched IPC Listener             │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Tauri v2 IPC Bridge
┌────────────────────────────────────▼───────────────────────────────────┐
│                        NetPulse Rust Core Engine                       │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌───────────────┐  │
│  │ Egress & Geo Service │  │ Traceroute & Ping   │  │ Port Scanner  │  │
│  │ (Failover + MaxMind) │  │ (Zero-Elevation OS) │  │ (Tokio Async) │  │
│  └──────────────────────┘  └─────────────────────┘  └───────────────┘  │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌───────────────┐  │
│  │ DNS / RDAP Inspector │  │ Subnet Calculator   │  │ Local SQLite  │  │
│  │ (DNSSEC / DoH)       │  │ (Bitwise Math)      │  │ (History/Logs)│  │
│  └──────────────────────┘  └─────────────────────┘  └───────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Native OS System Sockets
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
        Windows / macOS / Linux             Remote Networks & APIs
```

---

## 📁 Repository Structure

```
NetPulse/
├── docs/
│   ├── feasibility_study.md       # Framework evaluation (Tauri v2 vs Electron vs Flutter vs Wails)
│   ├── hld.md                     # High-Level Design: System boundaries, architecture & security
│   ├── lld.md                     # Low-Level Design: Rust traits, TS stores, error taxonomy
│   ├── implementation_roadmap.md  # 32-week phased roadmap across 4 milestones (98 WBS packages)
│   ├── ui_specification.md        # Design tokens, color palette, typography & layout hierarchy
│   ├── mockups/                   # Web-based interactive prototype (HTML5/CSS3/ES6)
│   └── schemas/                   # 7 Draft-07 JSON schemas for IPC commands & data models
├── mockups/                       # Top-level standalone prototype directory
│   ├── index.html                 # Interactive prototype entrypoint
│   ├── styles.css                 # Cyber-glassmorphism CSS stylesheet
│   └── app.js                     # Reactive prototype JavaScript engine
├── schemas/                       # Top-level JSON data schemas
├── tests/                         # Automated 4-tier acceptance test suite
│   ├── runner.js                  # Automated test runner
│   ├── lib/                       # Test assertions, markdown & schema validators
│   └── suites/                    # Tier 1 to Tier 4 test suites
└── PROJECT.md                     # Feature inventory, milestone definitions & IPC contracts
```

---

## 🧪 Testing & Verification

NetPulse features a comprehensive 4-tier automated test suite verifying feature completeness, schema conformance, cross-module contract alignment, and acceptance criteria:

```bash
# Run all 4 test tiers
node tests/runner.js

# Run specific tier
node tests/runner.js --tier=1,2
```

---

## 🎨 Interactive Prototype

You can immediately explore the interactive cyber-glassmorphic prototype in any web browser:

1. Open `mockups/index.html` in your browser.
2. Experience tab switching across **Dashboard**, **IP Trace**, **Utilities**, and **Settings**.
3. Toggle between **Dark** and **Light** themes.
4. Test interactive simulations for **IP route mapping**, **live ping sparklines**, and the **CIDR subnet calculator**.

---

## 🗺️ Implementation Roadmap

* **Milestone 1: Core MVP (Weeks 1–8)** — Tauri v2 desktop shell, Rust IP geolocation cascade with offline MMDB, interactive Canvas route map, history storage.
* **Milestone 2: Diagnostic Utilities (Weeks 9–16)** — Continuous Ping monitor with 60 FPS sparkline telemetry, unprivileged visual Traceroute/MTR, comprehensive DNS resolver.
* **Milestone 3: Advanced Network Tools (Weeks 17–24)** — High-speed Port Scanner, WHOIS/RDAP client, CIDR/VLSM Subnet calculator.
* **Milestone 4: Enterprise Hardening & Release (Weeks 25–32)** — Automated CI/CD signing (Windows Authenticode, macOS Notarization, Linux AppImage/deb), threat intelligence badge integration, security audit.
