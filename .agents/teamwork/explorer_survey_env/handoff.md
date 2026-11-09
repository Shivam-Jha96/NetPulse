# Environment Survey & Test Execution Mechanism Handoff Report

**Document:** `handoff.md`  
**Agent:** `explorer_survey_env` (`teamwork_explorer`)  
**Date:** 2026-11-07T11:50:00Z  
**Authoritative User Request:** `d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md`  
**Target Build:** `d:\Dev\repos\NetPulse\src-tauri\target\release\netpulse.exe` (v1.0.0-GA, 17,054,208 bytes)  
**Test Specification:** `docs/manual_testing_scripts_e2e.md` (14 test suites, 25 test cases, edge cases, chaos scenarios)  

---

## 1. Observation

### 1.1 Operating System & Hardware Runtime Environment
Direct query via PowerShell `Get-CimInstance Win32_OperatingSystem`:
```
Caption        : Microsoft Windows 11 Home Single Language
Version        : 10.0.26300
BuildNumber    : 26300
OSArchitecture : 64-bit
```
Node runtime version: `v26.7.0` (with native `WebSocket` and fetch support).  
Rust toolchain: `rustc 1.83+` / `cargo` compiling target `x86_64-pc-windows-msvc`.

### 1.2 Privilege Boundary Verification (Requirement R4)
Inspection via `whoami /groups`, `whoami /priv`, and .NET WindowsPrincipal:
```
Mandatory Label\Medium Mandatory Level    Label            S-1-16-8192
BUILTIN\Administrators                    Alias            S-1-5-32-544 (Group used for deny only)
BUILTIN\Users                             Alias            S-1-5-32-545 (Enabled group)
IsAdmin: False
```
The execution environment is confirmed to run strictly within **Medium Mandatory Level (Standard Non-Administrator User)** with UAC administrator token filtered (deny-only). No elevated privileges exist.

### 1.3 Active Network Interfaces & Live Connectivity Probing
Direct query via `Get-NetAdapter` and `Get-NetIPAddress`:
- **Active Adapter**: `Wi-Fi` (Realtek 8852CE WiFi 6E PCI-E NIC), Status: `Up`, LinkSpeed: `1.2 Gbps`.
- **IPv4 Address**: `172.20.10.4`, PrefixLength `28` (Subnet `172.20.10.0/28`, Gateway `172.20.10.1`).
- **Loopback**: `127.0.0.1/8` (`Loopback Pseudo-Interface 1`).
- **Bluetooth**: Disconnected.

Direct network connectivity probes under unprivileged execution:
1. **DNS Resolution**:
   - `Resolve-DnsName -Name google.com -Type A` returned IP `142.251.221.206`.
   - `Resolve-DnsName -Name 1.1.1.1 -Type PTR` returned `one.one.one.one`.
2. **ICMP Ping**:
   - `Test-Connection -ComputerName 1.1.1.1 -Count 2` returned RTT `27ms` and `68ms` (`Status: Success`).
   - `Test-Connection -ComputerName 8.8.8.8 -Count 2` returned RTT `28ms` and `91ms` (`Status: Success`).
3. **HTTP / HTTPS Egress**:
   - `Invoke-WebRequest -Uri 'https://dns.google/resolve?name=example.com'` returned `StatusCode: 200`, length `297 bytes`.
4. **WHOIS / RDAP Registry Query**:
   - `Invoke-WebRequest -Uri 'https://rdap.org/domain/example.com'` returned `StatusCode: 200`, length `2440 bytes`.
5. **TCP Connect Scan**:
   - `Test-NetConnection -ComputerName 1.1.1.1 -Port 443` -> `TcpTestSucceeded: True`.
   - `Test-NetConnection -ComputerName 1.1.1.1 -Port 80` -> `TcpTestSucceeded: True`.
   - `Test-NetConnection -ComputerName 1.1.1.1 -Port 81` -> `TcpTestSucceeded: False` (filtered/rejected).

