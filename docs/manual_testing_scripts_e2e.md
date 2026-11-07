# NetPulse — End-to-End (E2E) Manual Testing Specification & Runsheet
**Document Version:** 1.0.0-GA  
**Target Build:** NetPulse Desktop v1.0.0 (Tauri v2 / Rust Core + React 19 Frontend)  
**Author Persona:** Senior E2E Network QA Engineer / User Acceptance Testing (UAT) Lead  
**Execution Scope:** Complete System Verification (Shell, 10 Companion Utilities, Configuration, Edge Cases, Stress/Chaos)

---

## 📋 1. Test Strategy, Environment & Persona Setup

### 1.1 Human Tester Persona & Execution Mindset
As an actual end-to-end human tester impersonating a network engineer and security auditor:
- **Zero Assumptions:** Do not assume buttons work just because they are styled; inspect click interactions, disabled states, hover transitions, and keyboard event traps.
- **Visual & Sensory Inspection:** Scrutinize cyber-glassmorphic styling, contrast ratios in both Dark and Light themes, high-frequency chart fluidness (60 FPS sparklines), and canvas rendering accuracy.
- **Network Realism:** Test both real routable addresses (e.g., `1.1.1.1`, `8.8.8.8`, `github.com`), RFC 1918 private addresses (`10.0.0.1`, `192.168.1.1`), loopback (`127.0.0.1`), IPv6 targets (`2606:4700:4700::1111`), and deliberately malformed inputs.
- **Multi-Platform Scope:** Tests apply across Windows 11 (Win32 Iphlpapi), macOS Sonoma (BSD sockets), and Linux (WebKitGTK/Netlink), as well as the browser preview fallback mode (`http://localhost:1420`).

---

### 1.2 Test Environment Matrix

| Parameter | Configuration A (Desktop Native - Primary) | Configuration B (Web Simulation - Secondary) | Configuration C (Zero-Build HTML5 Prototype) |
| :--- | :--- | :--- | :--- |
| **Runtime** | Tauri v2 Desktop Wrapper (`src-tauri`) | Modern Browser (Chrome / Edge / Firefox) | Standalone Browser (`mockups/index.html`) |
| **Command** | `npx @tauri-apps/cli dev` or `.exe` | `npm run dev` (`http://localhost:1420`) | Direct file open (`mockups/index.html`) |
| **Backend Engine** | Native Rust Tokio Async + Raw Sockets | IPC Shim (`src/api/ipc.ts` simulation) | Embedded JavaScript Mock Engine (`app.js`) |
| **Privilege Modes**| 1. Standard User<br>2. Administrator (`ROOT` elevated)| Sandboxed Browser User Context | Sandboxed Browser User Context |
| **Network Interfaces**| Ethernet 1 Gbps, 802.11ax Wi-Fi, VPN TUN/TAP | Virtual Loopback / Emulated NIC | Simulated Interface List |

---

### 1.3 Pre-Test Verification Checklist
Prior to starting manual testing sessions:
- [ ] Working directory confirmed at `d:\Dev\repos\NetPulse`.
- [ ] Dependencies installed cleanly via `npm install`.
- [ ] Architecture and schema tests passing (`npm run test:spec` returns 28/28 passed).
- [ ] Verify local system has an active internet connection for live tests, and prepare an offline scenario (Wi-Fi disable / ethernet unplug).

---

## 📑 2. Master Test Suite Matrix

| Suite ID | Module Under Test | Description | Priority | Est. Time |
| :--- | :--- | :--- | :--- | :--- |
| **MTS-SHELL** | Desktop Shell & Navigation | Window controls, title bar, sidebar, status bar, theme toggle | P0 | 10 mins |
| **MTS-DASH** | Dashboard & Primary Egress | Public egress discovery, bogon flags, provider cascade | P0 | 10 mins |
| **MTS-TRACE** | IP Trace & Visual MTR | Hop-by-hop route tracing, geodesic canvas, telemetry table | P0 | 15 mins |
| **MTS-MTRACE**| Multi-Target MTR & Route Diff| Concurrent targets, route deviation detection, historical paths | P1 | 15 mins |
| **MTS-WATCH** | Sentinel Background Watchdog | 24/7 gateway health, latency/loss threshold alerts, probe loop | P1 | 15 mins |
| **MTS-PING** | Continuous Ping & Jitter | 60 FPS sparkline, RFC 3550 jitter, interval changes, DF-bit | P0 | 15 mins |
| **MTS-SUBNET**| CIDR & VLSM Calculator | Bitwise binary breakdown, prefix slider, VLSM partitioner | P1 | 12 mins |
| **MTS-PORT** | High-Speed Port Scanner | TCP connect/SYN scans, presets, banner grabbing, TLS inspect | P0 | 15 mins |
| **MTS-DNS** | DNS Inspector & Propagation | Direct record lookup, DNSSEC validation, 15+ global nodes | P1 | 12 mins |
| **MTS-WHOIS** | WHOIS & RDAP Registry | RDAP RFC 7480 query, entity contacts, expiration dates | P1 | 10 mins |
| **MTS-LAN** | LAN Device Discovery | ARP/ICMP subnet sweep, MAC OUI vendor resolution, device types | P0 | 15 mins |
| **MTS-CONFIG**| Workstation Configuration | Settings persistence, GeoLite2 toggle, default parameters | P2 | 8 mins |
| **MTS-REPORT**| Diagnostic Report Export | HTML, CSV, JSON, PCAP export modal, file download integrity | P0 | 12 mins |
| **MTS-CHAOS** | Stress, Boundary & Chaos | Packet drops, rapid navigation, network cutoff, malformed inputs | P0 | 20 mins |

