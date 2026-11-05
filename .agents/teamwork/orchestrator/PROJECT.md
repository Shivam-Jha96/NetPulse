# Project: IPTracer Standalone Cross-Platform Application

## Architecture
The IPTracer Standalone application is designed as a high-performance, low-footprint desktop suite utilizing **Tauri v2** (Rust core backend + React 19 / TypeScript web frontend) with a decoupled privilege-separation helper daemon for elevated network operations. The system incorporates unprivileged native OS socket APIs (Windows `Iphlpapi.dll`/`IcmpSendEcho2`, Linux `IPPROTO_ICMP`/`IP_RECVERR`, macOS `IPPROTO_ICMP`) to enable zero-elevation diagnostic tracing without requiring external driver dependencies (bypassing the Npcap OEM licensing barrier). The user interface is driven by a cyber-glassmorphic design system with WebGL map rendering (MapLibre GL) and high-frequency telemetry charting (Apache ECharts).

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Core Egress IP Tracing & Failover | Multi-provider client IP discovery (ipapi.co, ipinfo.io, ipify, local MaxMind GeoLite2) with automatic fallback | M1, M3, M4 | survey |
| 2 | Bogon & Private IP Filtering | Classification and handling of RFC 1918, RFC 3927, RFC 6598, loopback, and multicast ranges | M1, M4 | survey |
| 3 | Domain/Host DNS Resolution | Target domain lookup supporting System DNS, DoH (Cloudflare, Quad9), and DoT | M1, M3, M4 | survey |
| 4 | Interactive Route & Geo Map | Visual geolocation mapping with hop connections, latency heatmaps, and WebGL rendering | M2, M3, M4 | survey |
| 5 | Threat Intel & IP Reputation | Threat scoring via AbuseIPDB, VirusTotal, and Tor/proxy/VPN detection badges | M1, M3, M4 | survey |
| 6 | Cross-Platform Framework Selection | Evaluation of Tauri v2 vs Electron vs Flutter vs Wails vs Qt/.NET with trade-off matrix | M1 | survey |
| 7 | Zero-Elevation OS Socket Architecture | Unprivileged native OS APIs for ICMP ping, traceroute, and TCP scanning across Win/macOS/Linux | M1, M3, M4 | survey |
| 8 | Privilege Separation Helper Daemon | Isolated privileged helper for raw socket packet sniffing and SYN scanning | M1, M3, M4 | survey |
| 9 | Utility 1: Visual Traceroute / MTR | Multi-hop route tracing with latency, packet loss %, jitter, and ASN per hop | M1, M3, M4 | survey |
| 10 | Utility 2: Continuous Ping & Quality Monitor | Real-time ping sparklines, latency statistics (min/avg/max/stddev), and jitter tracking | M1, M3, M4 | survey |
| 11 | Utility 3: Port Scanner & Service Discovery | High-speed TCP connect scan, common port presets, banner grabbing, service identification | M1, M3, M4 | survey |
| 12 | Utility 4: DNS Inspector & Propagation | Comprehensive record lookup (A, AAAA, MX, NS, TXT, SOA, CNAME, DNSSEC) across 15+ global nodes | M1, M3, M4 | survey |
| 13 | Utility 5: WHOIS & RDAP Registry Inspector | Domain and IP/ASN registry lookups, registrar info, abuse contacts, CIDR allocation | M1, M3, M4 | survey |
| 14 | Utility 6: Subnet / CIDR & VLSM Calculator | IPv4 & IPv6 address calculations, subnet mask, usable host range, broadcast, VLSM planner | M1, M3, M4 | survey |
| 15 | Utility 7: LAN Device Discovery / ARP Scanner | Local network sweep, active IP detection, MAC address OUI vendor resolution, hostname probing | M1, M3, M4 | survey |
| 16 | Design System & Token Hierarchy | Cyber-glassmorphism, dark/light themes, typography (Inter/JetBrains Mono), 4px grid, CSS variables | M2 | survey |
| 17 | Interactive Web Mockup / Prototype | Fully interactive standalone HTML5/CSS3/ES6 prototype showcasing Dashboard, IP Trace, Utilities, Settings | M2 | survey |
| 18 | High-Level Design (HLD) Architecture | End-to-end architecture, service boundaries, data flows, API integrations, security/CSP, Mermaid diagrams | M3 | survey |
| 19 | Low-Level Design (LLD) Specifications | Rust module structure, TypeScript stores, class/interface contracts, IPC events, error taxonomy, Mermaid diagrams | M4 | survey |
| 20 | JSON Schemas & Data Contracts | 7 Draft-07 JSON schemas for IP trace records, traceroute, ping, port scan, DNS, WHOIS, subnet results | M4 | survey |
| 21 | Phased Implementation Roadmap | Structured roadmap (Phases 1-4: MVP to Enterprise), WBS, effort estimation, dependency graph, risk mitigations | M5 | survey |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Feasibility Study & Network Utilities Research | Cross-platform framework trade-off matrix, OS socket feasibility, deep evaluation of 7 network utilities | None | DONE |
| M2 | Comprehensive UI Interface Design & Interactive Mockups | Design tokens, component specs, responsive layout, fully functional interactive web prototype | None | DONE |
| M3 | High-Level Design (HLD) Document | End-to-end architecture, Tauri v2 recommendation, service boundaries, data flows, security model, Mermaid diagrams | M1 | DONE |
| M4 | Low-Level Design (LLD) Document | Module definitions, Rust/TS contracts, 7 JSON schemas, state management, IPC events, error taxonomy | M1, M3 | DONE |
| M5 | Phased Implementation Roadmap | Milestones MVP to Production, WBS, effort estimates, staffing, dependencies, risk mitigations | M1, M3, M4 | DONE |
| M6 | Integration, Dual-Track Review & Forensic Audit | Verification of all docs/mockups, challenger stress testing, reviewer sign-off, forensic integrity audit | M1, M2, M3, M4, M5 | DONE |

