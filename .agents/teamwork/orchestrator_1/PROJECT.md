# Project: NetPulse Desktop E2E Manual Testing Specification Execution

## Architecture
The test execution framework directly targets the native NetPulse release binary (`src-tauri/target/release/netpulse.exe`) running under Windows 11 as a standard unprivileged user (Medium Integrity Level). The desktop application uses Tauri v2 (Rust backend with modular member crates: `iptracer-core`, `iptracer-net`, `iptracer-geo`, `iptracer-daemon`, `iptracer-ui`, and React 19 / TypeScript frontend bundled in `dist/`).
Programmatic test execution is driven via Chrome DevTools Protocol (CDP) WebSocket on port 9222 enabled by `$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9222"`. This enables non-invasive, live multi-modal verification:
1. Native UI / DOM inspection, interaction, and visual state verification.
2. Direct backend IPC command invocations via `window.__TAURI_INTERNALS__.invoke(command, args)` within the live desktop runtime.
3. Event stream subscriptions (`trace:hop-discovered`, `ping:tick`, `port:found`, `lan:device-discovered`, `watchdog:status`, `multitrace:progress`).
4. High-resolution screenshot capture via `Page.captureScreenshot`.
5. Process behavior, error trapping, and log auditing via `Runtime.consoleAPICalled` and process telemetry.