### 1.4 Codebase Analysis: Privilege Architecture
Direct inspection of the Rust core crates in `src-tauri`:

1. **ICMP Probing & Traceroute (`src-tauri/crates/iptracer-net/src/windows.rs`)**:
   - Lines 47-61: Links `iphlpapi.dll` and imports `IcmpCreateFile`, `IcmpCloseHandle`, `IcmpSendEcho`.
   - Lines 73-176: Implements `PlatformSocketProvider::send_icmp_probe` using `IcmpSendEcho`.
   - Lines 110-116: Supports setting IP TTL (`options.ttl = probe.ttl`) and DF-Bit (`probe.df_bit -> 0x02 IP_FLAG_DF`) via `IpOptionInformation`.
   - Lines 153-156: Identifies `IP_TTL_EXPIRED_TRANSIT` (11013) for incremental hop discovery and `IP_SUCCESS` (0) for destination arrival.
   - *Crucial Fact*: Win32 `IcmpSendEcho` is unprivileged by design in Windows. It does NOT require raw socket permissions (`SOCK_RAW`) or Administrator elevation.

2. **Port Scanning (`src-tauri/crates/iptracer-core/src/portscan.rs`)**:
   - Lines 326-335: Implements TCP connect scan via `tokio::time::timeout(timeout_dur, TcpStream::connect(addr))`.
   - Uses standard Winsock TCP sockets (`SOCK_STREAM`). Zero elevated driver or raw socket requirement.
   - Lines 348-355: Banner grabbing and TLS certificate extraction operate over unprivileged TCP connections.

3. **LAN Device Discovery (`src-tauri/crates/iptracer-core/src/lan.rs`)**:
   - Lines 202-247: Reads active neighbors from OS ARP table via standard `arp -a` process execution.
   - Lines 286-317: Emits bounded unprivileged TCP connect bursts (ports 80, 443, 135, 445, 5353, 22) across the `/24` subnet. This primes the Windows kernel ARP table without raw Ethernet frame injection.
   - Lines 48-167: Resolves MAC prefixes to vendors (Cisco, Apple, Intel, Espressif, etc.) using an in-memory IEEE OUI database.

4. **Elevation Status & Graceful Degradation (`src-tauri/crates/iptracer-ui/src/commands.rs`)**:
   - Lines 415-426: `check_elevation_status` checks `state.helper_client.is_connected().await`. When the optional elevated daemon is not active, `is_elevated` returns `false`, causing the UI to display `PAL Unprivileged`.
   - All diagnostic modules operate in full unprivileged mode.

5. **Existing Automated Test Suite (`npm run test:spec` & `cargo test`)**:
   - `npm run test:spec`: 28 of 28 tests passing (Tier 1 to Tier 4).
   - `cargo test --workspace`: 52 unit tests passing across all crates (`iptracer_core`: 37, `iptracer_daemon`: 4, `iptracer_geo`: 8, `iptracer_net`: 1, `iptracer_ui`: 2).

### 1.5 Native Desktop Runtime (`netpulse.exe`) Empirical Execution & Automation Proof
- **Target File**: `d:\Dev\repos\NetPulse\src-tauri\target\release\netpulse.exe` (17,054,208 bytes, created 2026-11-06).
- **Execution Test**:
  - Setting `$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9222"` prior to launching `netpulse.exe` instructs the underlying Microsoft Edge WebView2 runtime to open the Chrome DevTools Protocol (CDP) port at `127.0.0.1:9222`.
  - Process launch: `Start-Process -FilePath "src-tauri\target\release\netpulse.exe"` spawns `netpulse.exe` (PID 4812) and child `msedgewebview2.exe` (PID 3352) running smoothly with 42MB working set.
  - Endpoint `http://localhost:9222/json` responds with:
    ```json
    [ {
       "description": "",
       "faviconUrl": "http://tauri.localhost/assets/netpulse-icon-DA6cY7s0.svg",
       "id": "42753ED864CE8A193F83F2F61ADF8D91",
       "title": "NetPulse - Network Diagnostics Workstation",
       "type": "page",
       "url": "http://tauri.localhost/",
       "webSocketDebuggerUrl": "ws://localhost:9222/devtools/page/42753ED864CE8A193F83F2F61ADF8D91"
    } ]
    ```
  - Empirical CDP probe via Node.js native `WebSocket`:
    - Evaluated expression: `document.title` -> `"NetPulse — Network Diagnostics Workstation"`.
    - Evaluated expression: `typeof window.__TAURI_INTERNALS__ !== 'undefined'` -> `true`.
    - Captured full page screenshot via `Page.captureScreenshot`: 246,492 bytes PNG data.
    - Process terminated cleanly with zero residual locks.

