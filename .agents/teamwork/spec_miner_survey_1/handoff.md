# NetPulse End-to-End Manual Testing Specification & Runsheet Extraction Report

**Agent:** `spec_miner_survey_1` (Role: `teamwork_spec_miner`)  
**Specification Source:** `d:\Dev\repos\NetPulse\docs\manual_testing_scripts_e2e.md` (Version: `1.0.0-GA`, 774 lines, 43,781 bytes)  
**Authoritative User Request:** `d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md`  
**Target Native Executable:** `d:\Dev\repos\NetPulse\src-tauri\target\release\netpulse.exe` (17,054,208 bytes)  
**Target Delivery Path:** `d:\Dev\repos\NetPulse\.agents\teamwork\spec_miner_survey_1\handoff.md`  

---

## 1. Observation

Direct observations from the repository, specification documents, native desktop build, and test runners:

1. **Test Runsheet Specification File (`docs/manual_testing_scripts_e2e.md`):**
   - File length: 774 lines (43,781 bytes).
   - Target build declared: *"NetPulse Desktop v1.0.0 (Tauri v2 / Rust Core + React 19 Frontend)"* (line 3).
   - Author persona: *"Senior E2E Network QA Engineer / User Acceptance Testing (UAT) Lead"* (line 4).
   - Privilege requirements: Runs under *"Standard User"* with unprivileged zero-elevation OS socket APIs, with optional *"Administrator (ROOT elevated)"* helper (lines 26–28).
   - Master Test Suite Matrix (lines 41–60): Enumerates exactly 14 test suites (`MTS-SHELL` through `MTS-CHAOS`).
   - Human Tester Execution Log & Sign-Off Sheet (lines 752–770): Confirms exactly 25 test cases across the 14 suites, signed off by LEAD QA.

2. **Native Executable Target:**
   - Path `src-tauri/target/release/netpulse.exe` exists with file size 17,054,208 bytes (compiled Rust binary with Tauri v2 runtime, accompanied by `netpulse.pdb` 9,572,352 bytes).
   - Backend Rust crate structure in `src-tauri/crates/`: `iptracer-core`, `iptracer-daemon`, `iptracer-geo`, `iptracer-net`, `iptracer-ui`.
   - IPC Command registry in `src-tauri/crates/iptracer-ui/src/commands.rs` (920 lines) exposes 28 Tauri commands matching the frontend IPC contract in `src/api/ipc.ts` (811 lines).

3. **Architecture & Specification Test Suite Execution:**
   - Ran `node tests/runner.js` via `run_command`:
     ```
     Target Directory: D:\Dev\repos\NetPulse\docs
     Active Tiers: [1, 2, 3, 4] | Total Tests: 28
     Total Tests: 28 | Passed: 28 | Failed: 0 | Duration: 109.45ms
     ✔ ALL E2E ACCEPTANCE TESTS PASSED SUCCESSFULLY (100% PASS RATE)
     ```
   - Confirms all 7 JSON schemas (`ip_trace_schema.json`, `traceroute_schema.json`, `ping_monitor_schema.json`, `port_scanner_schema.json`, `dns_inspector_schema.json`, `whois_rdap_schema.json`, `subnet_calculator_schema.json`) exist and validate Draft-07 syntax.

4. **14 Test Suites & 25 Test Cases Distribution:**
   - `MTS-SHELL` (3 cases): `MTS-SHELL-001`, `MTS-SHELL-002`, `MTS-SHELL-003`
   - `MTS-DASH` (2 cases): `MTS-DASH-001`, `MTS-DASH-002`
   - `MTS-TRACE` (2 cases): `MTS-TRACE-001`, `MTS-TRACE-002`
   - `MTS-MTRACE` (1 case): `MTS-MTRACE-001`
   - `MTS-WATCH` (1 case): `MTS-WATCH-001`
   - `MTS-PING` (2 cases): `MTS-PING-001`, `MTS-PING-002`
   - `MTS-SUBNET` (2 cases): `MTS-SUBNET-001`, `MTS-SUBNET-002`
   - `MTS-PORT` (3 cases): `MTS-PORT-001`, `MTS-PORT-002`, `MTS-PORT-003`
   - `MTS-DNS` (2 cases): `MTS-DNS-001`, `MTS-DNS-002`
   - `MTS-WHOIS` (1 case): `MTS-WHOIS-001`
   - `MTS-LAN` (1 case): `MTS-LAN-001`
   - `MTS-CONFIG` (1 case): `MTS-CONFIG-001`
   - `MTS-REPORT` (1 case): `MTS-REPORT-001`
   - `MTS-CHAOS` (3 cases, including 10 granular chaos scenarios): `MTS-CHAOS-001` (CHAOS-01 through CHAOS-10), `MTS-CHAOS-002`, `MTS-CHAOS-003`
   - User Journeys (3 end-to-end paths): Incident Response Engineer, Penetration Analyst, System Administrator LAN Audit.

---

## 2. Logic Chain

1. **From Requirement to Target Specification:**
   The user request (`ORIGINAL_REQUEST.md`) mandates executing all 14 test suites, covering all 25 test cases, edge cases, chaos scenarios, and stress tests defined in `docs/manual_testing_scripts_e2e.md` against the native desktop runtime (`src-tauri/target/release/netpulse.exe`). To enable high-confidence, comprehensive execution and reporting, an exhaustive extraction of all suite parameters, preconditions, inputs, execution steps, expected observables, chaos conditions, and evaluation criteria is required.

2. **Verification of Document Completeness:**
   Inspection of `docs/manual_testing_scripts_e2e.md` confirms that every test suite has explicit IDs, objectives, preconditions, procedural steps, and expected results. The Master Test Matrix (Section 2) and Sign-Off Sheet (Section 6) establish that the test suite is partitioned into exactly 14 suites and 25 test cases.

3. **Granular Breakdown of Chaos & Stress Conditions:**
   Under `MTS-CHAOS-001`, the runsheet embeds a dedicated 10-scenario matrix (CHAOS-01 through CHAOS-10) targeting IP validation, URL parsing, hop clamping, CIDR bitwise limits, default routing calculation, single-host edge calculation, port string sanitization, NXDOMAIN responses, non-alphanumeric WHOIS inputs, and high-frequency button debouncing. Under `MTS-CHAOS-002` and `MTS-CHAOS-003`, real-world hardware link drop ("pull the plug") and memory-leak tab cycling are specified.

4. **Traceability to Architecture & IPC Bridge:**
   The IPC bridge (`src/api/ipc.ts`) implements matching invocation methods and event listeners for every single test case: `trace_ip`, `run_traceroute`, `stop_traceroute`, `start_continuous_ping`, `stop_continuous_ping`, `calculate_subnet`, `get_network_interfaces`, `check_elevation_status`, `request_elevation`, `scan_lan`, `scan_ports`, `query_dns`, `query_whois`, `start_watchdog`, `stop_watchdog`, `get_watchdog_status`, `run_multitrace`, `get_historical_paths`, `export_report`, `sync_cloud_telemetry`, and `get_enterprise_policy`. This ensures that every manual test step corresponds to concrete observable IPC data structures and events.

---

## 3. Caveats

1. **Hardware / Privilege Boundary:**
   In accordance with R4 (`ORIGINAL_REQUEST.md` line 25), all tests are designed to execute within standard unprivileged user permissions using Windows Win32 `Iphlpapi.dll` and BSD/Linux raw ICMP sockets without requiring administrator elevation or third-party packet drivers (Npcap). However, `MTS-LAN-001` will display the `PAL Unprivileged` badge unless elevated.
2. **External Live Network Dependencies:**
   Certain live internet tests (`1.1.1.1`, `8.8.8.8`, `github.com`, `cloudflare.com`, `scanme.nmap.org`) depend on live outbound connectivity. When executing in offline or captive environments, the application falls back to `OFFLINE_MAXMIND`, RFC 1918 bogon handling, or mock simulation shims.
3. **Scope Boundary:**
   This report represents a specification extraction and mining artifact. It does not perform code alterations or runtime modifications.

---

## 4. Conclusion

The specification `docs/manual_testing_scripts_e2e.md` is a complete, production-grade manual testing runsheet. All 14 test suites, 25 test cases, 10 granular chaos vectors, 2 stress scenarios, and 3 end-to-end user journeys are cataloged below with 100% parameter extraction, providing an actionable blueprint for desktop runtime test execution and evaluation.

---

## 5. Verification Method

To independently verify this specification extraction:
1. **File Inspection:**
   Inspect `docs/manual_testing_scripts_e2e.md` lines 1–774 using `view_file`.
2. **Schema & Specification Integrity Suite:**
   Run `node tests/runner.js` in the workspace root. All 28 tests must pass:
   ```powershell
   node tests/runner.js
   ```
3. **Binary Existence & Verification:**
   Verify `src-tauri/target/release/netpulse.exe` is present and exceeds 15 MB:
   ```powershell
   Get-Item src-tauri/target/release/netpulse.exe
   ```

---

## Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Shell / UI | Frameless Title Bar & Controls | Custom title bar with drag region, minimize, maximize/restore, branding, and elevation badge | Mouse drag, window button clicks (`-`, `Square`, `X`) | Smooth window movement, minimize to taskbar, window maximize/restore | OS window bounds clamped; prevents loss offscreen | `docs/manual_testing_scripts_e2e.md`:73–89 |
| 2 | Shell / UI | Dynamic Dual Theme Engine | Instant switching between Cyber-Dark (`#0b0f19`) and Tactical Light (`#0f172a`) modes | Theme toggle button (Sun/Moon icon) | CSS variable cascade updates across all views, WCAG AA compliance | Fallback to Cyber-Dark if preference corrupted | `docs/manual_testing_scripts_e2e.md`:92–110 |
| 3 | Shell / UI | Sidebar Navigation & Status Bar | 11-module router with active glow and persistent 4-segment bottom status bar | Navigation link clicks (11 items) | Instant view transition (<16ms), persistent NIC/Egress/GeoLite2/IPC telemetry | Preserves background polling on route switch | `docs/manual_testing_scripts_e2e.md`:113–132 |
| 4 | Dashboard | Automated Egress Discovery | Multi-provider public IP resolution, ASN classification, and coordinates mapping | Startup auto-discovery / Refresh button | 4XL IP banner, routability badge (`PUBLIC`/`BOGON`), ASN, Lat/Long, threat level | Cascades to standby providers or embedded MaxMind | `docs/manual_testing_scripts_e2e.md`:136–156 |
| 5 | Dashboard | Provider Cascade Health | 4-tier provider failover status monitoring and diagnostic launchpad shortcuts | Manual Refresh Gateway button | Cascade health cards (MaxMind, ipapi, ipinfo, ipify) and router redirect | Button debounced; shows spin animation | `docs/manual_testing_scripts_e2e.md`:159–178 |
| 6 | Traceroute | Visual MTR & Geodesic Canvas | Incremental TTL ICMP traceroute with 2D/3D geodesic trajectory and hop table | Target IP/domain (`1.1.1.1`), max hops (1–64) | Animated pulse curve on canvas, multi-hop telemetry table (RTT, loss %, jitter, ASN) | Rate-limiting hops display `*` / 100% loss without aborting | `docs/manual_testing_scripts_e2e.md`:182–203 |
| 7 | Traceroute | Mid-Flight Trace Cancellation | Asynchronous socket loop cancellation and boundary hop clamping | Stop Trace button, Hops=1, Hops=64 | Immediate socket stop, partial path retained in table, 1-hop local discovery | Clean cancellation without socket leak | `docs/manual_testing_scripts_e2e.md`:206–222 |
| 8 | Multi-MTR | Concurrent Multi-Target MTR | Parallel route tracing to multiple endpoints with path deviation detection | List of targets (`1.1.1.1`, `8.8.8.8`, `github.com`) | Concurrent progress bars, per-target hop tables, route deviation counter | Non-blocking async workers; isolates target failures | `docs/manual_testing_scripts_e2e.md`:226–243 |
| 9 | Watchdog | Sentinel Background Daemon | 24/7 gateway and public anchor probe loop with latency/loss threshold alerts | Interval (1000ms), Latency threshold (50ms) | Status badge (`MONITORING ACTIVE`), monitored targets table, alert event log | Traps unreachable targets; appends warning alert | `docs/manual_testing_scripts_e2e.md`:247–270 |
| 10 | Ping | High-Frequency Telemetry | Continuous ICMP ping at 200ms with 60 FPS sparkline and RFC 3550 jitter calculation | Host (`1.1.1.1`), interval (200ms), DF-bit checkbox | 60 FPS glowing cyan sparkline, 6 metrics (Current, Min, Avg, Max, Jitter, Loss %) | Dropped packets plotted in rose/amber | `docs/manual_testing_scripts_e2e.md`:275–304 |
| 11 | Ping | Timeout & Unreachable Handling | High-frequency polling against non-routable targets with loss % tracking | Target `192.0.2.1` (TEST-NET-1), 500ms interval | Packet Loss % climbs to 100%, sparkline renders dropped ticks | Traps socket timeout without freezing UI thread | `docs/manual_testing_scripts_e2e.md`:307–323 |
| 12 | Subnet | CIDR Bitwise Calculator | Mathematical IPv4 address parsing, netmask binary display, and prefix slider | CIDR (`192.168.10.0/24`), prefix slider | Usable range, broadcast, netmask, wildcard, 32-bit binary octets, JSON export | Boundary clamping for `/0` to `/32` | `docs/manual_testing_scripts_e2e.md`:327–360 |
| 13 | Subnet | VLSM Partitioner | Variable Length Subnet Mask partitioner based on required host counts | Base CIDR (`10.0.0.0/16`), subnet names & host counts | Descending sorted VLSM allocation table, collision-free ranges | Alerts on total host capacity overflow | `docs/manual_testing_scripts_e2e.md`:363–386 |
| 14 | Port Scan | Multi-Mode Port Scanner | High-speed TCP Connect scanning with 20 Hz batching and service detection | Target (`scanme.nmap.org`), preset `Web (80, 443, 8080)`, Grab Banners | Progress bar (0–100%), summary cards, discovered ports table, latency bars | Filtered ports tagged on connection timeout | `docs/manual_testing_scripts_e2e.md`:390–414 |
| 15 | Port Scan | TLS Certificate Inspector | Monospace cryptographic parameter inspector on Port 443 | Port 443 chevron click | Port Detail Drawer with Subject, Issuer, Valid Until, Cipher Suite, ALPN | Traps malformed/missing certificates | `docs/manual_testing_scripts_e2e.md`:416–436 |
| 16 | Port Scan | Custom Port Syntax Parser | Parser for ranges, comma-separated lists, and concurrency scaling | Custom string (`21-25, 53, 80, 443, 3306, 8000-8010`), concurrency (500) | Computes unique port list, scales Tokio workers up to 500 | Rejects invalid port strings; prevents EMFILE exhaustion | `docs/manual_testing_scripts_e2e.md`:438–452 |
| 17 | DNS | Multi-Record & DNSSEC Inspector | DNS record resolution (A, AAAA, MX, TXT) and cryptographic trust validation | Domain (`cloudflare.com`), record type (`A`/`MX`), transport | DNS Answers table (TTL, IP), DNSSEC Status badge (`SECURE`/`INSECURE`/`BOGUS`) | Distinguishes between unsigned and forged records | `docs/manual_testing_scripts_e2e.md`:456–477 |
| 18 | DNS | Global Propagation Grid | Global resolution verification across 15+ international resolver nodes | Executed domain query | Propagation grid with latency, country flags, status pills (`MATCH`/`MISMATCH`), % | Handles individual resolver timeouts gracefully | `docs/manual_testing_scripts_e2e.md`:479–501 |
| 19 | WHOIS | RFC 7480 RDAP Registry | RESTful RDAP domain and IP/ASN registry query with structured contact cards | Domain (`cloudflare.com`) or IP (`1.1.1.1`) | Handle, CIDR, Lifecycle dates, Abuse Department card, Nameservers, Raw Text toggle | Fallback toast on empty or non-existent registry records | `docs/manual_testing_scripts_e2e.md`:505–532 |
| 20 | LAN | Unprivileged LAN Discovery | Subnet sweep combining ARP cache and ICMP probes without third-party drivers | Network interface selector (`Ethernet`), Start Sweep button | Discovered devices table: IP, MAC, Vendor (OUI), Hostname, Latency, Device Type | Runs in unprivileged PAL mode without Npcap requirement | `docs/manual_testing_scripts_e2e.md`:536–570 |
| 21 | Configuration | Persistent Preferences | Workstation settings management with localStorage / SQLite vault synchronization | Theme toggle, Default Ping Interval (500ms), Default DNS (9.9.9.9) | Updates reflected immediately in other module views and persisted across reloads | Validates preference schema; recovers on corruption | `docs/manual_testing_scripts_e2e.md`:574–590 |
| 22 | Report Export | Multi-Format Diagnostic Reporting | Modal export dialog supporting HTML, CSV, JSON, and PCAP data downloads | Export button, Report Type selection, Format selection (HTML, CSV, JSON, PCAP) | Browser/OS file download (`netpulse_export_<timestamp>.<ext>`), clipboard copy | Blocks background interactions; Esc closes modal | `docs/manual_testing_scripts_e2e.md`:594–623 |
| 23 | Chaos / Stress | Input Vector Trapping & Fuzzing | Resilient error trapping across IP, URL, hops, CIDR, port, and DNS inputs | 10 malformed test inputs (CHAOS-01 through CHAOS-10) | Inline warning banners, clamp filters, debounced buttons; zero crash | Prevents unhandled promise rejections & Rust panics | `docs/manual_testing_scripts_e2e.md`:627–645 |
| 24 | Chaos / Stress | Hardware Link Cutoff ("Pull Plug") | Fault tolerance testing during network interface disconnection and reconnection | Disconnect Wi-Fi / Ethernet during active 200ms ping | Status bar NIC drops to `DOWN`, sparkline tags timeouts, auto-recovers on reconnect | Gracefully handles socket failure without thread abort | `docs/manual_testing_scripts_e2e.md`:648–664 |
| 25 | Chaos / Stress | Rapid Tab Cycling Under Load | Memory leak and state isolation stress testing during concurrent background tasks | Active ping + active port scan + rapid 500ms tab cycling | Seamless tab switching, zero React unmount warnings, intact sparkline history | Prevents memory leak & component state collision | `docs/manual_testing_scripts_e2e.md`:666–681 |

---

## Edge Cases

| # | Feature | Input | Observed Behavior |
|---|---------|-------|-------------------|
| 1 | IP Trace Target Validation (CHAOS-01) | `999.999.999.999` | Inline error banner or toast: *"Invalid IPv4/IPv6 target"*. Application remains interactive without crashing. |
| 2 | IP Trace URL Handling (CHAOS-02) | `http://google.com/path` | Gracefully extracts domain `google.com` or notifies user of invalid hostname syntax via validation message. |
| 3 | IP Trace Hop Clamping (CHAOS-03) | Hops: `-5` or `9999` | Input field clamps automatically to minimum `1` and maximum `64`. |
| 4 | Subnet Boundary Mask (CHAOS-04) | `192.168.1.1/33` | Boundary error banner: *"Prefix length must be between 0 and 32"*. Prevents bitshift arithmetic panic. |
| 5 | Subnet Default Route (CHAOS-05) | `0.0.0.0/0` | Calculates `4,294,967,296` total hosts using 64-bit integer representation without arithmetic overflow. |
| 6 | Subnet Single Host (CHAOS-06) | `10.0.0.1/32` | Calculates `1` total host and `0` usable hosts without negative number distortion or underflow. |
| 7 | Port String Sanitization (CHAOS-07) | Ports: `abc, 999999, -1` | Sanitizes input string or displays *"Invalid port range"* warning; rejects non-numeric and out-of-range (>65535) values. |
| 8 | DNS Non-Existent Domain (CHAOS-08) | `nonexistent-domain-test-xyz-12345.org` | Resolves to NXDOMAIN with clean warning toast without throwing unhandled exceptions. |
| 9 | WHOIS Malformed Query (CHAOS-09) | Query: `!@#$%^&*()` | Displays *"Registry query returned no records"* toast; query field remains interactive and handles empty payload cleanly. |
| 10 | Gateway Refresh Debounce (CHAOS-10) | Rapid click (20x/sec) on Refresh Gateway | Button disables or debounces clicks while query is inflight; prevents duplicate concurrent socket requests. |
| 11 | Traceroute Rate Limiting Hops | Target with firewall nodes (e.g. hop 4 in User Journey 1) | Intermediate hop renders `*` with 100% loss and continues tracing downstream hops without aborting session. |
| 12 | Boundary Traceroute Limits | Hops set to `1` against `8.8.8.8` | Executes single-probe TTL 1 discovery, discovers local gateway only, and cleanly halts without socket hang. |
| 13 | Unreachable Ping Host | Target `192.0.2.1` (TEST-NET-1) at 500ms interval | Socket timeouts recorded as dropped ticks in rose/amber, Packet Loss % scales toward 100% without blocking UI. |
| 14 | Host Disconnection Mid-Ping | Hardware network disconnect during 200ms ping | Status bar flags link drop (`DOWN`), ping displays timeouts, auto-recovers valid RTT plotting upon reconnection. |
| 15 | High-Frequency Tab Switching | 11 tabs cycled at 500ms intervals with ping & portscan active | UI state remains isolated, memory does not leak, sparkline history intact upon returning to Ping Monitor. |