---

## 🧪 3. Granular Step-by-Step Manual Test Scripts

```
LEGEND FOR EXECUTION TRACKING:
[ ] = Not Executed    [P] = Passed    [F] = Failed    [B] = Blocked    [W] = Passed with Warning
```

---

### Test Suite MTS-SHELL: Desktop Shell, Title Bar, Navigation & Theming

#### Test Case MTS-SHELL-001: Frameless Window Title Bar & Drag Region
- **Objective:** Verify frameless window controls, window dragging, branding, and elevation indicators.
- **Preconditions:** Application launched via `npx @tauri-apps/cli dev` or binary.
- **Test Steps:**
  1. Observe the top bar of the application window.
  2. Verify the logo says `NETPULSE` with a pulsing cyan activity icon (`#00f0ff`) and `v1.0.0-GA` badge.
  3. Click and hold the left mouse button on the middle drag region ("Tactical Network Diagnostics Workstation") and drag the cursor across the screen.
  4. Click the **Minimize** (`-`) button in the top right.
  5. Restore the window from the OS taskbar.
  6. Click the **Maximize / Restore** (`Square`) button.
  7. Click the **Maximize / Restore** button again to restore to normal size.
- **Expected Results:**
  - Window drags smoothly across multi-monitor displays without stutter.
  - Minimize collapses the window to the taskbar without freezing background audio/telemetry.
  - Maximize expands the window to fill the monitor while preserving the top titlebar padding.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-SHELL-002: Cyber-Dark vs. Tactical Light Theme Toggle
- **Objective:** Verify dynamic CSS theme switching and contrast integrity across all components.
- **Preconditions:** NetPulse open on Dashboard.
- **Test Steps:**
  1. In the Title Bar, locate the theme toggle button (Sun icon in dark mode).
  2. Click the theme toggle button.
  3. Observe the entire viewport background, text colors, borders, and glassmorphic panels.
  4. Navigate through Sidebar tabs: Dashboard -> Ping Monitor -> Subnet -> Port Scanner.
  5. Click the theme toggle button again (Moon icon) to return to Cyber-Dark mode.
- **Expected Results:**
  - In Tactical Light mode:
    * Background switches from `#0b0f19` (OLED deep black) to high-contrast tactical light/slate.
    * Text colors transition to high-contrast dark slate (`#0f172a`), maintaining WCAG AA readability.
    * Neon accents (`#00f0ff` cyan, `#10b981` emerald, `#a855f7` purple) adapt without blinding glare.
  - In Cyber-Dark mode:
    * Returns to deep OLED glassmorphic backdrop with subtle translucent borders (`border-white/5`).
  - No text disappears or renders as white-on-white or black-on-black.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-SHELL-003: Sidebar Navigation & Persistent Status Bar
- **Objective:** Verify all 11 sidebar navigation links and real-time status bar telemetry.
- **Preconditions:** NetPulse open.
- **Test Steps:**
  1. Inspect the left sidebar: verify 11 items exist in order:
     * Dashboard, IP Trace & MTR, Multi-Target MTR, Sentinel Watchdog, Ping Monitor, Subnet & VLSM, Port Scanner, DNS Inspector, WHOIS / RDAP, LAN Scanner, Settings.
  2. Click sequentially on each navigation item.
  3. Verify the active item gets highlighted with a cyan glow (`bg-[#00f0ff]/10 text-[#00f0ff]`).
  4. Observe the bottom Status Bar across all view changes:
     * Left side: `NIC: Ethernet` (or active adapter) with a pulsing green Wi-Fi icon.
     * Center-Left: `Egress: <IP>` in cyan font.
     * Center-Right: `GeoLite2: Active (Embedded)` with a purple database icon.
     * Right side: `20 Hz IPC` with cyan radio broadcast icon.
- **Expected Results:**
  - View changes are instantaneous (< 16ms, 1 frame) with zero flickering or layout shifts.
  - Status Bar remains strictly pinned to the bottom of the window (`z-40`, height `h-7`).
  - Status Bar metrics persist across every view switch.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-DASH: Dashboard & Primary Egress Gateway Discovery

#### Test Case MTS-DASH-001: Automatic Egress IP Discovery & Geolocation Banner
- **Objective:** Verify startup egress IP resolution, ASN organization, and geographic mapping.
- **Preconditions:** Network connected with internet access.
- **Test Steps:**
  1. Launch NetPulse or navigate to the **Dashboard** view.
  2. Observe the main banner card:
     * IP address displayed in large 4xl font.
     * Routability badge: should read `PUBLIC ROUTABLE` (or `BOGON / PRIVATE` if behind captive/carrier NAT).
     * Provider source badge: `OFFLINE_MAXMIND` or `IPAPI`.
     * Network description: ASN number, ISP name, City, Region, Country.
  3. Observe the 4 Metric Cards:
     * **Coordinates:** Latitude and Longitude formatted to 4 decimal places with timezone.
     * **Autonomous System:** AS number and organization.
     * **Reputation & Threat:** Threat score (e.g., `CLEAN (0/100)`, Tor: No, Proxy: No).
     * **Resolution Speed:** Milliseconds response time (sub-millisecond for embedded MaxMind).