---

## 2. Logic Chain

1. **Standard User Privilege Feasibility (Requirement R4)**:
   - *Observation*: Current token is Medium Integrity (`S-1-16-8192`), `IsAdmin: False`.
   - *Observation*: `src-tauri/crates/iptracer-net/src/windows.rs` utilizes Win32 `IcmpSendEcho` via `iphlpapi.dll` which operates without admin rights; port scanning uses `tokio::net::TcpStream::connect`; LAN sweeping uses `arp -a` and connect bursts.
   - *Observation*: Live network probes (ICMP ping to 1.1.1.1, DNS resolution, HTTPS, RDAP) succeed under this exact token.
   - *Deduction*: NetPulse requires no administrator privileges or external driver installs (Npcap/WinPcap) to execute its diagnostic capabilities. Requirement R4 is completely satisfied.

2. **Native Runtime Test Execution Capability (Requirement R1)**:
   - *Observation*: `netpulse.exe` is a release binary embedding the complete React 19 frontend and Tauri v2 Rust backend.
   - *Observation*: Launching `netpulse.exe` with `WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS="--remote-debugging-port=9222"` successfully exposes CDP.
   - *Observation*: Node.js v26.7.0 connects via native WebSocket to `ws://localhost:9222`, allowing bidirectional DOM manipulation, event listening, screenshot capturing, and direct Tauri IPC invocation (`window.__TAURI_INTERNALS__.invoke`).
   - *Deduction*: A Node.js CDP-driven E2E test harness can execute all 14 test suites and 25 test cases directly against the native `.exe` build in real time, validating both the graphical user interface and the underlying Rust IPC engine.

3. **100% Coverage of Edge Cases, Chaos, and Stress Tests (Requirement R2)**:
   - *Observation*: `docs/manual_testing_scripts_e2e.md` defines 10 specific chaos scenarios (`CHAOS-01` to `CHAOS-10`: invalid IPs, URLs, hop bounds, prefix bounds, port syntax, NXDOMAIN, debouncing), plus network disconnection (`CHAOS-02`), and high-frequency tab switching (`CHAOS-03`).
   - *Observation*: The CDP harness can programmatically inject these inputs into the UI input fields or call the Tauri IPC endpoints with malformed payloads, verify error banners/toasts, measure debounce behavior, and confirm application stability without process crashes.
   - *Deduction*: Requirement R2 can be achieved with 100% coverage and automated repeatability.

4. **Observable Evidence Capture (Requirement R3)**:
   - *Observation*: The CDP protocol exposes `Page.captureScreenshot`, `Runtime.consoleAPICalled`, `Network.requestWillBeSent`, and DOM inspection.
   - *Observation*: The test process can monitor OS process metrics (`Get-Process netpulse | Select WorkingSet64, CPU`), capture stdout/stderr redirection, record IPC event streams, and save downloaded export artifacts (`.html`, `.json`, `.csv`, `.pcap`).
   - *Deduction*: Every test case outcome (PASS, FAIL, BLOCKED) can be backed by empirical evidence (timestamped logs, screenshots, JSON payloads, process telemetry) instead of unverified self-assessment.