## Feature Inventory
| # | Feature / Test Suite | Description | Milestone | Source |
|---|---------------------|-------------|-----------|--------|
| 1 | MTS-SHELL-001 | Frameless Custom Title Bar & Window Controls (drag, minimize, maximize/restore, close, elevation badge) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 2 | MTS-SHELL-002 | Dynamic Dual Theme Engine (Cyber-Dark #0b0f19 to Tactical Light #0f172a toggle, WCAG AA compliance) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 3 | MTS-SHELL-003 | Sidebar Navigation Router & Persistent Status Bar (11 modules, active glow, NIC/Egress/GeoLite2/IPC metrics) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 4 | MTS-DASH-001 | Automated Egress Discovery & Map Initialization (4XL IP banner, routability badge, Lat/Long, threat level) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 5 | MTS-DASH-002 | Provider Failover Cascade Health & Diagnostic Shortcuts (MaxMind, ipapi, ipinfo, ipify health cards) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 6 | MTS-TRACE-001 | Visual MTR & Geodesic Canvas (ICMP traceroute to 1.1.1.1, animated pulse, hop table with RTT/loss/jitter/ASN) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 7 | MTS-TRACE-002 | Mid-Flight Trace Cancellation & Boundary Hops (instant socket loop stop, partial path retention, hop clamping) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 8 | MTS-MTRACE-001 | Concurrent Multi-Target MTR & Route Deviation (parallel tracing to 1.1.1.1, 8.8.8.8, github.com, deviation detection) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 9 | MTS-WATCH-001 | Sentinel Watchdog Background Daemon (24/7 gateway & public anchor polling, threshold alerts, event log) | M1 | `docs/manual_testing_scripts_e2e.md` |
| 10 | MTS-PING-001 | High-Frequency Telemetry & RFC 3550 Jitter (200ms ping to 1.1.1.1, 60 FPS sparkline, min/avg/max/jitter/loss) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 11 | MTS-PING-002 | Packet Loss & Unreachable Host Handling (target 192.0.2.1 TEST-NET-1, 100% loss climbs, timeout ticks, zero UI freeze) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 12 | MTS-SUBNET-001 | CIDR Bitwise Calculator & Visual Octets (192.168.10.0/24, netmask, wildcard, binary octet breakdown, JSON export) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 13 | MTS-SUBNET-002 | Variable Length Subnet Mask (VLSM) Partitioner (10.0.0.0/16 base, descending partition table, collision-free ranges) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 14 | MTS-PORT-001 | Multi-Mode TCP Port Scanner (scanme.nmap.org, Web preset 80/443/8080, banner grabbing, service identification) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 15 | MTS-PORT-002 | Monospace TLS Certificate Inspector (Port 443 detail drawer: Subject, Issuer, Validity dates, Cipher Suite, ALPN) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 16 | MTS-PORT-003 | Custom Port Syntax Parser & Concurrency (ranges/lists `21-25, 53, 80, 443, 3306`, Tokio concurrency scaling to 500) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 17 | MTS-DNS-001 | Multi-Record & Cryptographic DNSSEC Inspector (cloudflare.com A/MX, TTL, DNSSEC trust badge SECURE/INSECURE) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 18 | MTS-DNS-002 | Global Propagation Grid (15+ international resolver nodes, latency, country flags, status pills MATCH/MISMATCH) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 19 | MTS-WHOIS-001 | RFC 7480 RDAP Registry & Contact Inspector (cloudflare.com / 1.1.1.1 RDAP, lifecycle dates, abuse card, raw text toggle) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 20 | MTS-LAN-001 | Unprivileged LAN Discovery Sweep (Ethernet/Wi-Fi ARP cache + ICMP sweep, MAC OUI vendor resolution, hostname probing) | M2 | `docs/manual_testing_scripts_e2e.md` |
| 21 | MTS-CONFIG-001 | Workstation Configuration & Preference Persistence (theme, default ping interval 500ms, DNS 9.9.9.9, vault sync) | M3 | `docs/manual_testing_scripts_e2e.md` |
| 22 | MTS-REPORT-001 | Multi-Format Diagnostic Reporting Export (HTML summary, RFC 4180 CSV, JSON, binary libpcap 2.4 PCAP download) | M3 | `docs/manual_testing_scripts_e2e.md` |
| 23 | MTS-CHAOS-001 | Input Vector Trapping & Fuzzing (10 vectors CHAOS-01 to CHAOS-10: IP, URL, hop clamping, /0 to /32 CIDR, port strings, NXDOMAIN, WHOIS symbols, debouncing) | M3 | `docs/manual_testing_scripts_e2e.md` |
| 24 | MTS-CHAOS-002 | Hardware Network Disconnection Stress ("pull plug" during active 200ms ping, NIC DOWN, timeout ticks, auto-recovery on reconnect) | M3 | `docs/manual_testing_scripts_e2e.md` |
| 25 | MTS-CHAOS-003 | High-Frequency Tab Switching Stress Under Active Telemetry (concurrent ping + port scan + 500ms tab cycling, zero unmount crash/leak) | M3 | `docs/manual_testing_scripts_e2e.md` |
| 26 | User Journeys | 3 Complete Persona Workflows: Incident Response Engineer, Penetration Analyst, System Administrator LAN Audit | M3 | `docs/manual_testing_scripts_e2e.md` |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Core UI & Telemetry Test Execution | MTS-SHELL (001-003), MTS-DASH (001-002), MTS-TRACE (001-002), MTS-MTRACE (001), MTS-WATCH (001) | None | DONE |
| M2 | Protocol & Network Diagnostic Test Execution | MTS-PING (001-002), MTS-SUBNET (001-002), MTS-PORT (001-003), MTS-DNS (001-002), MTS-WHOIS (001), MTS-LAN (001) | M1 | DONE |
| M3 | Configuration, Export, Chaos Scenarios & User Journeys | MTS-CONFIG (001), MTS-REPORT (001), MTS-CHAOS (001 [10 vectors], 002, 003), 3 Persona User Journeys | M2 | DONE |
| M4 | Independent Review, Challenger Verification & Forensic Integrity Audit | Multi-agent review of all 25 test outcomes, challenger adversarial stress verification, forensic integrity audit | M1, M2, M3 | DONE |
| M5 | Comprehensive Test Execution Report & Delivery Synthesis | Production of final comprehensive test execution report detailing outcomes across all 14 suites, 25 test cases, chaos, and stress tests | M4 | DONE |

## Interface Contracts & Test Execution Architecture
### CDP Automation Driver (`tests/e2e/cdp_driver.js`)
- Runtime Target: `src-tauri/target/release/netpulse.exe`
- Environment Flag: `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9222"`
- Transport: Native WebSocket connection to `ws://127.0.0.1:9222/devtools/page/<target_id>`
- Capabilities:
  - `evaluate(expression)`: Execute JavaScript within WebView2 context.
  - `click(selector)`: Dispatch mouse/touch events to DOM elements.
  - `typeText(selector, text)`: Input text into fields.
  - `invokeIpc(command, args)`: Call `window.__TAURI_INTERNALS__.invoke(command, args)`.
  - `listenEvent(event, timeoutMs)`: Capture Tauri backend streaming events.
  - `captureScreenshot(filename)`: Save full-window PNG via `Page.captureScreenshot`.
  - `getConsoleLogs()`: Collect runtime console output and errors.

## Code Layout
```
tests/e2e/
├── cdp_driver.js              # Native WebSocket CDP client & process controller
├── run_m1_suites.js           # M1: MTS-SHELL, MTS-DASH, MTS-TRACE, MTS-MTRACE, MTS-WATCH
├── run_m2_suites.js           # M2: MTS-PING, MTS-SUBNET, MTS-PORT, MTS-DNS, MTS-WHOIS, MTS-LAN
├── run_m3_suites.js           # M3: MTS-CONFIG, MTS-REPORT, MTS-CHAOS, User Journeys
├── run_all_suites.js          # Master runner orchestrating all 14 suites
├── artifacts/                 # Observable evidence artifacts
│   ├── screenshots/           # PNG captures of test states (30 files)
│   ├── telemetry/             # JSON dumps of IPC responses (28 files)
│   └── reports/               # Exported HTML, CSV, JSON, PCAP files (7 files)
```