- **Expected Results:**
  - Target egress IP matches system public IP (or `1.1.1.1` in simulated/fallback mode).
  - Coordinates and City/Country are logically consistent with IP location.
  - Threat badge is green (`CLEAN`) for standard residential/commercial IPs.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-DASH-002: Manual Refresh Gateway & Cascade Fallback
- **Objective:** Test manual refresh trigger and provider cascade health status card.
- **Preconditions:** On Dashboard view.
- **Test Steps:**
  1. Locate the **Refresh Gateway** button in the top right of the banner.
  2. Click **Refresh Gateway**.
  3. Observe the button state: the `RefreshCw` icon should spin while the query executes.
  4. Inspect the **Provider Cascade Health** panel on the bottom left:
     * Verify 4 cascade levels are listed:
       1. MaxMind GeoLite2 (mmap) — `PRIMARY`
       2. ipapi.co — `STANDBY`
       3. ipinfo.io — `STANDBY`
       4. api.ipify.org — `FALLBACK`
  5. In the **Diagnostic Launchpad** section, click **Visual Traceroute**.
- **Expected Results:**
  - Refresh completes smoothly and resets the spin animation.
  - Clicking "Visual Traceroute" immediately switches the active view to **IP Trace & MTR** (`trace`).
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-TRACE: Visual Traceroute & Hop-by-Hop MTR

#### Test Case MTS-TRACE-001: Standard Route Trace Execution (`1.1.1.1`)
- **Objective:** Verify ICMP TTL route tracing, interactive canvas geodesic animation, and live hop table.
- **Preconditions:** Navigate to **IP Trace & MTR**.
- **Test Steps:**
  1. In the target input bar, type `1.1.1.1`.
  2. Leave the **Hops** slider/input at default `30`.
  3. Click the bright cyan **Trace Route** button (`Play` icon).
  4. Observe the button change to a rose red **Stop Trace** button (`Square` icon).
  5. Observe the **Geodesic Path Visualization** canvas above the table:
     * Note the curved trajectory connecting "Local Origin" (purple node) to "1.1.1.1" (cyan node).
     * Verify the animated pulse moves along the curve.
     * Watch new intermediate hop nodes appear along the path as discovery progresses.
  6. Inspect the **Multi-Hop Telemetry Table**:
     * Verify columns: `#` (TTL), `IP Address`, `Hostname / Node`, `Loss %`, `Sent`, `Recv`, `Last RTT`, `Avg RTT`, `Best / Worst`.
- **Expected Results:**
  - Route tracing discovers hops incrementally.
  - Hop 1 corresponds to local default gateway (e.g., `192.168.1.1` or ISP router).
  - Terminal hop matches `1.1.1.1` (`one.one.one.one`).
  - Loss percentage shows `0%` for responding hops (green dot) or `100%` (amber/asterisk) for rate-limiting firewall nodes.
  - Button reverts to "Trace Route" upon completion.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-TRACE-002: Mid-Flight Trace Cancellation & Boundary Hops
- **Objective:** Verify the user can gracefully cancel a traceroute mid-execution and test boundary hop limits.
- **Preconditions:** On IP Trace view.
- **Test Steps:**
  1. Enter destination `8.8.8.8`.
  2. Set **Hops** to `64` (maximum allowed).
  3. Click **Trace Route**.
  4. Wait until hop 3 or 4 appears, then immediately click **Stop Trace**.
  5. Verify the canvas stops probing and the table retains discovered hops without crashing.
  6. Now change **Hops** to `1`.
  7. Click **Trace Route**.
- **Expected Results:**
  - Clicking "Stop Trace" halts ICMP packet transmission immediately.
  - A hop limit of `1` completes after discovering only the local gateway (TTL 1) and exits cleanly.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-MTRACE: Multi-Target MTR & Route Deviation Analysis

#### Test Case MTS-MTRACE-001: Concurrent Multi-Target Path Tracing
- **Objective:** Execute concurrent route tracing to multiple endpoints and detect path deviations.
- **Preconditions:** Navigate to **Multi-Target MTR** (`multitrace`).
- **Test Steps:**
  1. Observe the target management list (defaults include `1.1.1.1`, `8.8.8.8`, `9.9.9.9`).
  2. In the "Add Target" input field, type `github.com` and press <kbd>Enter</kbd> or click `+`.
  3. Verify `github.com` is added as a chip/target card.
  4. Remove one target by clicking the `X` or trash icon on its card.
  5. Click **Run Multi-Trace**.
  6. Observe progress bars updating concurrently across all configured targets.
  7. Switch between target tabs to compare their individual hop paths.
- **Expected Results:**
  - Multi-target engine runs asynchronous concurrent probes without blocking the UI thread.
  - Path deviations counter increments if any hop IP deviates from historical baseline.
  - Each target card displays its completion status, destination RTT, and hop count.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-WATCH: Sentinel Background Watchdog & Health Probing