---

## Detailed Master Test Suite & Case Inventory

### Suite 1: MTS-SHELL — Desktop Shell, Title Bar, Navigation & Theming
- **Suite ID:** `MTS-SHELL`
- **Module Under Test:** Desktop Shell & Navigation
- **Priority:** P0 | **Estimated Execution Time:** 10 mins
- **Scope:** Frameless window controls, branding badges, theme switching engine, 11-module router, and bottom status bar.

#### Case 1: MTS-SHELL-001 — Frameless Window Title Bar & Drag Region
- **Suite ID:** `MTS-SHELL` | **Case ID:** `MTS-SHELL-001`
- **Title:** Frameless Window Title Bar & Drag Region
- **Objective:** Verify frameless window controls, window dragging, branding, and elevation indicators.
- **Preconditions / State Requirements:** NetPulse application launched via native binary (`netpulse.exe`) or Tauri dev mode.
- **Specific Inputs, Targets & Parameters:**
  - Mouse left-click drag on title bar middle region (`"Tactical Network Diagnostics Workstation"`).
  - Title bar window control buttons: Minimize (`-`), Maximize/Restore (`Square`), Close (`X`).
- **Step-by-Step Execution Procedure:**
  1. Observe the top bar of the application window.
  2. Verify the logo displays `NETPULSE` with a pulsing cyan activity icon (`#00f0ff`) and `v1.0.0-GA` badge.
  3. Click and hold the left mouse button on the middle drag region ("Tactical Network Diagnostics Workstation") and drag cursor across the screen.
  4. Click the **Minimize** (`-`) button in the top right.
  5. Restore the window from the OS taskbar.
  6. Click the **Maximize / Restore** (`Square`) button.
  7. Click the **Maximize / Restore** button again to restore to normal size.
- **Expected Outcomes & Observable Indicators:**
  - Window drags smoothly across multi-monitor setups without lag or tearing.
  - Minimize collapses window to OS taskbar without suspending background telemetry.
  - Maximize expands window to monitor boundaries while maintaining custom titlebar padding.
- **Edge Cases, Chaos & Stress:** Rapid dragging across display boundaries; minimizing while continuous telemetry is streaming.
- **Pass/Fail Evaluation Criteria:** PASS if window drags fluidly, buttons trigger expected window states, and branding renders without distortion; FAIL if window hangs, controls fail, or window renders offscreen.

#### Case 2: MTS-SHELL-002 — Cyber-Dark vs. Tactical Light Theme Toggle
- **Suite ID:** `MTS-SHELL` | **Case ID:** `MTS-SHELL-002`
- **Title:** Cyber-Dark vs. Tactical Light Theme Toggle
- **Objective:** Verify dynamic CSS theme switching and contrast integrity across all components.
- **Preconditions / State Requirements:** Application open on Dashboard view.
- **Specific Inputs, Targets & Parameters:** Theme toggle button in title bar (Sun icon in Cyber-Dark mode, Moon icon in Tactical Light mode).
- **Step-by-Step Execution Procedure:**
  1. In the Title Bar, locate the theme toggle button (Sun icon in dark mode).
  2. Click the theme toggle button.
  3. Observe viewport background, text colors, borders, and glassmorphic panels.
  4. Navigate through Sidebar tabs: Dashboard -> Ping Monitor -> Subnet -> Port Scanner.
  5. Click the theme toggle button again (Moon icon) to return to Cyber-Dark mode.
- **Expected Outcomes & Observable Indicators:**
  - In Tactical Light mode:
    * Background switches from deep black (`#0b0f19`) to high-contrast tactical light/slate.
    * Text switches to high-contrast dark slate (`#0f172a`), maintaining WCAG AA readability.
    * Neon accents (`#00f0ff` cyan, `#10b981` emerald, `#a855f7` purple) adapt without blinding glare.
  - In Cyber-Dark mode:
    * Returns to deep OLED glassmorphic backdrop with translucent borders (`border-white/5`).
  - Zero instances of white-on-white or black-on-black text across any tab.
- **Edge Cases, Chaos & Stress:** Toggle theme during active 60 FPS sparkline rendering; verify canvas stroke and fill color adapt dynamically.
- **Pass/Fail Evaluation Criteria:** PASS if theme transition is instantaneous (<1 frame), contrast passes WCAG AA, and no component styles desync; FAIL if illegible text, unstyled components, or canvas glitch occurs.

#### Case 3: MTS-SHELL-003 — Sidebar Navigation & Persistent Status Bar
- **Suite ID:** `MTS-SHELL` | **Case ID:** `MTS-SHELL-003`
- **Title:** Sidebar Navigation & Persistent Status Bar
- **Objective:** Verify all 11 sidebar navigation links and real-time status bar telemetry.
- **Preconditions / State Requirements:** NetPulse open.
- **Specific Inputs, Targets & Parameters:** Sequential clicks on 11 sidebar links: Dashboard, IP Trace & MTR, Multi-Target MTR, Sentinel Watchdog, Ping Monitor, Subnet & VLSM, Port Scanner, DNS Inspector, WHOIS / RDAP, LAN Scanner, Settings.
- **Step-by-Step Execution Procedure:**
  1. Inspect the left sidebar: verify 11 navigation items exist in exact declared order.
  2. Click sequentially on each navigation item.
  3. Verify the active item is highlighted with cyan glow (`bg-[#00f0ff]/10 text-[#00f0ff]`).
  4. Observe bottom Status Bar across all view changes:
     * Left side: `NIC: Ethernet` (or active adapter) with pulsing green Wi-Fi icon.
     * Center-Left: `Egress: <IP>` in cyan font.
     * Center-Right: `GeoLite2: Active (Embedded)` with purple database icon.
     * Right side: `20 Hz IPC` with cyan radio broadcast icon.
- **Expected Outcomes & Observable Indicators:**
  - Route transitions complete in < 16ms (1 frame) with zero layout shifting.
  - Status Bar remains strictly pinned to bottom (`z-40`, height `h-7`).
  - Metrics in Status Bar remain persistent and accurate across view switches.
- **Edge Cases, Chaos & Stress:** High-speed tab switching (<100ms per click); verify no memory leak or route unmounting corruption.
- **Pass/Fail Evaluation Criteria:** PASS if all 11 views render instantly, active link glows, and status bar persists without interruption; FAIL if broken route, layout shift, or status bar dismounts.

---

### Suite 2: MTS-DASH — Dashboard & Primary Egress Gateway Discovery
- **Suite ID:** `MTS-DASH`
- **Module Under Test:** Dashboard & Primary Egress Gateway Discovery
- **Priority:** P0 | **Estimated Execution Time:** 10 mins
- **Scope:** Automated startup egress discovery, ASN resolution, geolocation coordinates, threat score, provider cascade, and launchpad shortcuts.

#### Case 4: MTS-DASH-001 — Automatic Egress IP Discovery & Geolocation Banner
- **Suite ID:** `MTS-DASH` | **Case ID:** `MTS-DASH-001`
- **Title:** Automatic Egress IP Discovery & Geolocation Banner
- **Objective:** Verify startup egress IP resolution, ASN organization, and geographic mapping.
- **Preconditions / State Requirements:** System connected to network with internet access.
- **Specific Inputs, Targets & Parameters:** Automatic startup execution or navigation to Dashboard view.
- **Step-Step Execution Procedure:**
  1. Launch NetPulse or navigate to the **Dashboard** view.
  2. Observe main banner card:
     * IP address displayed in large 4xl font.
     * Routability badge: displays `PUBLIC ROUTABLE` (or `BOGON / PRIVATE`).
     * Provider source badge: `OFFLINE_MAXMIND` or `IPAPI`.
     * Network description: ASN number, ISP name, City, Region, Country.
  3. Observe 4 Metric Cards:
     * **Coordinates:** Latitude and Longitude to 4 decimal places with timezone.
     * **Autonomous System:** AS number and organization.
     * **Reputation & Threat:** Threat score (`CLEAN (0/100)`, Tor: No, Proxy: No).
     * **Resolution Speed:** Milliseconds response time (sub-millisecond for embedded MaxMind).
- **Expected Outcomes & Observable Indicators:**
  - Displayed IP matches system egress IP.
  - Coordinates and City/Country are logically consistent with public IP location.
  - Threat score badge is green (`CLEAN`) for standard residential/enterprise IPs.
- **Edge Cases, Chaos & Stress:** Offline network startup (fallback to localhost/bogon); private IP default route.
- **Pass/Fail Evaluation Criteria:** PASS if IP, ASN, geolocation coordinates, and threat level populate accurately with sub-millisecond response time from local MaxMind; FAIL if IP is empty, undefined, crashes, or shows incorrect routability.

#### Case 5: MTS-DASH-002 — Manual Refresh Gateway & Cascade Fallback
- **Suite ID:** `MTS-DASH` | **Case ID:** `MTS-DASH-002`
- **Title:** Manual Refresh Gateway & Cascade Fallback
- **Objective:** Test manual refresh trigger and provider cascade health status card.
- **Preconditions / State Requirements:** On Dashboard view.
- **Specific Inputs, Targets & Parameters:** "Refresh Gateway" button; "Visual Traceroute" quick action in Diagnostic Launchpad.
- **Step-by-Step Execution Procedure:**
  1. Locate the **Refresh Gateway** button in the top right of the banner.
  2. Click **Refresh Gateway**.
  3. Observe button state: `RefreshCw` icon should spin while query executes.
  4. Inspect **Provider Cascade Health** panel on bottom left:
     * Verify 4 cascade levels are listed:
       1. MaxMind GeoLite2 (mmap) — `PRIMARY`
       2. ipapi.co — `STANDBY`
       3. ipinfo.io — `STANDBY`
       4. api.ipify.org — `FALLBACK`
  5. In **Diagnostic Launchpad** section, click **Visual Traceroute**.
- **Expected Outcomes & Observable Indicators:**
  - Refresh completes smoothly and resets spin animation.
  - Clicking "Visual Traceroute" immediately switches active view to **IP Trace & MTR** (`trace`).
- **Edge Cases, Chaos & Stress:** Rapid double-clicking on Refresh button (debounced); offline fallback cascade.
- **Pass/Fail Evaluation Criteria:** PASS if button animates spin during query, cascade panel lists all 4 providers with proper health status, and Diagnostic Launchpad routes to `trace`; FAIL if button freezes in spinning state or launchpad link is dead.

---

