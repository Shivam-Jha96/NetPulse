# Task Assignment: Milestone M3 Test Execution (Config, Export, Chaos Scenarios & User Journeys)

- Role: teamwork_worker
- Working Directory: d:\Dev\repos\NetPulse\.agents\teamwork\worker_m3
- Authoritative User Request: d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md
- Project Scope Document: d:\Dev\repos\NetPulse\.agents\teamwork\orchestrator_1\PROJECT.md
- Specification Document: d:\Dev\repos\NetPulse\docs\manual_testing_scripts_e2e.md
- Spec Miner Extraction: d:\Dev\repos\NetPulse\.agents\teamwork\spec_miner_survey_1\handoff.md
- Established Test Driver: `tests/e2e/cdp_driver.js`
- Target Executable: `src-tauri/target/release/netpulse.exe`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Author and execute `tests/e2e/run_m3_suites.js` leveraging `tests/e2e/cdp_driver.js` against the live native desktop binary `src-tauri/target/release/netpulse.exe`.

Milestone M3 covers:
1. `MTS-CONFIG-001`: Workstation Configuration & Preference Persistence
   - Update theme, default ping interval (500ms), default DNS (9.9.9.9), verify persistent storage in localStorage / vault.
2. `MTS-REPORT-001`: Multi-Format Diagnostic Reporting Export
   - Open Export Report Modal, verify format selections (HTML, CSV, JSON, PCAP), trigger export, verify exported files.
3. `MTS-CHAOS-001`: Input Vector Trapping & Fuzzing (All 10 granular vectors CHAOS-01 through CHAOS-10):
   - CHAOS-01: `999.999.999.999` (Invalid IP target error banner)
   - CHAOS-02: `http://google.com/path` (URL extraction / hostname syntax handling)
   - CHAOS-03: Hops `-5` or `9999` (Hop boundary clamping between 1 and 64)
   - CHAOS-04: `192.168.1.1/33` (Subnet boundary mask error: prefix must be between 0 and 32)
   - CHAOS-05: `0.0.0.0/0` (Default route 4,294,967,296 total hosts without arithmetic overflow)
   - CHAOS-06: `10.0.0.1/32` (Single host: 1 total host, 0 usable hosts without underflow)
   - CHAOS-07: Ports `abc, 999999, -1` (Port string sanitization, reject >65535 and non-numeric)
   - CHAOS-08: `nonexistent-domain-chaos-test-xyz123.com` (NXDOMAIN graceful error handling)
   - CHAOS-09: WHOIS target `@#$%^&*()` (Symbol query rejection / graceful error handling)
   - CHAOS-10: Rapid button clicks (Debounce guard, prevent duplicate concurrent requests)
4. `MTS-CHAOS-002`: Hardware Network Disconnection Stress
   - "Pull the plug" / offline link drop test during active 200ms ping, status bar NIC drops to DOWN, timeout ticks plotted, auto-recovery on reconnect.
5. `MTS-CHAOS-003`: High-Frequency Tab Switching Stress Under Active Telemetry
   - Concurrent active ping + active port scan + rapid 500ms tab cycling across all 11 modules, zero unmount crash, zero memory leak, intact sparkline history.
6. 3 Persona End-to-End User Journeys:
   - Journey 1: Incident Response Engineer (Dashboard egress -> Trace 1.1.1.1 -> Ping -> Export report)
   - Journey 2: Penetration Analyst (Port Scan scanme.nmap.org -> Monospace TLS Drawer -> WHOIS RDAP -> DNS propagation)
   - Journey 3: System Administrator LAN Audit (LAN Discovery sweep -> Subnet VLSM allocation -> Watchdog gateway monitor)

## Deliverables
1. Script: `tests/e2e/run_m3_suites.js`
2. Execution against `src-tauri/target/release/netpulse.exe`
3. Multi-modal observable evidence:
   - Screenshots in `tests/e2e/artifacts/screenshots/`
   - Telemetry JSON dumps in `tests/e2e/artifacts/telemetry/`
   - Exported report files in `tests/e2e/artifacts/reports/`
   - Console logs
4. Comprehensive handoff report in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m3\handoff.md` following the 5-component handoff protocol.


## 2026-11-07T18:37:52Z
You are worker_m3, a teamwork_worker agent.
Your working directory is d:\Dev\repos\NetPulse\.agents\teamwork\worker_m3.
You MUST read the authoritative user request at d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md and your task assignment at d:\Dev\repos\NetPulse\.agents\teamwork\worker_m3\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope: Milestone M3 Test Execution (Config, Export, Chaos Scenarios & User Journeys)
Leverage `tests/e2e/cdp_driver.js` to author and execute `tests/e2e/run_m3_suites.js` against the live native desktop binary `src-tauri/target/release/netpulse.exe`.
Execute:
1. MTS-CONFIG-001 (Theme, default ping 500ms, default DNS 9.9.9.9, persistence)
2. MTS-REPORT-001 (Export modal, HTML, CSV, JSON, binary libpcap 2.4 PCAP download)
3. MTS-CHAOS-001 (All 10 granular vectors CHAOS-01 through CHAOS-10: IP validation, URL handling, hop clamping, /33 prefix, /0 default route 4.29B hosts, /32 single host, port strings, NXDOMAIN, symbol WHOIS, debounce)
4. MTS-CHAOS-002 (Network disconnection stress during active 200ms ping, NIC DOWN, timeout ticks, recovery)
5. MTS-CHAOS-003 (High-frequency tab switching stress across all 11 modules under active ping & port scan)
6. 3 End-to-End Persona User Journeys:
   - Journey 1: Incident Response Engineer
   - Journey 2: Penetration Analyst
   - Journey 3: System Administrator LAN Audit

Capture observable evidence:
- Screenshots in `tests/e2e/artifacts/screenshots/`
- Telemetry JSON in `tests/e2e/artifacts/telemetry/`
- Exported reports (HTML, CSV, JSON, PCAP) in `tests/e2e/artifacts/reports/`
- Console output

Deliver your complete execution report to `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m3\handoff.md`.
Follow the Handoff Protocol and send a completion message back with your report path.