---

## 3. Evaluation of Test Execution Mechanisms & Tradeoffs

We evaluated three potential execution mechanisms against the build specification:

| Evaluation Dimension | Mechanism 1: Pure OS GUI Automation (WinAppDriver / FlaUI / PyAutoGUI) | Mechanism 2: Native Rust Crate Test Harness (`cargo test`) | Mechanism 3: Tauri WebView2 CDP Native Desktop Harness (Recommended) |
| :--- | :--- | :--- | :--- |
| **Target Under Test** | Running `netpulse.exe` | Rust backend crates (`iptracer_*`) | Running `netpulse.exe` (Native Binary) |
| **Coverage of UI Requirements (Themes, Sparklines, Modals)** | Moderate (relies on OS accessibility tree, cannot easily inspect Canvas 2D / WebGL) | Zero (tests only backend Rust code, no UI rendering) | **100% Full Fidelity** (inspects DOM, Canvas, CSS computed styles, renders sparklines) |
| **Coverage of IPC Contracts & Event Streams** | Low (indirect through UI clicks only) | High (direct function calls) | **100% Direct** (can listen to `listen()` events and call `invoke()`) |
| **Privilege Requirement** | Standard User | Standard User | **Standard User (Medium Integrity)** |
| **Execution Speed** | Slow (~15-25 mins, UI sleep delays) | Extremely Fast (< 10 seconds) | **Fast & Deterministic (~2-3 mins)** |
| **Flakiness / Brittle Selectors** | High (screen resolution & window focus dependent) | None | **Low** (exact CSS selectors and DOM attributes) |
| **Observable Evidence Quality** | OS screenshots only | Console logs only | **Multi-Modal**: PNG screenshots, DOM trees, console logs, process memory/CPU, exported files |
| **Setup & Dependencies** | Heavy (requires Windows Developer Mode, WinAppDriver service) | Requires Rust compiler | **Zero Extra Installs** (uses built-in Node 26 + WebView2 CDP) |

### Tradeoff Assessment & Decision
- **Mechanism 1 (OS GUI Automation)** is brittle, slow, and cannot inspect high-frequency canvas drawing (sparklines) or listen to Tauri event buses.
- **Mechanism 2 (Pure Rust Crate Testing)** is already operational (52/52 tests pass), but it does not execute against `netpulse.exe` nor test the UI layer.
- **Mechanism 3 (Tauri WebView2 CDP Native Desktop Harness)** is the **optimal, high-fidelity solution**. It launches the real release binary `src-tauri/target/release/netpulse.exe`, attaches via CDP over WebSocket, drives the real user interface, inspects live data contracts, and records irrefutable proof.

---

## 4. Proposed Concrete Execution Plan for all 14 Test Suites & 25 Test Cases

The recommended execution harness is structured as an automated runner (`tests/e2e_desktop/harness.js`) executed via `node tests/e2e_desktop/harness.js`:

### 4.1 Test Suite & Case Execution Matrix