## Interface Contracts
### Tauri IPC Command Bridge (Rust Backend ↔ React Frontend)
- `invoke("trace_ip", { target: string, options: TraceOptions }): Promise<IpTraceResult>`
- `invoke("run_traceroute", { host: string, maxHops: number, timeoutMs: number }): Promise<TracerouteResult>`
- `invoke("start_continuous_ping", { host: string, intervalMs: number, count?: number }): Promise<PingSessionHandle>`
- `invoke("scan_ports", { target: string, ports: PortRange, mode: ScanMode }): Promise<PortScanResult>`
- `invoke("query_dns", { domain: string, recordTypes: string[], servers: string[] }): Promise<DnsLookupResult>`
- `invoke("query_whois", { query: string }): Promise<WhoisResult>`
- `invoke("calculate_subnet", { cidr: string }): Promise<SubnetResult>`
- `invoke("scan_lan", { interfaceName?: string }): Promise<LanScanResult>`
- Real-time streaming event channels: `trace:hop-discovered`, `ping:tick`, `port:found`, `lan:device-discovered` (with 20 Hz micro-batching channels `*:batch`)

## Code Layout
```
docs/standalone_app/
├── feasibility_study.md          # Framework evaluation, trade-off matrix, utilities research (61.6 KB, 910 lines)
├── ui_specification.md           # Design tokens, typography, component hierarchy, views (33.9 KB)
├── mockups/                      # Interactive web-based prototype
│   ├── index.html                # Single-page interactive prototype with tabbed views
│   ├── styles.css                # Cyber-glassmorphism, CSS variables, dark/light themes
│   └── app.js                    # Interactive mock engine, live telemetry, charting, mock data (1,144 lines)
├── hld.md                        # High-Level Design document with Mermaid architecture diagrams (61.9 KB, 949 lines)
├── lld.md                        # Low-Level Design document with class/module specs & JSON schemas (83.0 KB, 2,504 lines)
├── implementation_roadmap.md     # Phased roadmap, WBS, sprint estimates, risk matrix (71.8 KB)
└── schemas/                      # Formal JSON schemas for all utility outputs (7 Draft-07 schemas)
    ├── ip_trace_schema.json
    ├── traceroute_schema.json
    ├── ping_monitor_schema.json
    ├── port_scanner_schema.json
    ├── dns_inspector_schema.json
    ├── whois_rdap_schema.json
    └── subnet_calculator_schema.json
```
