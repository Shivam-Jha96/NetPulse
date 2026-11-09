# Task Assignment: Milestone M1 Test Execution (Core Workstation Suites)

- Role: teamwork_worker
- Working Directory: d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1
- Authoritative User Request: d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md
- Project Scope Document: d:\Dev\repos\NetPulse\.agents\teamwork\orchestrator_1\PROJECT.md
- Specification Document: d:\Dev\repos\NetPulse\docs\manual_testing_scripts_e2e.md
- Spec Miner Extraction: d:\Dev\repos\NetPulse\.agents\teamwork\spec_miner_survey_1\handoff.md
- Target Executable: `src-tauri/target/release/netpulse.exe`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
1. Build the foundational native CDP test execution harness in `tests/e2e/cdp_driver.js` that:
   - Launches `src-tauri/target/release/netpulse.exe` with `$env:WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS = "--remote-debugging-port=9222"`.
   - Connects to the WebView2 Chrome DevTools Protocol endpoint via native Node.js `WebSocket` and `fetch`.
   - Provides utilities for DOM interaction, navigation, screenshot capture, console log monitoring, and direct Tauri IPC invocation (`window.__TAURI_INTERNALS__.invoke(command, args)`).
   - Manages clean desktop process startup and teardown.

2. Implement and execute Milestone M1 test suite runner in `tests/e2e/run_m1_suites.js` covering:
   - `MTS-SHELL-001`: Title bar drag, minimize, maximize/restore, close, elevation badge.
   - `MTS-SHELL-002`: Theme toggle (Cyber-Dark vs Tactical Light, CSS tokens, WCAG AA contrast).
   - `MTS-SHELL-003`: Sidebar navigation router (11 modules) & persistent status bar (NIC, Egress, GeoLite2, IPC).
   - `MTS-DASH-001`: Automated egress discovery, 4XL IP banner, routability badge, Lat/Long coordinates.
   - `MTS-DASH-002`: Provider failover cascade health (MaxMind, ipapi, ipinfo, ipify) & diagnostic shortcuts.
   - `MTS-TRACE-001`: Visual MTR & geodesic trajectory canvas, multi-hop telemetry table (RTT, loss, jitter, ASN) to `1.1.1.1`.
   - `MTS-TRACE-002`: Mid-flight trace cancellation, socket loop abort, hop boundary clamping (1 to 64).
   - `MTS-MTRACE-001`: Concurrent multi-target MTR to `1.1.1.1`, `8.8.8.8`, `github.com`, route deviation counter.
   - `MTS-WATCH-001`: Sentinel watchdog background daemon, polling loop, latency/loss threshold alerts, event log.

3. Execute `run_m1_suites.js` against the live native desktop binary `src-tauri/target/release/netpulse.exe`.
   Capture all observable evidence (screenshots saved in `tests/e2e/artifacts/screenshots/`, telemetry JSON in `tests/e2e/artifacts/telemetry/`, console logs).

4. Record evaluated outcomes (PASS/FAIL/BLOCKED) with exact verifiable evidence in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1\handoff.md`.


## 2026-11-07T11:59:53Z
You are worker_m1, a teamwork_worker agent.
Your working directory is d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1.
You MUST read the authoritative user request at d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md and your task assignment at d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1\DISPATCH.md.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope: Milestone M1 Test Execution (Core Workstation Suites)
1. Build the foundational native CDP test execution harness in `tests/e2e/cdp_driver.js` driving `src-tauri/target/release/netpulse.exe` over port 9222 using native Node.js WebSocket.
2. Implement and execute Milestone M1 test suites in `tests/e2e/run_m1_suites.js` covering:
   - MTS-SHELL-001, MTS-SHELL-002, MTS-SHELL-003
   - MTS-DASH-001, MTS-DASH-002
   - MTS-TRACE-001, MTS-TRACE-002
   - MTS-MTRACE-001
   - MTS-WATCH-001
3. Execute the tests against the live native desktop binary `src-tauri/target/release/netpulse.exe`.
   Capture observable evidence: screenshots in `tests/e2e/artifacts/screenshots/`, telemetry JSON dumps in `tests/e2e/artifacts/telemetry/`, console logs.
4. Deliver your complete execution report to `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1\handoff.md`.
Follow the Handoff Protocol and send a completion message back with your report path.