#### Test Case MTS-WATCH-001: 24/7 Gateway Monitoring & Threshold Alerting
- **Objective:** Verify background daemon probe loop, gateway state transitions, and real-time alert dispatch.
- **Preconditions:** Navigate to **Sentinel Watchdog** (`watchdog`).
- **Test Steps:**
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
- **Expected Results:**
  - Watchdog probes targets continuously without UI frame drops.
  - If a probe exceeds latency threshold, a warning alert item is appended to the alert log with timestamp and severity badge.
  - "Clear Alerts" empties the log cleanly.
  - "Stop Watchdog" terminates background polling; status badge returns to `IDLE / STOPPED`.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-PING: Continuous Ping & Jitter Telemetry Monitor

#### Test Case MTS-PING-001: High-Frequency Telemetry & 60 FPS Sparkline Canvas
- **Objective:** Verify real-time continuous ICMP pinging, canvas sparkline drawing, and RFC 3550 jitter calculation.
- **Preconditions:** Navigate to **Ping Monitor** (`ping`).
- **Test Steps:**
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
- **Expected Results:**
  - No UI freeze or memory accumulation over sustained 200ms polling.
  - Sparkline curve renders without graphic tearing or artifacting.
  - Minimum RTT is always $\le$ Average RTT $\le$ Maximum RTT.
  - Reset history clears the sparkline canvas and resets min/avg/max/jitter counters.
  - Stop Monitor halts ICMP packet transmissions cleanly.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-PING-002: Interval Switching & Unreachable Host Handling
- **Objective:** Test interval modulation (`500ms`, `1000ms`, `2000ms`) and 100% packet loss handling.
- **Preconditions:** On Ping Monitor view.
- **Test Steps:**
  1. Enter an unallocated non-routable address (e.g. `192.0.2.1` TEST-NET-1).
  2. Set interval to `500 ms (High Freq)`.
  3. Click **Start Monitor**.
  4. Observe how timeouts and packet drops are represented:
     * Verify Packet Loss % climbs toward `100%`.
     * Verify dropped ticks are highlighted in rose/amber on the sparkline.
  5. Click **Stop Monitor**.
- **Expected Results:**
  - Application does not crash or hang on socket timeouts.
  - Visual indicator signals `TIMEOUT` or dropped packet cleanly.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-SUBNET: CIDR & VLSM Calculator

#### Test Case MTS-SUBNET-001: IPv4 CIDR Bitwise Calculation & Interactive Slider
- **Objective:** Verify bitwise binary netmask calculation, usable address range, and real-time prefix slider manipulation.
- **Preconditions:** Navigate to **Subnet & VLSM** (`subnet`).
- **Test Steps:**
  1. In the CIDR input field, type `192.168.10.0/24`.
  2. Verify the badges displayed next to the input:
     * Version badge: `IPv4`
     * Class badge: `Class C`
     * Routing badge: `RFC 1918 Private`
  3. Inspect the Metrics Grid:
     * Network Address: `192.168.10.0`
     * Broadcast Address: `192.168.10.255`
     * Netmask: `255.255.255.0`
     * Wildcard Mask: `0.0.0.255`
     * Usable Range: `192.168.10.1` — `192.168.10.254`
     * Total Hosts: `256`
     * Usable Hosts: `254`
  4. Inspect the **Bitwise Binary Netmask Display**:
     * Verify 32 binary bits grouped into 4 octets:
       `11111111 . 11111111 . 11111111 . 00000000`
     * Ensure network bits (1s) and host bits (0s) are visually differentiated by color.
  5. Drag the prefix slider to `/26`.
  6. Verify the CIDR input updates to `192.168.10.0/26`.
  7. Check the updated metrics:
     * Usable Hosts: `62` (Total `64`).
     * Netmask: `255.255.255.192`.
  8. Click the **Copy JSON** icon next to the CIDR input.
  9. Paste clipboard content into a text editor and verify JSON structure.
- **Expected Results:**
  - Calculations are mathematically exact according to RFC 791 / RFC 4632.
  - Slider adjustments update all cards instantly without lag.
  - Copied JSON contains valid fields matching `subnet_calculator_schema.json`.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-SUBNET-002: VLSM Subnet Partitioner
- **Objective:** Test Variable Length Subnet Masking (VLSM) allocation tree generation based on required hosts.
- **Preconditions:** On Subnet view with base network `10.0.0.0/16`.
- **Test Steps:**
  1. Enter base CIDR `10.0.0.0/16`.
  2. Scroll down to the **VLSM Subnet Partitioner** section.
  3. In "Subnet Name", enter `Engineering-VLAN`.
  4. In "Hosts Required", enter `120`.
  5. Click **Add Subnet** (`+`).
  6. Add a second subnet: `Sales-WiFi`, hosts `50`.
  7. Add a third subnet: `P2P-Router-Link`, hosts `2`.
  8. Inspect the generated VLSM table:
     * Verify allocated prefixes:
       - `Engineering-VLAN` $\rightarrow$ `/25` (126 usable hosts, Allocated Range: `10.0.0.1` - `10.0.0.126`).
       - `Sales-WiFi` $\rightarrow$ `/26` (62 usable hosts, Allocated Range: `10.0.0.129` - `10.0.0.190`).
       - `P2P-Router-Link` $\rightarrow$ `/30` (2 usable hosts, Allocated Range: `10.0.0.193` - `10.0.0.194`).
  9. Click the trash icon on `Sales-WiFi` to delete it.