| Suite ID | Case ID | Name / Objective | Execution Mechanism & Verifiable Evidence |
| :--- | :--- | :--- | :--- |
| **MTS-SHELL** | `SHELL-001` | Frameless Window Controls & Drag Region | Inspect `header[data-tauri-drag-region]`, verify logo text `NETPULSE`, verify `v1.0.0-GA` badge, test minimize/maximize state via CDP window methods. Capture screenshot. |
| **MTS-SHELL** | `SHELL-002` | Cyber-Dark vs Tactical Light Theme Toggle | Click theme toggle button, assert root element class changes (`dark` / light), inspect computed CSS background (`#0b0f19` vs `#f8fafc`) and text color contrast. Capture screenshots of both themes. |
| **MTS-SHELL** | `SHELL-003` | 11 Sidebar Nav Links & Persistent Status Bar | Sequentially click all 11 sidebar items (`dashboard`, `trace`, `multitrace`, `watchdog`, `ping`, `subnet`, `portscan`, `dns`, `whois`, `lan`, `settings`). Assert active link glow (`bg-[#00f0ff]/10`), verify status bar pinned at bottom with NIC, Egress, GeoLite2, IPC indicators. |
| **MTS-DASH** | `DASH-001` | Automatic Egress IP Discovery & Banner | Verify Egress banner displays public IP, routability badge (`PUBLIC ROUTABLE`), provider (`OFFLINE_MAXMIND` / `IPAPI`), and 4 metric cards (Coordinates, ASN, Threat Clean, Latency). |
| **MTS-DASH** | `DASH-002` | Manual Refresh Gateway & Cascade Fallback | Click "Refresh Gateway", assert loading spinner icon rotation, verify 4 cascade providers (GeoLite2, ipapi, ipinfo, ipify), click "Visual Traceroute" quick action to navigate to trace view. |
| **MTS-TRACE** | `TRACE-001` | Standard Route Trace (`1.1.1.1`) | Set target `1.1.1.1`, hops `30`, click "Trace Route", verify button changes to "Stop Trace", listen to `traceroute:hop` events, verify hop 1 is gateway and terminal hop is `1.1.1.1`. Verify canvas geodesic curve. |
| **MTS-TRACE** | `TRACE-002` | Mid-Flight Trace Cancellation & Boundary Hops | Set target `8.8.8.8`, hops `64`, click "Trace Route", click "Stop Trace" after 3 hops, assert transmission halts cleanly. Set hops `1`, trace, assert completes at gateway hop. |
| **MTS-MTRACE**| `MTRACE-001`| Concurrent Multi-Target Path Tracing | Add target `github.com`, click "Run Multi-Trace", monitor concurrent progress across `1.1.1.1`, `8.8.8.8`, `9.9.9.9`, and `github.com`. Verify completion status, RTT, and route deviation counter. |
| **MTS-WATCH** | `WATCH-001` | Sentinel 24/7 Gateway Monitoring & Alerts | Click "Start Watchdog", verify `MONITORING ACTIVE` badge, verify probes to Gateway, Primary DNS, Public Anchor. Set latency threshold `50ms`, verify alert generation, test "Clear Alerts" and "Stop Watchdog". |
| **MTS-PING** | `PING-001` | Continuous Ping & 60 FPS Sparkline Canvas | Target `1.1.1.1`, interval `200ms`, enable DF-Bit, click "Start Monitor". Verify canvas context updates, inspect 6 metric cards (Current, Min, Avg, Max, Jitter, Loss), test "Reset History" and "Stop Monitor". |
| **MTS-PING** | `PING-002` | Interval Modulation & Timeout Handling | Target unroutable IP `192.0.2.1`, interval `500ms`, start monitor. Verify loss climbs to 100%, assert timeouts flagged without crash. Stop monitor. |
| **MTS-SUBNET**| `SUBNET-001`| IPv4 CIDR Bitwise Calculation & Slider | Input `192.168.10.0/24`, verify metrics (Netmask `255.255.255.0`, Total 256, Usable 254), verify 32 binary bits display. Drag slider to `/26`, verify update (Usable 62, Netmask `255.255.255.192`). Test copy JSON. |
| **MTS-SUBNET**| `SUBNET-002`| VLSM Subnet Partitioner | Base `10.0.0.0/16`, add `Engineering-VLAN` (120 hosts -> /25), `Sales-WiFi` (50 hosts -> /26), `P2P-Router-Link` (2 hosts -> /30). Assert descending sort, non-overlapping allocations. Test subnet deletion. |
| **MTS-PORT** | `PORT-001` | Web Preset Scan (`80, 443, 8080`) | Target `1.1.1.1`, select "Web" preset, mode `TCP Connect`, click "Start Scan". Verify progress animation, open ports 80/443 detected, service names `http`/`https` resolved with latency. |
| **MTS-PORT** | `PORT-002` | TLS Certificate Inspector & Port Detail | Click Port 443 row, assert detail drawer opens, verify TLS Subject, Issuer, Expiry date, Cipher suite, ALPN (`h2`). Close drawer. |
| **MTS-PORT** | `PORT-003` | Custom Port Range & Concurrency Slider | Custom range `21-25, 53, 80, 443, 8000-8005`, concurrency slider `500`, execute scan, verify parsed port count and Tokio task scheduling without socket exhaustion. |
| **MTS-DNS** | `DNS-001` | Multi-Record Lookup & DNSSEC Validation | Domain `cloudflare.com`, record `A`, lookup DNS. Assert DNSSEC `SECURE (Validated)`, answers table populated. Change to `MX`, lookup, verify mail exchangers. |
| **MTS-DNS** | `DNS-002` | Global Resolver Propagation Grid (15+ Nodes)| Verify 15+ international nodes (Cloudflare DE, Google US, Quad9 CH, OpenDNS US, AdGuard CY, etc.) display latency, status pill (`MATCH`), and resolved IPs. |
| **MTS-WHOIS** | `WHOIS-001`| RFC 7480 RDAP Domain & IP Query | Query `cloudflare.com`, click "Lookup Registry". Verify handle, ASN, CIDR `1.1.1.0/24`, lifecycle dates, abuse email (`abuse@cloudflare.com`), authoritative nameservers, raw text disclosure toggle. |
| **MTS-LAN** | `LAN-001` | Local Subnet Sweep & MAC OUI Classification| Click "Start Sweep", assert unprivileged sweep runs, devices discovered, verify MAC addresses, vendor mapping (Apple, Intel, Cisco, etc.), test filtering by Vendor and Device Type (`IoT`), test Copy IP. |
| **MTS-CONFIG**| `CONFIG-001`| Settings Adjustments & Preferences | Navigate to Settings, verify GeoLite2 status (`Active Embedded`), change default ping interval to `500ms`, default DNS to `9.9.9.9`, navigate to Ping Monitor, verify updated default interval. |
| **MTS-REPORT**| `REPORT-001`| Multi-Format Report Generation (HTML, CSV, JSON, PCAP) | Click "Export Report" in title bar, modal opens, select "Full Diagnostic Audit", verify format cards (HTML, CSV, JSON, PCAP). Test "Copy JSON", test "Download HTML", verify downloaded file integrity. |
| **MTS-CHAOS** | `CHAOS-001`| 10 Malformed Inputs & Boundary Scenarios | Execute all 10 boundary tests: `CHAOS-01` (`999.999.999.999`), `CHAOS-02` (`http://google.com`), `CHAOS-03` (Hops `-5`/`9999`), `CHAOS-04` (`/33`), `CHAOS-05` (`0.0.0.0/0`), `CHAOS-06` (`/32`), `CHAOS-07` (Ports `abc`), `CHAOS-08` (NXDOMAIN), `CHAOS-09` (WHOIS `!@#$`), `CHAOS-10` (Rapid refresh click debouncing). |
| **MTS-CHAOS** | `CHAOS-02` | Network Disconnection / Unplug Simulation | Start continuous ping, simulate offline socket state / unroutable gateway, verify UI handles timeouts gracefully, packet loss rises to 100%, recovers cleanly when restored. |
| **MTS-CHAOS** | `CHAOS-03` | Rapid Tab Switching Under Active Telemetry | Start continuous ping + port scan, rapidly switch between all 11 tabs (1 click/500ms), return to Ping, verify zero state corruption or console exceptions. |

