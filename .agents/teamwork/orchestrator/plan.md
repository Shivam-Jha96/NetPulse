# Orchestration Execution Plan: NetPulse Desktop Suite

## Objective
Deliver the complete NetPulse cross-platform network diagnostics and IP geolocation desktop suite across all 4 phases (Sprints 1-16) per `docs/implementation_roadmap.md`, `docs/hld.md`, and `docs/lld.md`, with sequential worker subagents, milestone code reviews, 5-minute progress updates, and final GitHub push to `origin master`.

---

## Phase 1: Foundation & MVP Desktop Release (Sprints 1-4)
### Focus Areas:
- **Sprint 1-2**:
  - Tauri v2 scaffolding: `src-tauri` (Rust workspace, `Cargo.toml`, capabilities, main loop), frontend (`package.json`, React 19/TypeScript, Tailwind, Vite).
  - Platform Abstraction Layer (PAL) sockets: Windows (`Iphlpapi.dll` / `IcmpSendEcho2`), Unix sockets fallback.
  - Core Egress IP Tracing: multi-provider discovery (`ipapi.co`, `ipinfo.io`, `ipify`) with offline/mock bundled MaxMind GeoLite2 fallback.
  - Bogon/Private IP filtering (RFC 1918, RFC 3927, RFC 6598, loopback, multicast).
- **Sprint 3-4**:
  - Unprivileged ICMP Ping & Traceroute engine with streaming events (`trace:hop-discovered`, `ping:tick`).
  - Subnet / CIDR & VLSM Calculator engine and UI tab.
  - Cyber-glassmorphism UI layout, navigation tabs, MapLibre GL / SVG geolocation display.
  - Verification: `cargo check`, `cargo test`, `npm run build`, `node tests/runner.js`.
- **Milestone 1 Verification Gate**:
  - Dispatch dedicated code-review agent to verify Phase 1 implementation against LLD and schema specs.

---

## Phase 2: Enhanced Diagnostic Suite (Sprints 5-8)
### Focus Areas:
- **Sprint 5-6**:
  - High-Speed Port Scanner & Service Discovery (TCP connect scan, common port presets, banner grabbing, service signatures).
  - DNS Inspector & Propagation (A, AAAA, MX, NS, TXT, SOA, CNAME, DNSSEC) across global DNS resolvers / DoH.
- **Sprint 7-8**:
  - WHOIS & RDAP Registry Inspector with offline mock cache when network/rate limits occur.
  - Threat Intel & IP Reputation scoring (AbuseIPDB, VirusTotal, VPN/proxy badge indicators).
  - 20 Hz Telemetry Streaming engine, Apache ECharts interactive latency graphs, and sparklines.
  - Local SQLite Data Vault for history/favorites.
  - Auto-updater scaffolding (Ed25519 signature checks).
- **Milestone 2 Verification Gate**:
  - Dispatch dedicated code-review agent to review Phase 2 deliverables, contracts, and tests.

---

## Phase 3: Deep Packet Intelligence & Hardening (Sprints 9-12)
### Focus Areas:
- **Sprint 9-10**:
  - Privilege separation daemon architecture (`iptracer-helper`).
  - Raw SYN stealth scanning engine and packet sniffing hooks.
  - LAN Device Discovery / ARP Scanner (active IP detection, MAC address OUI vendor resolution).
- **Sprint 11-12**:
  - Graceful fallback: non-elevated fallback / simulated mode when Administrator elevation is absent.
  - Security hardening, IPC command sanitization, input validation against JSON schemas.
- **Milestone 3 Verification Gate**:
  - Dispatch dedicated code-review agent to inspect security boundaries, privilege daemon IPC, and fallback behaviors.

---

## Phase 4: Enterprise, Telemetry & Ecosystem (Sprints 13-16) & Delivery
### Focus Areas:
- **Sprint 13-14**:
  - Sentinel automated network watchdogs & multi-channel alerts (system tray notifications, webhook alerts).
  - Multi-target traceroute and path comparison engine.
- **Sprint 15-16**:
  - Enterprise cloud sync stubs and policy management.
  - Multi-format reporting (CSV, JSON, PDF/HTML export).
  - Full suite verification: `tests/runner.js` all 4 tiers, `cargo test`, frontend production bundle check.
  - Final Step: Git remote verification and push to GitHub `origin master`.
- **Milestone 4 Verification Gate**:
  - Dispatch dedicated code-review agent to perform full architectural and release sign-off.