- **Expected Results:**
  - Subnets are sorted in descending order of size to eliminate subnet address overlap.
  - Allocated host count accounts for network ($+1$) and broadcast ($+1$) address overhead.
  - Deleting a subnet recalculates remaining allocations without gaps or collisions.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-PORT: High-Speed Port Scanner & Service Banner Grabbing

#### Test Case MTS-PORT-001: Web Preset Scan (`80, 443, 8080`) & Service Identification
- **Objective:** Verify port scan execution, 20 Hz batching, open port detection, and service identification.
- **Preconditions:** Navigate to **Port Scanner** (`portscan`).
- **Test Steps:**
  1. In the target input field, enter `scanme.nmap.org` (or local test IP `127.0.0.1`).
  2. Under **Port Presets**, click the **Web (80, 443, 8080)** chip.
  3. Verify the Scan Mode is set to `TCP Connect`.
  4. Ensure **Grab Banners** checkbox is checked.
  5. Click the emerald **Start Scan** (`Play` icon) button.
  6. Observe the progress bar animating from 0% to 100%.
  7. Inspect the **Scan Summary Cards**:
     * Open Ports count (e.g. `2` or `3`).
     * Closed Ports count.
     * Filtered Ports count.
     * Scan Duration in milliseconds.
  8. Inspect the **Discovered Ports Table**:
     * Port `80`: Service `http`, Product name, Protocol `TCP`, Latency ms.
     * Port `443`: Service `https`, TLS Info badge.
- **Expected Results:**
  - Port scanner identifies open ports accurately.
  - Open ports are highlighted in emerald with product version and latency.
  - ECharts latency sparkline renders bars corresponding to each discovered open port.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-PORT-002: TLS Certificate Inspector & Port Detail Modal
- **Objective:** Verify TLS certificate parsing (Subject, Issuer, Validity, Cipher, ALPN) on port 443.
- **Preconditions:** Port scan completed with port 443 open.
- **Test Steps:**
  1. In the port scan results table, find the row for Port `443`.
  2. Click on the row or the chevron `>` icon to open the **Port Detail Drawer**.
  3. Inspect the **Service Banner** section:
     * Verify HTTP banner text (e.g., `HTTP/2 200 OK` or `Server: nginx`).
  4. Inspect the **TLS Certificate Details** section:
     * Certificate Subject (e.g., `CN=*.nmap.org` or target domain).
     * Certificate Issuer (e.g., `Let's Encrypt Authority`).
     * Valid Until date (RFC 3339 timestamp).
     * Cipher suite (e.g., `TLS_AES_256_GCM_SHA384`).
     * ALPN negotiation protocol (e.g., `h2` or `http/1.1`).
  5. Close the detail drawer.
- **Expected Results:**
  - TLS cryptographic parameters render clearly in monospace font.
  - Detail drawer closes smoothly without losing scan table state.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-PORT-003: Custom Port Range & Concurrency Slider
- **Objective:** Verify custom port syntax parsing (comma-separated, ranges) and concurrency slider limits.
- **Preconditions:** On Port Scanner view.
- **Test Steps:**
  1. Click the **Custom Range** preset chip.
  2. In the custom ports input, type `21-25, 53, 80, 443, 3306, 8000-8010`.
  3. Drag the **Concurrency** slider from `250` to `500` workers.
  4. Click **Start Scan**.
  5. Verify the scan processes all specified ports and finishes without socket exhaustion errors.
- **Expected Results:**
  - Custom parser correctly computes the distinct set of ports to scan.
  - 500 concurrency handles Tokio async task scheduling cleanly.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-DNS: DNS & Global Propagation Inspector

#### Test Case MTS-DNS-001: Multi-Record Lookup & DNSSEC Cryptographic Validation
- **Objective:** Verify DNS queries across record types (A, AAAA, MX, TXT) and DNSSEC cryptographic trust chain.
- **Preconditions:** Navigate to **DNS Inspector** (`dns`).
- **Test Steps:**
  1. In the domain input, type `cloudflare.com`.
  2. Select record type **A**.
  3. Transport: leave as `UDP_TCP` (or test `DoH` / `DoT`).
  4. Click **Lookup DNS**.
  5. Inspect the **DNSSEC Status Badge**:
     * Verify state displays `SECURE (Validated)` in emerald with `ShieldCheck` icon.
     * Check details: Cryptographic chain-of-trust validated via Authenticated Data (AD) flag.
  6. Inspect the **DNS Answers Table**:
     * Record Name, Type (`A`), TTL (e.g., `300`), and resolved IP values (`104.21.48.12`, etc.).
  7. Change record type to **MX** and click **Lookup DNS**.
  8. Verify mail exchanger priority and hostnames render in the table.
- **Expected Results:**
  - DNS resolution completes in < 100ms.
  - DNSSEC status correctly distinguishes between `SECURE`, `INSECURE` (unsigned domains), and `BOGUS` (tampered/expired signatures).
  - Toast notification appears: *"DNS Inspection Complete — Resolved X records in Y ms"*.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-DNS-002: Global Resolver Propagation Grid (15+ Global Nodes)