### 4.2 Observable Evidence Capture Plan
For each test case executed by the harness, the runner automatically collects:
1. **Visual Evidence**: Full-page high-resolution PNG screenshot saved to `test-results/screenshots/<case-id>.png`.
2. **DOM Snapshot**: Serialized HTML snapshot of the component under test saved to `test-results/dom/<case-id>.html`.
3. **IPC Telemetry**: Direct input arguments and returned JSON responses saved to `test-results/ipc/<case-id>.json`.
4. **Console Log Stream**: Any `console.log`, `console.warn`, or `console.error` events logged during test execution.
5. **Process Behavior**: OS process PID, CPU time, and memory working set before, during, and after execution.
6. **Master Test Deliverable**: A comprehensive markdown runsheet (`test-results/SUMMARY_RUNSHEET.md`) and JSON summary with evaluated status (`PASS`, `FAIL`, `BLOCKED`) for all 25 test cases + edge cases + chaos scenarios.

---

## 5. Caveats

1. **Active Live Internet Requirement**: Certain test suites (`MTS-DASH`, `MTS-TRACE`, `MTS-DNS`, `MTS-WHOIS`, `MTS-PORT`) require active live network connectivity to public targets (`1.1.1.1`, `8.8.8.8`, `cloudflare.com`). Our survey confirmed live internet is active and reachable.
2. **Elevated Helper Daemon (Optional Component)**: The optional `iptracer_helper.exe` daemon (which provides raw SYN packet crafting) is deliberately not run in order to strictly uphold Requirement R4 (Standard User Privileges). NetPulse's built-in fallback engine seamlessly handles all operations via Win32 unprivileged `IcmpSendEcho` and TCP connect scanning.
3. **WebView2 Single Instance Lock**: Only one instance of `netpulse.exe` can use the default User Data Directory (`com.netpulse.desktop\EBWebView`) simultaneously. The test harness must cleanly terminate any running instance before launching a test session to avoid `0x800700AA (ERROR_BUSY)`.