### Suite 3: MTS-TRACE — IP Trace & Visual MTR
- **Suite ID:** `MTS-TRACE`
- **Module Under Test:** IP Trace & Visual MTR
- **Priority:** P0 | **Estimated Execution Time:** 15 mins
- **Scope:** Hop-by-hop ICMP traceroute, canvas geodesic animation, multi-hop telemetry table, mid-flight cancellation, and boundary hop limits.

#### Case 6: MTS-TRACE-001 — Standard Route Trace Execution (`1.1.1.1`)
- **Suite ID:** `MTS-TRACE` | **Case ID:** `MTS-TRACE-001`
- **Title:** Standard Route Trace Execution (`1.1.1.1`)
- **Objective:** Verify ICMP TTL route tracing, interactive canvas geodesic animation, and live hop table.
- **Preconditions / State Requirements:** Navigate to **IP Trace & MTR**.
- **Specific Inputs, Targets & Parameters:** Target input: `1.1.1.1`, Max Hops: `30` (default), Protocol: ICMP TTL increment.
- **Step-by-Step Execution Procedure:**
  1. In target input bar, type `1.1.1.1`.
  2. Leave **Hops** slider/input at default `30`.
  3. Click bright cyan **Trace Route** button (`Play` icon).
  4. Observe button change to rose red **Stop Trace** button (`Square` icon).
  5. Observe **Geodesic Path Visualization** canvas above table:
     * Note curved trajectory connecting "Local Origin" (purple node) to "1.1.1.1" (cyan node).
     * Verify animated pulse moves along curve.
     * Watch new intermediate hop nodes appear along path as discovery progresses.
  6. Inspect **Multi-Hop Telemetry Table**:
     * Verify columns: `#` (TTL), `IP Address`, `Hostname / Node`, `Loss %`, `Sent`, `Recv`, `Last RTT`, `Avg RTT`, `Best / Worst`.
- **Expected Outcomes & Observable Indicators:**
  - Route tracing discovers hops incrementally.
  - Hop 1 corresponds to local default gateway (e.g., `192.168.1.1` or ISP router).
  - Terminal hop matches `1.1.1.1` (`one.one.one.one`).
  - Loss percentage shows `0%` for responding hops (green dot) or `100%` (amber/asterisk) for rate-limiting firewall nodes.
  - Button reverts to "Trace Route" upon completion.
- **Edge Cases, Chaos & Stress:** Non-responding intermediate firewall hops (display `*` and continue); target IP rate-limiting ICMP.
- **Pass/Fail Evaluation Criteria:** PASS if hops populate sequentially with accurate RTT/loss metrics, canvas renders animated geodesic curve, and trace terminates at 1.1.1.1; FAIL if trace stalls indefinitely, canvas crashes, or table fails to update.

#### Case 7: MTS-TRACE-002 — Mid-Flight Trace Cancellation & Boundary Hops
- **Suite ID:** `MTS-TRACE` | **Case ID:** `MTS-TRACE-002`
- **Title:** Mid-Flight Trace Cancellation & Boundary Hops
- **Objective:** Verify the user can gracefully cancel a traceroute mid-execution and test boundary hop limits.
- **Preconditions / State Requirements:** On IP Trace view.
- **Specific Inputs, Targets & Parameters:** Target: `8.8.8.8`, Hops: `64` (maximum boundary), followed by Hops: `1` (minimum boundary).
- **Step-by-Step Execution Procedure:**
  1. Enter destination `8.8.8.8`.
  2. Set **Hops** to `64` (maximum allowed).
  3. Click **Trace Route**.
  4. Wait until hop 3 or 4 appears, then immediately click **Stop Trace**.
  5. Verify canvas stops probing and table retains discovered hops without crashing.
  6. Now change **Hops** to `1`.
  7. Click **Trace Route**.
- **Expected Outcomes & Observable Indicators:**
  - Clicking "Stop Trace" halts ICMP packet transmission immediately.
  - Discovered hops remain intact in table without UI crash or memory leak.
  - A hop limit of `1` completes after discovering only the local gateway (TTL 1) and exits cleanly.
- **Edge Cases, Chaos & Stress:** Rapid stop click within 50ms of start; boundary hop 64 vs 1.
- **Pass/Fail Evaluation Criteria:** PASS if cancellation terminates background socket loop immediately without UI lockup, and Hops=1 stops cleanly after 1 hop; FAIL if background thread continues sending packets, UI hangs, or app crashes.

---

### Suite 4: MTS-MTRACE — Multi-Target MTR & Route Deviation Analysis
- **Suite ID:** `MTS-MTRACE`
- **Module Under Test:** Multi-Target MTR & Route Deviation Analysis
- **Priority:** P1 | **Estimated Execution Time:** 15 mins
- **Scope:** Concurrent multi-target path tracing, dynamic target chips, progress tracking, and route deviation detection against baseline.

#### Case 8: MTS-MTRACE-001 — Concurrent Multi-Target Path Tracing
- **Suite ID:** `MTS-MTRACE` | **Case ID:** `MTS-MTRACE-001`
- **Title:** Concurrent Multi-Target Path Tracing
- **Objective:** Execute concurrent route tracing to multiple endpoints and detect path deviations.
- **Preconditions / State Requirements:** Navigate to **Multi-Target MTR** (`multitrace`).
- **Specific Inputs, Targets & Parameters:** Default targets (`1.1.1.1`, `8.8.8.8`, `9.9.9.9`), added target `github.com`.
- **Step-by-Step Execution Procedure:**
  1. Observe the target management list (defaults include `1.1.1.1`, `8.8.8.8`, `9.9.9.9`).
  2. In the "Add Target" input field, type `github.com` and press Enter or click `+`.
  3. Verify `github.com` is added as a chip/target card.
  4. Remove one target by clicking the `X` or trash icon on its card.
  5. Click **Run Multi-Trace**.
  6. Observe progress bars updating concurrently across all configured targets.
  7. Switch between target tabs to compare their individual hop paths.
- **Expected Outcomes & Observable Indicators:**
  - Multi-target engine runs asynchronous concurrent probes without blocking UI thread.
  - Path deviations counter increments if any hop IP deviates from historical baseline.
  - Each target card displays its completion status, destination RTT, and hop count.
- **Edge Cases, Chaos & Stress:** Adding unresolvable hostnames; running 10 concurrent target traces simultaneously.
- **Pass/Fail Evaluation Criteria:** PASS if all concurrent target traces complete independently with individual progress tracking and route deviation comparison; FAIL if any target blocks others or UI thread starves.

---

### Suite 5: MTS-WATCH — Sentinel Background Watchdog & Health Probing
- **Suite ID:** `MTS-WATCH`
- **Module Under Test:** Sentinel Background Watchdog & Health Probing
- **Priority:** P1 | **Estimated Execution Time:** 15 mins
- **Scope:** Background daemon loop, gateway health monitoring, latency/loss threshold alerts, and alert log management.

#### Case 9: MTS-WATCH-001 — 24/7 Gateway Monitoring & Threshold Alerting
- **Suite ID:** `MTS-WATCH` | **Case ID:** `MTS-WATCH-001`
- **Title:** 24/7 Gateway Monitoring & Threshold Alerting
- **Objective:** Verify background daemon probe loop, gateway state transitions, and real-time alert dispatch.
- **Preconditions / State Requirements:** Navigate to **Sentinel Watchdog** (`watchdog`).
- **Specific Inputs, Targets & Parameters:**
  - Monitored Targets: Default Gateway (`192.168.1.1`), Primary DNS (`1.1.1.1`), Public Anchor (`8.8.8.8`).
  - Probe Interval: `1000 ms`. Latency Threshold: `50 ms`.
- **Step-by-Step Execution Procedure:**
  1. Observe current watchdog status (initial state: `IDLE / STOPPED`).
  2. Click **Start Watchdog** (or `Play` icon).
  3. Verify status updates to `MONITORING ACTIVE` with a pulsing emerald badge.
  4. Inspect the **Monitored Targets** table:
     * `Default Gateway` (`192.168.1.1`) — latency & health status.
     * `Primary DNS` (`1.1.1.1`) — latency & loss %.
     * `Public Anchor` (`8.8.8.8`) — latency & loss %.
  5. Click **Watchdog Settings / Sliders**:
     * Set probe interval to `1000 ms`.
     * Set latency threshold to `50 ms`.
  6. Observe the **Recent Alerts** event log.
  7. Click **Clear Alerts** button.
  8. Click **Stop Watchdog**.
- **Expected Outcomes & Observable Indicators:**
  - Watchdog probes targets continuously without UI frame drops.
  - If a probe exceeds latency threshold, a warning alert item is appended to alert log with timestamp and severity badge.
  - "Clear Alerts" empties log cleanly.
  - "Stop Watchdog" terminates background polling; status badge returns to `IDLE / STOPPED`.
- **Edge Cases, Chaos & Stress:** Extremely low probe interval (100ms); local default gateway unreachable.
- **Pass/Fail Evaluation Criteria:** PASS if watchdog starts, polls 3 targets continuously, logs threshold alerts when latency exceeds 50ms, clears log on command, and stops cleanly; FAIL if daemon thread leaks or fails to emit events.

---

### Suite 6: MTS-PING — Continuous Ping & Jitter Telemetry Monitor
- **Suite ID:** `MTS-PING`
- **Module Under Test:** Continuous Ping & Jitter Telemetry Monitor
- **Priority:** P0 | **Estimated Execution Time:** 15 mins
- **Scope:** 60 FPS sparkline canvas, RFC 3550 jitter calculation, Don't Fragment (DF) bit, interval changes, timeout handling, and history reset.