- **Objective:** Verify global DNS propagation check across major international resolvers.
- **Preconditions:** DNS query executed for `cloudflare.com`.
- **Test Steps:**
  1. Scroll down to the **Global Propagation Grid** section.
  2. Observe the **Propagation Progress Bar**: displays `100% MATCH` (or partial % if propagating).
  3. Inspect the resolver node cards:
     * Cloudflare Anycast (Frankfurt, Germany `[DE]`)
     * Google Public DNS (Mountain View, USA `[US]`)
     * Quad9 Security (Zurich, Switzerland `[CH]`)
     * OpenDNS Cisco (San Francisco, USA `[US]`)
     * AdGuard DNS (Limassol, Cyprus `[CY]`)
  4. Verify each card shows:
     * Country flag / code.
     * Node response latency in milliseconds.
     * Status pill: green `MATCH` or amber `MISMATCH`.
     * Resolved IP values.
- **Expected Results:**
  - All 15+ nodes display geographical location and query latency.
  - Responsive grid adapts cleanly to window resizing.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-WHOIS: WHOIS & RDAP Registry Inspector

#### Test Case MTS-WHOIS-001: RFC 7480-7484 RDAP Domain & IP Query
- **Objective:** Verify standardized RDAP JSON/REST query for domains and IP ranges.
- **Preconditions:** Navigate to **WHOIS / RDAP** (`whois`).
- **Test Steps:**
  1. In the query bar, click the quick chip for `cloudflare.com`.
  2. Click the bright cyan **Lookup Registry** button.
  3. Observe the loading state: button indicates *"Querying..."*.
  4. Inspect the **Registry Summary Header**:
     * Handle: `NET-1-1-1-0-1` (or domain handle).
     * Object Type: `DOMAIN` or `IPV4`.
     * Network Name: `CLOUDFLARENET`.
     * CIDR Allocation: `1.1.1.0/24`.
     * Status pills: `active`, `clientTransferProhibited`.
  5. Inspect the **Lifecycle Dates Timeline**:
     * Registration Date, Expiration Date, Last Changed Date.
  6. Inspect the **Entities & Contact Cards**:
     * Abuse Department: Organization, Email (`abuse@cloudflare.com`), Phone number, Physical address.
     * Registrar: Name and contact details.
  7. Inspect the **Authoritative Nameservers** list.
  8. Scroll down and click **Toggle Raw RDAP / WHOIS Text**:
     * Verify formatted monospace raw text disclosure block expands with full registry output.
- **Expected Results:**
  - RDAP parser extracts structured entities, abuse contacts, and lifecycle dates without undefined fields.
  - Clicking quick chips automatically fills the input and triggers the query.
  - Raw text toggle collapses and expands with smooth transition.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-LAN: LAN Device Discovery & Unprivileged Sweep

#### Test Case MTS-LAN-001: Local Subnet Sweep & MAC OUI Vendor Classification
- **Objective:** Verify local network sweep, active IP detection, MAC OUI vendor resolution, and device classification.
- **Preconditions:** Navigate to **LAN Scanner** (`lan`).
- **Test Steps:**
  1. Inspect the top control bar:
     * Interface selector dropdown displays active NIC (e.g. `Ethernet` or `Wi-Fi`).
     * Elevation badge: displays `PAL Unprivileged` (or `ROOT` if elevated).
  2. Click the emerald **Start Sweep** (`Play` icon) button.
  3. Observe the progress bar and discovered device counter incrementing.
  4. Inspect the **Discovered Devices Table**:
     * Verify rows contain:
       - **IP Address** with Gateway indicator badge on `192.168.1.1`.
       - **MAC Address** formatted in hex (`6C:4F:89:97:71:C0`).
       - **Vendor Name** resolved via IEEE OUI database (e.g., `Cisco`, `Apple`, `Intel`, `Raspberry Pi`).
       - **Hostname** (e.g., `gateway.lan`, `MacBook-Pro.local`).
       - **Latency** (e.g., `0.85 ms`).
       - **Device Type Badge:** `Network Equipment` (router icon), `Workstation` (laptop icon), `Mobile` (smartphone icon), `IoT` (cpu icon).
  5. Click the **Vendor Filter** chip for `Apple`.
     * Verify only Apple devices are visible in the table.
     * Click `ALL` to clear.
  6. Click the **Type Filter** chip for `IoT`.
     * Verify only IoT devices (e.g. Raspberry Pi, Espressif) remain visible.
     * Click `ALL` to clear.
  7. In the search bar, type `gateway`.
     * Verify table filters to only the gateway row.
  8. On any device row, click the **Copy IP** icon.
     * Verify green checkmark feedback and toast alert: *"Copied to Clipboard"*.
  9. Click the **Ping** quick action button on a device row.
- **Expected Results:**
  - Network sweep runs in unprivileged mode without requiring driver installs (Npcap).
  - MAC addresses accurately map to known hardware vendors.
  - Clicking "Ping" switches view to **Ping Monitor** with the target IP pre-populated.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-CONFIG: Workstation Configuration & Settings

#### Test Case MTS-CONFIG-001: Settings Adjustments & Persistent Preferences
- **Objective:** Verify user preferences, theme persistence, and offline database toggle.
- **Preconditions:** Navigate to **Settings** (`settings`).
- **Test Steps:**
  1. Inspect the **Visual Appearance** section:
     * Toggle the theme button and verify immediate mode switch.
  2. Inspect the **Offline MaxMind GeoLite2 Database** card:
     * Status indicator: `Active (Embedded)`.
     * Database format: `GeoLite2-City.mmdb`.
  3. Change the **Default Ping Interval** dropdown to `500 ms`.
  4. Change the **Default DNS Resolver** to `9.9.9.9 (Quad9)`.
  5. Navigate to **Ping Monitor** and verify the default interval reflects the updated configuration.