---

## 6. Conclusion

- **Environment & Privileges**: The runtime environment is Microsoft Windows 11 (Build 26300), running as a standard unprivileged user (Medium Integrity). Standard user privileges are 100% sufficient for all 14 test suites, utilizing Win32 `IcmpSendEcho` (`iphlpapi.dll`) and unprivileged TCP sockets. Zero elevated drivers (Npcap) are required.
- **Execution Mechanism**: Mechanism 3 (Tauri WebView2 CDP Native Desktop Harness) is feasible, proven, and superior to pure GUI or pure backend testing. It executes against the actual release binary `src-tauri/target/release/netpulse.exe`, validates both UI interactions and Rust IPC contracts, and captures complete observable evidence (screenshots, DOM trees, JSON payloads, process telemetry).
- **Readiness**: The environment and execution path are fully surveyed and ready for test orchestration to achieve 100% test coverage against the build specification.

---

## 7. Verification Method

To independently reproduce and verify this investigation:
1. **Verify Standard User Privileges**:
   ```powershell
   whoami /groups | Select-String "Mandatory Label|Admin"
   # Confirms Medium Mandatory Level and deny-only admin alias.
   ```
2. **Verify Live Network Connectivity**:
   ```powershell
   Test-Connection -ComputerName 1.1.1.1 -Count 2
   Resolve-DnsName -Name google.com -Type A
   Invoke-WebRequest -Uri 'https://rdap.org/domain/example.com' -UseBasicParsing
   ```
3. **Verify Rust Workspace & Specification Tests**:
   ```powershell
   npm run test:spec
   cargo test --workspace --manifest-path src-tauri/Cargo.toml
   # 28/28 spec tests pass; 52/52 Rust crate tests pass.
   ```
4. **Verify CDP Native Desktop Automation on `netpulse.exe`**:
   ```powershell
   $env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9222"
   $proc = Start-Process -FilePath "src-tauri\target\release\netpulse.exe" -PassThru
   Start-Sleep -Seconds 3
   Invoke-RestMethod -Uri "http://localhost:9222/json"
   # Returns the WebView2 target with webSocketDebuggerUrl.
   Stop-Process -Id $proc.Id -Force
   ```