#### Case 10: MTS-PING-001 — High-Frequency Telemetry & 60 FPS Sparkline Canvas
- **Suite ID:** `MTS-PING` | **Case ID:** `MTS-PING-001`
- **Title:** High-Frequency Telemetry & 60 FPS Sparkline Canvas
- **Objective:** Verify real-time continuous ICMP pinging, canvas sparkline drawing, and RFC 3550 jitter calculation.
- **Preconditions / State Requirements:** Navigate to **Ping Monitor** (`ping`).
- **Specific Inputs, Targets & Parameters:** Host: `1.1.1.1`, Interval: `200 ms (Fast)`, DF-Bit: checked, Duration: 30 seconds.
- **Step-by-Step Execution Procedure:**
  1. In the host input field, enter `1.1.1.1`.
  2. In the **Interval** dropdown, select `200 ms (Fast)`.
  3. Check the **DF-Bit** (Don't Fragment) checkbox.
  4. Click the emerald **Start Monitor** button (`Play` icon).
  5. Observe the **Real-Time Sparkline Chart**:
     * Ensure the canvas draws a fluid glowing cyan curve updated at 60 FPS.
     * Notice the glowing translucent fill beneath the line.
     * Verify the last 60 tick samples move across the canvas from right to left.
  6. Inspect the 6 Telemetry Metric Cards:
     * **Current RTT:** Updates in real-time with sub-millisecond precision.
     * **Minimum RTT:** Lowest recorded ping latency.
     * **Average RTT:** Rolling mean calculation.
     * **Maximum RTT:** Highest recorded peak.
     * **Jitter / StdDev:** Real-time variance (RFC 3550).
     * **Packet Loss %:** Percentage of dropped packets (`0.0%` under healthy conditions).
  7. Let the monitor run for 30 seconds.
  8. Click the **Reset History** (`RotateCcw`) button.
  9. Click **Stop Monitor** (`Square` icon).
- **Expected Outcomes & Observable Indicators:**
  - No UI freeze or memory accumulation over sustained 200ms polling.
  - Sparkline curve renders without graphic tearing or artifacting.
  - Minimum RTT is always $\le$ Average RTT $\le$ Maximum RTT.
  - Reset history clears sparkline canvas and resets min/avg/max/jitter counters.
  - Stop Monitor halts ICMP packet transmissions cleanly.
- **Edge Cases, Chaos & Stress:** Sustained high-frequency polling for 5+ minutes (memory leak test); large packet size with DF bit set.
- **Pass/Fail Evaluation Criteria:** PASS if 60 FPS sparkline animates smoothly without drops, metrics calculate accurately with Min <= Avg <= Max, and reset/stop functions work immediately; FAIL if canvas stutters, memory balloons, or math violates statistical invariants.

#### Case 11: MTS-PING-002 — Interval Switching & Unreachable Host Handling
- **Suite ID:** `MTS-PING` | **Case ID:** `MTS-PING-002`
- **Title:** Interval Switching & Unreachable Host Handling
- **Objective:** Test interval modulation (`500ms`, `1000ms`, `2000ms`) and 100% packet loss handling.
- **Preconditions / State Requirements:** On Ping Monitor view.
- **Specific Inputs, Targets & Parameters:** Target: `192.0.2.1` (TEST-NET-1 non-routable address), Interval: `500 ms (High Freq)`.
- **Step-by-Step Execution Procedure:**
  1. Enter an unallocated non-routable address (e.g. `192.0.2.1` TEST-NET-1).
  2. Set interval to `500 ms (High Freq)`.
  3. Click **Start Monitor**.
  4. Observe how timeouts and packet drops are represented:
     * Verify Packet Loss % climbs toward `100%`.
     * Verify dropped ticks are highlighted in rose/amber on the sparkline.
  5. Click **Stop Monitor**.
- **Expected Outcomes & Observable Indicators:**
  - Application does not crash or hang on socket timeouts.
  - Visual indicator signals `TIMEOUT` or dropped packet cleanly.
  - Packet Loss percentage climbs accurately toward 100%.
- **Edge Cases, Chaos & Stress:** Host dropping 50% packets intermittently; switching intervals while ping is active.
- **Pass/Fail Evaluation Criteria:** PASS if timeouts are handled gracefully without socket deadlock, Loss % tracks to 100%, and dropped ticks render in rose/amber; FAIL if socket hangs or process crashes.

---

### Suite 7: MTS-SUBNET — CIDR & VLSM Calculator
- **Suite ID:** `MTS-SUBNET`
- **Module Under Test:** CIDR & VLSM Calculator
- **Priority:** P1 | **Estimated Execution Time:** 12 mins
- **Scope:** IPv4 bitwise binary netmask calculation, usable address range, prefix slider manipulation, JSON export, and VLSM allocation tree.

#### Case 12: MTS-SUBNET-001 — IPv4 CIDR Bitwise Calculation & Interactive Slider
- **Suite ID:** `MTS-SUBNET` | **Case ID:** `MTS-SUBNET-001`
- **Title:** IPv4 CIDR Bitwise Calculation & Interactive Slider
- **Objective:** Verify bitwise binary netmask calculation, usable address range, and real-time prefix slider manipulation.
- **Preconditions / State Requirements:** Navigate to **Subnet & VLSM** (`subnet`).
- **Specific Inputs, Targets & Parameters:** Initial CIDR: `192.168.10.0/24`, Slider target: `/26`.
- **Step-by-Step Execution Procedure:**
  1. In the CIDR input field, type `192.168.10.0/24`.
  2. Verify badges displayed next to input: Version `IPv4`, Class `Class C`, Routing `RFC 1918 Private`.
  3. Inspect the Metrics Grid:
     * Network Address: `192.168.10.0`
     * Broadcast Address: `192.168.10.255`
     * Netmask: `255.255.255.0`
     * Wildcard Mask: `0.0.0.255`
     * Usable Range: `192.168.10.1` — `192.168.10.254`
     * Total Hosts: `256`
     * Usable Hosts: `254`
  4. Inspect the **Bitwise Binary Netmask Display**:
     * Verify 32 binary bits grouped into 4 octets: `11111111 . 11111111 . 11111111 . 00000000`.
     * Ensure network bits (1s) and host bits (0s) are visually differentiated by color.
  5. Drag the prefix slider to `/26`.
  6. Verify CIDR input updates to `192.168.10.0/26`.
  7. Check updated metrics: Usable Hosts `62` (Total `64`), Netmask `255.255.255.192`.
  8. Click the **Copy JSON** icon next to the CIDR input.
  9. Paste clipboard content into a text editor and verify JSON structure.
- **Expected Outcomes & Observable Indicators:**
  - Calculations are mathematically exact according to RFC 791 / RFC 4632.
  - Slider adjustments update all cards instantly without lag.
  - Copied JSON contains valid fields matching `subnet_calculator_schema.json`.
- **Edge Cases, Chaos & Stress:** Prefix `/0` (all IPv4 space: 4,294,967,296 hosts); prefix `/31` (RFC 3021 point-to-point); prefix `/32` (single host, 0 usable); non-zero host bits in network address normalized.
- **Pass/Fail Evaluation Criteria:** PASS if all bitwise, broadcast, usable range, and host count values are mathematically exact, slider updates in real time, and JSON exports accurately; FAIL if math errors, off-by-one errors, or JSON mismatch occurs.

#### Case 13: MTS-SUBNET-002 — VLSM Subnet Partitioner
- **Suite ID:** `MTS-SUBNET` | **Case ID:** `MTS-SUBNET-002`
- **Title:** VLSM Subnet Partitioner
- **Objective:** Test Variable Length Subnet Masking (VLSM) allocation tree generation based on required hosts.
- **Preconditions / State Requirements:** On Subnet view with base network `10.0.0.0/16`.
- **Specific Inputs, Targets & Parameters:** Base CIDR: `10.0.0.0/16`. Subnet 1: `Engineering-VLAN` (120 hosts). Subnet 2: `Sales-WiFi` (50 hosts). Subnet 3: `P2P-Router-Link` (2 hosts). Action: Delete `Sales-WiFi`.
- **Step-by-Step Execution Procedure:**
  1. Enter base CIDR `10.0.0.0/16`.
  2. Scroll down to the **VLSM Subnet Partitioner** section.
  3. In "Subnet Name", enter `Engineering-VLAN`.
  4. In "Hosts Required", enter `120`.
  5. Click **Add Subnet** (`+`).
  6. Add second subnet: `Sales-WiFi`, hosts `50`.
  7. Add third subnet: `P2P-Router-Link`, hosts `2`.
  8. Inspect generated VLSM table:
     * Verify allocated prefixes:
       - `Engineering-VLAN` $\rightarrow$ `/25` (126 usable hosts, Allocated Range: `10.0.0.1` - `10.0.0.126`).
       - `Sales-WiFi` $\rightarrow$ `/26` (62 usable hosts, Allocated Range: `10.0.0.129` - `10.0.0.190`).
       - `P2P-Router-Link` $\rightarrow$ `/30` (2 usable hosts, Allocated Range: `10.0.0.193` - `10.0.0.194`).
  9. Click the trash icon on `Sales-WiFi` to delete it.
- **Expected Outcomes & Observable Indicators:**
  - Subnets are sorted in descending order of size to eliminate subnet address overlap.
  - Allocated host count accounts for network ($+1$) and broadcast ($+1$) address overhead.
  - Deleting a subnet recalculates remaining allocations without gaps or collisions.
- **Edge Cases, Chaos & Stress:** Sum of requested hosts exceeding base subnet capacity (overflow error); requesting 0 hosts; requesting 65534 hosts.
- **Pass/Fail Evaluation Criteria:** PASS if VLSM allocator packs subnets in descending order without overlapping boundaries and recalculates dynamically on deletion; FAIL if overlapping CIDRs or address collisions occur.

---

### Suite 8: MTS-PORT — High-Speed Port Scanner & Service Discovery
- **Suite ID:** `MTS-PORT`
- **Module Under Test:** High-Speed Port Scanner & Service Banner Grabbing
- **Priority:** P0 | **Estimated Execution Time:** 15 mins
- **Scope:** TCP connect/SYN scanning, port presets, 20 Hz batching, banner grabbing, TLS certificate parsing on port 443, custom range parsing, and concurrency scaling.

#### Case 14: MTS-PORT-001 — Web Preset Scan (`80, 443, 8080`) & Service Identification
- **Suite ID:** `MTS-PORT` | **Case ID:** `MTS-PORT-001`
- **Title:** Web Preset Scan (`80, 443, 8080`) & Service Identification
- **Objective:** Verify port scan execution, 20 Hz batching, open port detection, and service identification.
- **Preconditions / State Requirements:** Navigate to **Port Scanner** (`portscan`).
- **Specific Inputs, Targets & Parameters:** Target: `scanme.nmap.org` (or `127.0.0.1`), Preset: `Web (80, 443, 8080)`, Mode: `TCP Connect`, Options: `Grab Banners` checked.
- **Step-by-Step Execution Procedure:**
  1. In the target input field, enter `scanme.nmap.org` (or local test IP `127.0.0.1`).
  2. Under **Port Presets**, click the **Web (80, 443, 8080)** chip.
  3. Verify Scan Mode is set to `TCP Connect`.
  4. Ensure **Grab Banners** checkbox is checked.
  5. Click emerald **Start Scan** (`Play` icon) button.
  6. Observe progress bar animating from 0% to 100%.
  7. Inspect **Scan Summary Cards**:
     * Open Ports count (e.g. 2 or 3).
     * Closed Ports count.
     * Filtered Ports count.
     * Scan Duration in milliseconds.
  8. Inspect **Discovered Ports Table**:
     * Port `80`: Service `http`, Product name, Protocol `TCP`, Latency ms.
     * Port `443`: Service `https`, TLS Info badge.
- **Expected Outcomes & Observable Indicators:**
  - Port scanner identifies open ports accurately.
  - Open ports are highlighted in emerald with product version and latency.
  - ECharts latency sparkline renders bars corresponding to each discovered open port.
- **Edge Cases, Chaos & Stress:** Target behind firewall silently dropping SYN packets (filtered ports timing out); unreachable IP; non-standard HTTP services.
- **Pass/Fail Evaluation Criteria:** PASS if open ports 80 and 443 are discovered with accurate latency and banner products, and progress bar reaches 100%; FAIL if scan hangs indefinitely, open ports missed, or UI blocks.

#### Case 15: MTS-PORT-002 — TLS Certificate Inspector & Port Detail Modal
- **Suite ID:** `MTS-PORT` | **Case ID:** `MTS-PORT-002`
- **Title:** TLS Certificate Inspector & Port Detail Modal
- **Objective:** Verify TLS certificate parsing (Subject, Issuer, Validity, Cipher, ALPN) on port 443.
- **Preconditions / State Requirements:** Port scan completed with port 443 open.
- **Specific Inputs, Targets & Parameters:** Click on Port `443` row in Discovered Ports Table to open Port Detail Drawer.
- **Step-by-Step Execution Procedure:**
  1. In the port scan results table, find row for Port `443`.
  2. Click on the row or chevron `>` icon to open the **Port Detail Drawer**.
  3. Inspect **Service Banner** section: Verify HTTP banner text (e.g., `HTTP/2 200 OK` or `Server: nginx`).
  4. Inspect **TLS Certificate Details** section:
     * Certificate Subject (e.g., `CN=*.nmap.org` or target domain).
     * Certificate Issuer (e.g., `Let's Encrypt Authority`).
     * Valid Until date (RFC 3339 timestamp).
     * Cipher suite (e.g., `TLS_AES_256_GCM_SHA384`).
     * ALPN negotiation protocol (e.g., `h2` or `http/1.1`).
  5. Close detail drawer.
- **Expected Outcomes & Observable Indicators:**
  - TLS cryptographic parameters render clearly in monospace font.
  - Detail drawer closes smoothly without losing scan table state.
- **Edge Cases, Chaos & Stress:** Self-signed certificates; expired certificates; SNI mismatches; non-TLS services on 443.
- **Pass/Fail Evaluation Criteria:** PASS if TLS drawer displays Subject, Issuer, Expiry, Cipher Suite, and ALPN accurately, and closes cleanly; FAIL if TLS parsing errors crash the modal or drawer cannot be closed.

#### Case 16: MTS-PORT-003 — Custom Port Range & Concurrency Slider
- **Suite ID:** `MTS-PORT` | **Case ID:** `MTS-PORT-003`
- **Title:** Custom Port Range & Concurrency Slider
- **Objective:** Verify custom port syntax parsing (comma-separated, ranges) and concurrency slider limits.
- **Preconditions / State Requirements:** On Port Scanner view.
- **Specific Inputs, Targets & Parameters:** Custom Range preset input: `21-25, 53, 80, 443, 3306, 8000-8010`, Concurrency slider: `500` workers.
- **Step-by-Step Execution Procedure:**
  1. Click **Custom Range** preset chip.
  2. In custom ports input, type `21-25, 53, 80, 443, 3306, 8000-8010`.
  3. Drag **Concurrency** slider from `250` to `500` workers.
  4. Click **Start Scan**.
  5. Verify scan processes all specified ports and finishes without socket exhaustion errors.
- **Expected Outcomes & Observable Indicators:**
  - Custom parser correctly computes the distinct set of ports to scan.
  - 500 concurrency handles Tokio async task scheduling cleanly.
- **Edge Cases, Chaos & Stress:** 1,000 to 10,000 ports range under 500 concurrency; overlapping port ranges (e.g. `80-90, 85-95`); OS file descriptor limits (EMFILE).
- **Pass/Fail Evaluation Criteria:** PASS if custom syntax parses into unique port set, 500 concurrent connections run without OS socket exhaustion, and results display accurately; FAIL if parser crashes or socket errors drop scan.

---

### Suite 9: MTS-DNS — DNS & Global Propagation Inspector
- **Suite ID:** `MTS-DNS`
- **Module Under Test:** DNS Inspector & Global Propagation
- **Priority:** P1 | **Estimated Execution Time:** 12 mins
- **Scope:** Multi-record lookups (A, AAAA, MX, TXT), DNSSEC cryptographic trust chain validation, and 15+ global resolver propagation grid.

#### Case 17: MTS-DNS-001 — Multi-Record Lookup & DNSSEC Cryptographic Validation
- **Suite ID:** `MTS-DNS` | **Case ID:** `MTS-DNS-001`
- **Title:** Multi-Record Lookup & DNSSEC Cryptographic Validation
- **Objective:** Verify DNS queries across record types (A, AAAA, MX, TXT) and DNSSEC cryptographic trust chain.
- **Preconditions / State Requirements:** Navigate to **DNS Inspector** (`dns`).
- **Specific Inputs, Targets & Parameters:** Domain: `cloudflare.com`, Record Types: `A`, then `MX`, Transport: `UDP_TCP` (or `DoH` / `DoT`).
- **Step-by-Step Execution Procedure:**
  1. In the domain input, type `cloudflare.com`.
  2. Select record type **A**.
  3. Transport: leave as `UDP_TCP` (or test `DoH` / `DoT`).
  4. Click **Lookup DNS**.
  5. Inspect the **DNSSEC Status Badge**:
     * Verify state displays `SECURE (Validated)` in emerald with `ShieldCheck` icon.
     * Check details: Cryptographic chain-of-trust validated via Authenticated Data (AD) flag.
  6. Inspect the **DNS Answers Table**: Record Name, Type (`A`), TTL (e.g., `300`), and resolved IP values (`104.21.48.12`, etc.).
  7. Change record type to **MX** and click **Lookup DNS**.
  8. Verify mail exchanger priority and hostnames render in the table.
- **Expected Outcomes & Observable Indicators:**
  - DNS resolution completes in < 100ms.
  - DNSSEC status correctly distinguishes between `SECURE`, `INSECURE` (unsigned domains), and `BOGUS` (tampered/expired signatures).
  - Toast notification appears: *"DNS Inspection Complete — Resolved X records in Y ms"*.
- **Edge Cases, Chaos & Stress:** Unsigned domain (expect `INSECURE`); domain with invalid DNSSEC (e.g. `dnssec-failed.org`, expect `BOGUS`); non-existent domain (expect `NXDOMAIN` without crash).
- **Pass/Fail Evaluation Criteria:** PASS if DNS answers render with TTL, DNSSEC correctly validates AD flag as SECURE, MX records show priority/exchange, and lookup latency is < 100ms; FAIL if DNSSEC misclassifies or lookup fails.

#### Case 18: MTS-DNS-002 — Global Resolver Propagation Grid (15+ Global Nodes)
- **Suite ID:** `MTS-DNS` | **Case ID:** `MTS-DNS-002`
- **Title:** Global Resolver Propagation Grid (15+ Global Nodes)
- **Objective:** Verify global DNS propagation check across major international resolvers.
- **Preconditions / State Requirements:** DNS query executed for `cloudflare.com`.
- **Specific Inputs, Targets & Parameters:** Global resolvers across 15+ nodes: Cloudflare Anycast (Frankfurt `[DE]`), Google Public DNS (Mountain View `[US]`), Quad9 Security (Zurich `[CH]`), OpenDNS Cisco (San Francisco `[US]`), AdGuard DNS (Limassol `[CY]`), etc.
- **Step-by-Step Execution Procedure:**
  1. Scroll down to the **Global Propagation Grid** section.
  2. Observe the **Propagation Progress Bar**: displays `100% MATCH` (or partial % if propagating).
  3. Inspect resolver node cards: Cloudflare Anycast (Frankfurt `[DE]`), Google Public DNS (Mountain View `[US]`), Quad9 Security (Zurich `[CH]`), OpenDNS Cisco (San Francisco `[US]`), AdGuard DNS (Limassol `[CY]`).
  4. Verify each card shows: Country flag / code, Node response latency in milliseconds, Status pill: green `MATCH` or amber `MISMATCH`, Resolved IP values.
- **Expected Outcomes & Observable Indicators:**
  - All 15+ nodes display geographical location and query latency.
  - Responsive grid adapts cleanly to window resizing.
  - Propagation percentage calculates matches vs total nodes accurately.
- **Edge Cases, Chaos & Stress:** Regional DNS split-horizon or geo-DNS mismatch (different IPs for different continents); single node timeout / unreachable.
- **Pass/Fail Evaluation Criteria:** PASS if 15+ global nodes return status, latency, and resolved IPs with an accurate aggregate propagation percentage; FAIL if nodes hang, fail to render, or layout breaks.

---

### Suite 10: MTS-WHOIS — WHOIS & RDAP Registry Inspector
- **Suite ID:** `MTS-WHOIS`
- **Module Under Test:** WHOIS & RDAP Registry Inspector
- **Priority:** P1 | **Estimated Execution Time:** 10 mins
- **Scope:** Standardized RFC 7480 RDAP domain/IP query, entity contacts, abuse cards, lifecycle dates, authoritative nameservers, and raw text toggle.

#### Case 19: MTS-WHOIS-001 — RFC 7480-7484 RDAP Domain & IP Query
- **Suite ID:** `MTS-WHOIS` | **Case ID:** `MTS-WHOIS-001`
- **Title:** RFC 7480-7484 RDAP Domain & IP Query
- **Objective:** Verify standardized RDAP JSON/REST query for domains and IP ranges.
- **Preconditions / State Requirements:** Navigate to **WHOIS / RDAP** (`whois`).
- **Specific Inputs, Targets & Parameters:** Quick chip `cloudflare.com` (or IP `1.1.1.1`), button "Lookup Registry".
- **Step-by-Step Execution Procedure:**
  1. In the query bar, click the quick chip for `cloudflare.com`.
  2. Click bright cyan **Lookup Registry** button.
  3. Observe loading state: button indicates *"Querying..."*.
  4. Inspect the **Registry Summary Header**:
     * Handle: `NET-1-1-1-0-1` (or domain handle).
     * Object Type: `DOMAIN` or `IPV4`.
     * Network Name: `CLOUDFLARENET`.
     * CIDR Allocation: `1.1.1.0/24`.
     * Status pills: `active`, `clientTransferProhibited`.
  5. Inspect the **Lifecycle Dates Timeline**: Registration Date, Expiration Date, Last Changed Date.
  6. Inspect the **Entities & Contact Cards**:
     * Abuse Department: Organization, Email (`abuse@cloudflare.com`), Phone number, Physical address.
     * Registrar: Name and contact details.
  7. Inspect the **Authoritative Nameservers** list.
  8. Scroll down and click **Toggle Raw RDAP / WHOIS Text**:
     * Verify formatted monospace raw text disclosure block expands with full registry output.
- **Expected Outcomes & Observable Indicators:**
  - RDAP parser extracts structured entities, abuse contacts, and lifecycle dates without undefined fields.
  - Clicking quick chips automatically fills the input and triggers the query.
  - Raw text toggle collapses and expands with smooth transition.
- **Edge Cases, Chaos & Stress:** Querying IP vs domain; redacted WHOIS/GDPR records; ccTLD with non-standard RDAP bootstrapping; malformed query strings (tested in CHAOS-09).
- **Pass/Fail Evaluation Criteria:** PASS if structured RDAP fields (Handle, CIDR, Dates, Abuse Contact, Nameservers) populate cleanly and raw text toggle operates; FAIL if undefined values, uncaught exceptions, or raw text disclosure fails.

---

### Suite 11: MTS-LAN — LAN Device Discovery & Unprivileged Sweep
- **Suite ID:** `MTS-LAN`
- **Module Under Test:** LAN Device Discovery & Unprivileged Sweep
- **Priority:** P0 | **Estimated Execution Time:** 15 mins
- **Scope:** Zero-elevation unprivileged ARP/ICMP subnet sweep, IEEE OUI vendor resolution, hostname probing, device classification, filtering, and quick actions.

#### Case 20: MTS-LAN-001 — Local Subnet Sweep & MAC OUI Vendor Classification
- **Suite ID:** `MTS-LAN` | **Case ID:** `MTS-LAN-001`
- **Title:** Local Subnet Sweep & MAC OUI Vendor Classification
- **Objective:** Verify local network sweep, active IP detection, MAC OUI vendor resolution, and device classification.
- **Preconditions / State Requirements:** Navigate to **LAN Scanner** (`lan`).
- **Specific Inputs, Targets & Parameters:** Interface selector dropdown (e.g. `Ethernet` or `Wi-Fi`), Elevation badge: `PAL Unprivileged`, Start Sweep button.
- **Step-by-Step Execution Procedure:**
  1. Inspect the top control bar:
     * Interface selector dropdown displays active NIC (e.g. `Ethernet` or `Wi-Fi`).
     * Elevation badge: displays `PAL Unprivileged` (or `ROOT` if elevated).
  2. Click emerald **Start Sweep** (`Play` icon) button.
  3. Observe progress bar and discovered device counter incrementing.
  4. Inspect **Discovered Devices Table**: Verify rows contain:
     * IP Address with Gateway indicator badge on `192.168.1.1`.
     * MAC Address formatted in hex (`6C:4F:89:97:71:C0`).
     * Vendor Name resolved via IEEE OUI database (e.g., `Cisco`, `Apple`, `Intel`, `Raspberry Pi`).
     * Hostname (e.g., `gateway.lan`, `MacBook-Pro.local`).
     * Latency (e.g., `0.85 ms`).
     * Device Type Badge: `Network Equipment` (router icon), `Workstation` (laptop icon), `Mobile` (smartphone icon), `IoT` (cpu icon).
  5. Click **Vendor Filter** chip for `Apple`: verify only Apple devices are visible; click `ALL` to clear.
  6. Click **Type Filter** chip for `IoT`: verify only IoT devices remain visible; click `ALL` to clear.
  7. In search bar, type `gateway`: verify table filters to only the gateway row.
  8. On any device row, click **Copy IP** icon: verify green checkmark feedback and toast alert: *"Copied to Clipboard"*.
  9. Click **Ping** quick action button on a device row.
- **Expected Outcomes & Observable Indicators:**
  - Network sweep runs in unprivileged mode without requiring driver installs (Npcap).
  - MAC addresses accurately map to known hardware vendors.
  - Clicking "Ping" switches view to **Ping Monitor** with target IP pre-populated.
- **Edge Cases, Chaos & Stress:** Large /16 or /20 local subnet (sweep throttling); silent hosts with ICMP disabled (relying on ARP table inspection); virtual interfaces / VPN tunnels.
- **Pass/Fail Evaluation Criteria:** PASS if unprivileged sweep discovers LAN devices with MAC OUI vendor names, filters work correctly, and "Ping" action navigates to Ping Monitor; FAIL if driver required error is thrown, scan freezes, or UI navigation fails.

---

### Suite 12: MTS-CONFIG — Workstation Configuration & Settings
- **Suite ID:** `MTS-CONFIG`
- **Module Under Test:** Workstation Configuration & Settings
- **Priority:** P2 | **Estimated Execution Time:** 8 mins
- **Scope:** Preferences persistence, offline MaxMind database status, default ping interval, and default DNS resolver preferences.

#### Case 21: MTS-CONFIG-001 — Settings Adjustments & Persistent Preferences
- **Suite ID:** `MTS-CONFIG` | **Case ID:** `MTS-CONFIG-001`
- **Title:** Settings Adjustments & Persistent Preferences
- **Objective:** Verify user preferences, theme persistence, and offline database toggle.
- **Preconditions / State Requirements:** Navigate to **Settings** (`settings`).
- **Specific Inputs, Targets & Parameters:** Visual Appearance theme toggle, Offline MaxMind GeoLite2 status card, Default Ping Interval dropdown (`500 ms`), Default DNS Resolver dropdown (`9.9.9.9 (Quad9)`).
- **Step-by-Step Execution Procedure:**
  1. Inspect **Visual Appearance** section: Toggle theme button and verify immediate mode switch.
  2. Inspect **Offline MaxMind GeoLite2 Database** card: Status indicator: `Active (Embedded)`, Database format: `GeoLite2-City.mmdb`.
  3. Change **Default Ping Interval** dropdown to `500 ms`.
  4. Change **Default DNS Resolver** to `9.9.9.9 (Quad9)`.
  5. Navigate to **Ping Monitor** and verify default interval reflects updated configuration.
- **Expected Outcomes & Observable Indicators:**
  - Configuration updates persist across tab switches and application reloads.
  - Updated default interval (`500 ms`) is selected upon navigating to Ping Monitor.
- **Edge Cases, Chaos & Stress:** Storage quota exceed; corrupted local storage; toggling settings during active background watchdog or ping monitor.
- **Pass/Fail Evaluation Criteria:** PASS if settings persist across navigation and reloads, and preferences dynamically alter default values in other views; FAIL if settings reset on navigation or cause store corruption.

---

### Suite 13: MTS-REPORT — Diagnostic Reporting & Export Modal
- **Suite ID:** `MTS-REPORT`
- **Module Under Test:** Diagnostic Report Export
- **Priority:** P0 | **Estimated Execution Time:** 12 mins
- **Scope:** Modal export dialog, report type selection, multi-format file generation (HTML, CSV, JSON, PCAP), clipboard export, and download verification.

#### Case 22: MTS-REPORT-001 — Multi-Format Report Generation (HTML, CSV, JSON, PCAP)
- **Suite ID:** `MTS-REPORT` | **Case ID:** `MTS-REPORT-001`
- **Title:** Multi-Format Report Generation (HTML, CSV, JSON, PCAP)
- **Objective:** Verify full audit report generation, data integrity, and browser/OS file download.
- **Preconditions / State Requirements:** Run at least one trace or ping session to generate telemetry data.
- **Specific Inputs, Targets & Parameters:**
  - Title Bar "Export Report" button (download icon).
  - Report Types: `Full Diagnostic Audit`, `Traceroute Only`, `Ping Telemetry`, `Port Scan Audit`, `DNSSEC & Propagation`, `LAN Device Inventory`.
  - Export Formats: `HTML`, `CSV`, `JSON`, `PCAP`.
  - Actions: "Copy to Clipboard", "Download Report".
- **Step-by-Step Execution Procedure:**
  1. In the Title Bar, click the **Export Report** button (download icon).
  2. Verify the **Report Export Dialog** opens as a centered modal with backdrop blur.
  3. In the modal, review the **Report Type** options: `Full Diagnostic Audit`, `Traceroute Only`, `Ping Telemetry`, `Port Scan Audit`, `DNSSEC & Propagation`, `LAN Device Inventory`.
  4. Select **Full Diagnostic Audit**.
  5. Under **Export Format**, click each format card: HTML Report, CSV Spreadsheet, JSON Data Contract, PCAP Trace.
  6. Select **JSON** format.
  7. Click **Copy to Clipboard**: verify toast notification: *"Audit Report copied to clipboard"*.
  8. Select **HTML** format.
  9. Click **Download Report**.
  10. Observe operating system / browser download prompt: Check downloaded file name: format `netpulse_export_<timestamp>.html`.
  11. Open downloaded file in a web browser.
- **Expected Outcomes & Observable Indicators:**
  - Modal blocks background interactions while open; closes via `Esc` key or close button (`X`).
  - File download initiates immediately with valid non-zero byte size.
  - Exported HTML renders cleanly with proper styling and readable telemetry tables.
  - Exported JSON validates as well-formed JSON syntax matching schema.
- **Edge Cases, Chaos & Stress:** Exporting report with 0 telemetry sessions (empty data report); exporting PCAP without raw capture; Esc key modal exit; large telemetry dataset export.
- **Pass/Fail Evaluation Criteria:** PASS if modal opens with backdrop blur, all 4 formats generate valid payloads, JSON matches schema, and file downloads with correct timestamped filename; FAIL if modal locks UI, download produces 0 bytes, or JSON syntax is corrupted.

---

### Suite 14: MTS-CHAOS — Boundary, Stress, Chaos & Error Handling
- **Suite ID:** `MTS-CHAOS`
- **Module Under Test:** Boundary, Stress, Chaos & Error Handling
- **Priority:** P0 | **Estimated Execution Time:** 20 mins
- **Scope:** 10 granular input fuzzing/stress vectors (CHAOS-01 through CHAOS-10), network link disconnection ("pull the plug") during live telemetry, and rapid tab switching under active load.

#### Case 23: MTS-CHAOS-001 — Malformed Input Vectors & Boundary Stress
- **Suite ID:** `MTS-CHAOS` | **Case ID:** `MTS-CHAOS-001`
- **Title:** Malformed Input Vectors & Boundary Stress
- **Objective:** Verify resilient error trapping when human tester provides invalid, extreme, or malicious inputs.
- **Preconditions / State Requirements:** NetPulse application open.
- **Granular Execution Scenarios (CHAOS-01 through CHAOS-10):**
  1. **CHAOS-01 (IP Trace Target):**
     * Input: `999.999.999.999`
     * Action: Click "Trace Route".
     * Expected: Inline error banner or toast: *"Invalid IPv4/IPv6 target"*. No app crash.
  2. **CHAOS-02 (IP Trace URL Syntax):**
     * Input: `http://google.com/path`
     * Action: Click "Trace Route".
     * Expected: Gracefully extracts domain `google.com` or notifies user of invalid hostname syntax.
  3. **CHAOS-03 (IP Trace Hop Limits):**
     * Input: Hops: `-5` or `9999`
     * Action: Enter into hops field.
     * Expected: Input field automatically clamps to minimum `1` and maximum `64`.
  4. **CHAOS-04 (Subnet CIDR Prefix Boundary):**
     * Input: `192.168.1.1/33`
     * Action: Enter into CIDR field.
     * Expected: Boundary error banner: *"Prefix length must be between 0 and 32"*.
  5. **CHAOS-05 (Subnet Default Route /0):**
     * Input: `0.0.0.0/0`
     * Action: Enter into CIDR field.
     * Expected: Calculates `4,294,967,296` total hosts using 64-bit integers without integer overflow.
  6. **CHAOS-06 (Subnet Single Host /32):**
     * Input: `10.0.0.1/32`
     * Action: Enter into CIDR field.
     * Expected: Calculates `1` total host and `0` usable host without negative numbers.
  7. **CHAOS-07 (Port Scan Input Syntax):**
     * Input Ports: `abc, 999999, -1`
     * Action: Enter into Custom Ports field and click "Start Scan".
     * Expected: Sanitizes input string or displays *"Invalid port range"*; no unhandled rejection.
  8. **CHAOS-08 (DNS Non-Existent Domain):**
     * Input Domain: `nonexistent-domain-test-xyz-12345.org`
     * Action: Click "Lookup DNS".
     * Expected: Displays NXDOMAIN failure message with clean warning toast without throwing unhandled exceptions.
  9. **CHAOS-09 (WHOIS Malformed Query):**
     * Input Query: `!@#$%^&*()`
     * Action: Click "Lookup Registry".
     * Expected: Displays *"Registry query returned no records"* toast; UI remains interactive.
  10. **CHAOS-10 (Gateway Refresh Button Debouncing):**
      * Action: Rapid clicking (20 clicks per second) on "Refresh Gateway" in Dashboard.
      * Expected: Debounces or disables button while query is inflight; prevents duplicate concurrent requests.
- **Pass/Fail Evaluation Criteria:** PASS if all 10 scenarios trap errors gracefully with clear user feedback without application crashing; FAIL if any unhandled crash, memory overflow, or corrupt calculations occur.

#### Case 24: MTS-CHAOS-002 — Network Disconnection (Pull the Plug) During Live Ping
- **Suite ID:** `MTS-CHAOS` | **Case ID:** `MTS-CHAOS-002`
- **Title:** Network Disconnection (Pull the Plug) During Live Ping
- **Objective:** Impersonate real-world cable unplug or Wi-Fi drop while continuous telemetry is active.
- **Preconditions / State Requirements:** Start Continuous Ping on `1.1.1.1` at `200ms` interval.
- **Specific Inputs, Targets & Parameters:** Disconnect physical Ethernet cable or toggle Wi-Fi OFF during active ping, then reconnect.
- **Step-by-Step Execution Procedure:**
  1. While ping sparkline is actively plotting, disconnect Wi-Fi or unplug the Ethernet cable.
  2. Observe the Status Bar NIC indicator: should change from `UP` to `DOWN` or flag link loss.
  3. Observe the Ping Monitor sparkline: should transition to rendering dropped packets / timeouts without crashing.
  4. Packet Loss % should rise towards `100%`.
  5. Re-enable Wi-Fi / reconnect Ethernet cable.
  6. Observe recovery: ping samples should resume recording valid RTTs, and sparkline should recover to green/cyan.
  7. Click **Stop Monitor**.
- **Expected Outcomes & Observable Indicators:**
  - NetPulse gracefully handles asynchronous socket timeouts and link disconnections.
  - UI recovers automatically upon network restoration.
  - No thread panic or socket deadlocks.
- **Pass/Fail Evaluation Criteria:** PASS if app detects link loss, records drops without crashing, and resumes automatically when network returns; FAIL if socket thread deadlocks, app freezes, or manual app restart is required.

#### Case 25: MTS-CHAOS-003 — High-Frequency Tab Switching Under Active Telemetry
- **Suite ID:** `MTS-CHAOS` | **Case ID:** `MTS-CHAOS-003`
- **Title:** High-Frequency Tab Switching Under Active Telemetry
- **Objective:** Verify memory leak resistance and state isolation when switching tabs while background tasks run.
- **Preconditions / State Requirements:** Launch NetPulse.
- **Specific Inputs, Targets & Parameters:** Active Ping on `1.1.1.1` at 200ms + Active Port Scan on `127.0.0.1` + Rapid cycling through all 11 sidebar tabs (1 click every 500ms).
- **Step-by-Step Execution Procedure:**
  1. Navigate to **Ping Monitor**, start pinging `1.1.1.1` at `200ms`.
  2. Without stopping the ping, immediately click **Port Scanner** in the sidebar.
  3. Start a port scan on `127.0.0.1`.
  4. Rapidly cycle through all 11 sidebar tabs (1 click every 500ms).
  5. Return to **Ping Monitor**.
- **Expected Outcomes & Observable Indicators:**
  - Ping session continues accumulating samples or gracefully suspends without memory leakage.
  - No React unmounted component state update warnings or crashes in console.
  - Return to Ping Monitor displays uninterrupted sparkline history.
- **Pass/Fail Evaluation Criteria:** PASS if background telemetry persists without memory leakage, no unmounted component exceptions occur, and return to view displays intact data; FAIL if state resets, console crashes, or memory usage spikes uncontrollably.

---

## End-to-End Persona User Journeys

### User Journey 1: "The Network Incident Response Engineer"
- **Persona Context:** On-call network engineer responding to an incident of intermittent packet loss to an AWS egress gateway.
- **Execution Workflow:**
  1. Open NetPulse $\rightarrow$ inspect **Dashboard** for current public egress IP, ISP, and ASN.
  2. Click **Continuous Ping** in launchpad $\rightarrow$ target `8.8.8.8` at `200 ms` to observe real-time jitter and packet loss sparkline.
  3. Confirm 12% packet loss $\rightarrow$ navigate to **IP Trace & MTR** $\rightarrow$ run a 30-hop trace to isolate the exact router hop dropping packets.
  4. Pinpoint hop 4 (carrier peering point) showing 100% loss.
  5. Navigate to **Sentinel Watchdog** $\rightarrow$ configure background watchdog on the gateway with a 50ms latency alert.
  6. Click **Export Report** in title bar $\rightarrow$ download an executive HTML report (`netpulse_export_<timestamp>.html`) to attach to the carrier NOC incident ticket.
- **Success Criteria:** Entire diagnostic workflow completed in under 3 minutes without command-line tools.

### User Journey 2: "The Cybersecurity Penetration Analyst"
- **Persona Context:** Ethical hacker performing external reconnaissance on a target infrastructure domain.
- **Execution Workflow:**
  1. Open **DNS Inspector** $\rightarrow$ query target domain for `A`, `MX`, `TXT`, and `CAA` records; verify DNSSEC validity.
  2. Observe authoritative nameservers $\rightarrow$ navigate to **WHOIS / RDAP** $\rightarrow$ inspect registrant handle, abuse email, and IP CIDR allocation.
  3. Copy target IP $\rightarrow$ navigate to **Port Scanner** $\rightarrow$ select `Top 100` ports preset with `Grab Banners` enabled.
  4. Review discovered open services $\rightarrow$ inspect Port 443 TLS certificate details (Cipher, Issuer, Subject, Expiry).
  5. Navigate to **Report Export** $\rightarrow$ export full audit telemetry as JSON for ingestion into SIEM / vulnerability tools.
- **Success Criteria:** Full reconnaissance cycle accomplished with zero elevated driver requirements.

### User Journey 3: "The System Administrator LAN Audit"
- **Persona Context:** Sysadmin walking into a branch office requiring an immediate inventory of connected LAN equipment.
- **Execution Workflow:**
  1. Open **LAN Scanner** $\rightarrow$ check interface binding (`Ethernet 192.168.1.0/24`).
  2. Click **Start Sweep** $\rightarrow$ discover 18 active devices in 4 seconds.
  3. Filter by device type `IoT` $\rightarrow$ identify 2 unauthorized microcontrollers (Espressif chipsets).
  4. Click **Port Scan** quick action on unauthorized IP $\rightarrow$ check for exposed Telnet (23) or HTTP (80) interfaces.
  5. Copy MAC address $\rightarrow$ export LAN inventory to CSV for switch port shutdown.
- **Success Criteria:** Instant local visibility without third-party tools like Wireshark or Nmap.

---

## Defect Logging Protocol & Execution Sign-Off Matrix

### Defect Report Template
```markdown
### [DEFECT-ID]: Short Descriptive Summary
- **Module:** [e.g., TraceView / PingView / SubnetView / PortScanView / Shell]
- **Test Case ID:** [e.g., MTS-PING-001]
- **Severity:** [P0 - Blocker | P1 - Critical | P2 - Major | P3 - Minor | P4 - Cosmetic]
- **Environment:** [OS: Win11 / macOS / Ubuntu | Mode: Tauri Desktop / Web Preview | Theme: Dark / Light]
- **Target / Input Used:** [e.g., 1.1.1.1, 192.168.1.0/24, custom port range]

#### Steps to Reproduce:
1. Navigate to ...
2. Enter ...
3. Click ...

#### Expected Behavior:
[Detailed description of what the UI / socket should have done]

#### Actual Behavior:
[Detailed description of what actually occurred, including console errors or layout glitches]

#### Visual Evidence:
[Screenshot / recording link / console stack trace]
```

### Master Execution Sign-Off Sheet

| Suite ID | Module Under Test | Total Cases | Target Executable | Privilege Mode | Sign-off Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **MTS-SHELL** | Desktop Shell & Navigation | 3 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-DASH** | Dashboard & Primary Egress | 2 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-TRACE** | IP Trace & Visual MTR | 2 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-MTRACE** | Multi-Target MTR & Route Diff | 1 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-WATCH** | Sentinel Background Watchdog | 1 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-PING** | Continuous Ping & Jitter | 2 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-SUBNET** | CIDR & VLSM Calculator | 2 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-PORT** | High-Speed Port Scanner | 3 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-DNS** | DNS Inspector & Propagation | 2 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-WHOIS** | WHOIS & RDAP Registry | 1 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-LAN** | LAN Device Discovery | 1 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-CONFIG** | Workstation Configuration | 1 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-REPORT** | Diagnostic Report Export | 1 | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **MTS-CHAOS** | Stress, Boundary & Chaos | 3 (10 vectors) | `netpulse.exe` | Standard User | READY FOR EXECUTION |
| **TOTAL** | **14 Test Suites** | **25 Cases** | **netpulse.exe** | **Standard User** | **COMPLETE SPECIFICATION MINED** |

---
*Report compiled and certified by `spec_miner_survey_1`.*