- **Expected Results:**
  - Configuration updates persist across tab switches and application reloads.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-REPORT: Diagnostic Reporting & Export Modal

#### Test Case MTS-REPORT-001: Multi-Format Report Generation (HTML, CSV, JSON, PCAP)
- **Objective:** Verify full audit report generation, data integrity, and browser/OS file download.
- **Preconditions:** Run at least one trace or ping session to generate telemetry data.
- **Test Steps:**
  1. In the Title Bar, click the **Export Report** button (download icon).
  2. Verify the **Report Export Dialog** opens as a centered modal with backdrop blur.
  3. In the modal, review the **Report Type** options:
     * `Full Diagnostic Audit`, `Traceroute Only`, `Ping Telemetry`, `Port Scan Audit`, `DNSSEC & Propagation`, `LAN Device Inventory`.
  4. Select **Full Diagnostic Audit**.
  5. Under **Export Format**, click each format card:
     * **HTML Report:** Formatted executive summary with cyber-glassmorphic CSS.
     * **CSV Spreadsheet:** Tabular raw metrics for Excel / Python analysis.
     * **JSON Data Contract:** Conforms to NetPulse Draft-07 schemas.
     * **PCAP Trace:** Raw packet capture format.
  6. Select **JSON** format.
  7. Click **Copy to Clipboard**.
     * Verify toast notification: *"Audit Report copied to clipboard"*.
  8. Select **HTML** format.
  9. Click **Download Report**.
  10. Observe your operating system / browser download prompt:
      * Check downloaded file name: format `netpulse_export_<timestamp>.html`.
  11. Open the downloaded file in a web browser.
- **Expected Results:**
  - Modal blocks background interactions while open; closes via `Esc` key or close button (`X`).
  - File download initiates immediately with valid non-zero byte size.
  - Exported HTML renders cleanly with proper styling and readable telemetry tables.
  - Exported JSON validates as well-formed JSON syntax.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

### Test Suite MTS-CHAOS: Boundary, Stress, Chaos & Error Handling

#### Test Case MTS-CHAOS-001: Malformed Input Vectors & Boundary Stress
- **Objective:** Verify resilient error trapping when human tester provides invalid, extreme, or malicious inputs.
- **Preconditions:** NetPulse open.
- **Test Scenarios to Execute:**

| Test ID | Module | Input Value / Action | Expected Observable Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **CHAOS-01** | IP Trace | `999.999.999.999` | Inline error banner or toast: *"Invalid IPv4/IPv6 target"*. No app crash. | `[ ]` |
| **CHAOS-02** | IP Trace | `http://google.com/path` | Gracefully extracts domain `google.com` or notifies user of invalid hostname syntax. | `[ ]` |
| **CHAOS-03** | IP Trace | Hops: `-5` or `9999` | Input field clamps to min `1` and max `64`. | `[ ]` |
| **CHAOS-04** | Subnet | `192.168.1.1/33` | Boundary error: *"Prefix length must be between 0 and 32"*. | `[ ]` |
| **CHAOS-05** | Subnet | `0.0.0.0/0` (Default route) | Calculates `4,294,967,296` total hosts without integer overflow. | `[ ]` |
| **CHAOS-06** | Subnet | `10.0.0.1/32` (Single host) | Calculates `1` total host, `0` usable host, without negative numbers. | `[ ]` |
| **CHAOS-07** | Port Scan | Ports: `abc, 999999, -1` | Sanitizes input or flags *"Invalid port range"*. No unhandled rejection. | `[ ]` |
| **CHAOS-08** | DNS | Domain: `nonexistent-domain-test-xyz-12345.org` | Displays NXDOMAIN failure message with clean warning toast. | `[ ]` |
| **CHAOS-09** | WHOIS | Query: `!@#$%^&*()` | Displays *"Registry query returned no records"* toast; UI remains interactive. | `[ ]` |
| **CHAOS-10** | Title Bar | Rapid click (20x/sec) on Refresh Gateway | Debounces or disables button while query is inflight; no duplicate requests. | `[ ]` |
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-CHAOS-002: Network Disconnection (Pull the Plug) During Live Ping
- **Objective:** Impersonate real-world cable unplug or Wi-Fi drop while continuous telemetry is active.
- **Preconditions:** Start Continuous Ping on `1.1.1.1` at `200ms` interval.
- **Test Steps:**
  1. While ping sparkline is actively plotting, disconnect Wi-Fi or unplug the Ethernet cable.
  2. Observe the Status Bar NIC indicator: should change from `UP` to `DOWN` or flag link loss.
  3. Observe the Ping Monitor sparkline: should transition to rendering dropped packets / timeouts without crashing.
  4. Packet Loss % should rise towards `100%`.
  5. Re-enable Wi-Fi / reconnect Ethernet cable.
  6. Observe recovery: ping samples should resume recording valid RTTs, and sparkline should recover to green/cyan.
  7. Click **Stop Monitor**.
- **Expected Results:**
  - NetPulse gracefully handles asynchronous socket timeouts and link disconnections.
  - UI recovers automatically upon network restoration.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

#### Test Case MTS-CHAOS-003: High-Frequency Tab Switching Under Active Telemetry
- **Objective:** Verify memory leak resistance and state isolation when switching tabs while background tasks run.
- **Preconditions:** Launch NetPulse.
- **Test Steps:**
  1. Navigate to **Ping Monitor**, start pinging `1.1.1.1` at `200ms`.
  2. Without stopping the ping, immediately click **Port Scanner** in the sidebar.
  3. Start a port scan on `127.0.0.1`.
  4. Rapidly cycle through all 11 sidebar tabs (1 click every 500ms).
  5. Return to **Ping Monitor**.
- **Expected Results:**
  - Ping session continues accumulating samples or gracefully suspends without memory leakage.
  - No React unmounted component state update warnings or crashes in console.
  - Return to Ping Monitor displays uninterrupted sparkline history.
- **Actual Result:** `[ ] Pass  [ ] Fail` | **Notes:** ____________________

---

## 🗺️ 4. End-to-End Persona User Journeys

### User Journey 1: "The Network Incident Response Engineer"
* **Scenario:** An on-call engineer receives an alert of intermittent packet loss to an AWS egress gateway.
* **Journey Path:**
  1. Engineer opens NetPulse $\rightarrow$ checks **Dashboard** for current egress IP, ISP, and ASN.
  2. Clicks **Continuous Ping** $\rightarrow$ targets `8.8.8.8` at `200 ms` to observe real-time jitter and packet loss sparkline.
  3. Confirms 12% packet loss $\rightarrow$ navigates to **IP Trace & MTR** $\rightarrow$ runs a 30-hop trace to isolate the exact router hop dropping packets.
  4. Pinpoints hop 4 (carrier peering point) showing 100% loss.
  5. Navigates to **Sentinel Watchdog** $\rightarrow$ sets up a background watchdog on the gateway with a 50ms latency alert.
  6. Clicks **Export Report** in the title bar $\rightarrow$ downloads an executive HTML report to attach to the carrier NOC incident ticket.
* **Success Criteria:** Entire diagnostic workflow completed in under 3 minutes without command-line tools.

---

### User Journey 2: "The Cybersecurity Penetration Analyst"
* **Scenario:** An ethical hacker performs external reconnaissance on a target infrastructure domain.
* **Journey Path:**
  1. Opens **DNS Inspector** $\rightarrow$ queries target domain for `A`, `MX`, `TXT`, and `CAA` records; checks DNSSEC validity.
  2. Observes nameservers $\rightarrow$ navigates to **WHOIS / RDAP** $\rightarrow$ inspects registrant handle, abuse email, and IP CIDR allocation.
  3. Copies target IP $\rightarrow$ navigates to **Port Scanner** $\rightarrow$ selects `Top 100` ports preset with `Grab Banners` enabled.
  4. Reviews discovered open services $\rightarrow$ inspects Port 443 TLS certificate details (Cipher, Issuer, Subject, Expiry).
  5. Navigates to **Report Export** $\rightarrow$ exports full audit telemetry as JSON for ingestion into SIEM / vulnerability tools.
* **Success Criteria:** Full reconnaissance cycle accomplished with zero elevated driver requirements.

---

### User Journey 3: "The System Administrator LAN Audit"
* **Scenario:** A sysadmin walks into a branch office and needs an immediate inventory of connected LAN equipment.
* **Journey Path:**
  1. Opens **LAN Scanner** $\rightarrow$ checks interface binding (`Ethernet 192.168.1.0/24`).
  2. Clicks **Start Sweep** $\rightarrow$ discovers 18 active devices in 4 seconds.
  3. Filters by device type `IoT` $\rightarrow$ identifies 2 unauthorized microcontrollers (Espressif chipsets).
  4. Clicks **Port Scan** quick action on the unauthorized IP $\rightarrow$ checks for exposed Telnet (23) or HTTP (80) interfaces.
  5. Copies MAC address $\rightarrow$ exports LAN inventory to CSV for switch port shutdown.
* **Success Criteria:** Instant local visibility without third-party tools like Wireshark or Nmap.

---

## 🐞 5. Defect Logging & Bug Reporting Protocol

When a test step fails during manual execution, log the defect using the standardized template below:

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

---

## 📊 6. Human Tester Execution Log & Sign-Off Sheet

| Suite ID | Total Cases | Passed | Failed | Blocked | Tester Initials | Execution Date | Sign-off Verdict |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **MTS-SHELL** | 3 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-DASH** | 2 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-TRACE** | 2 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-MTRACE**| 1 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-WATCH** | 1 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-PING** | 2 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-SUBNET**| 2 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-PORT** | 3 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-DNS** | 2 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-WHOIS** | 1 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-LAN** | 1 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-CONFIG**| 1 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-REPORT**| 1 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **MTS-CHAOS** | 3 | ___ | ___ | ___ | ________ | ____-__-__ | `[ ] PASS [ ] FAIL` |
| **TOTAL** | **25** | ___ | ___ | ___ | **LEAD QA** | **2026-11-07** | **STATUS: READY** |

---
*NetPulse Test Suite Specification — Maintained by the Quality Engineering & Systems Architecture Team.*
