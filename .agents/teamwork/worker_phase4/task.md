# Phase 4 Worker Task: Enterprise, Telemetry & Ecosystem (Sprints 13–16) and Final Remote Push

## Objective
Implement Phase 4 of the NetPulse desktop suite per `docs/implementation_roadmap.md`, `docs/hld.md`, and `docs/lld.md`. Deliver the Sentinel Watchdogs & Notification Engine, Multi-Target Concurrent Traceroute & Historical Diff Engine, Multi-format Diagnostic Reporting (PCAP, CSV, HTML/JSON), Enterprise Cloud Telemetry Stubs & Policy Engine, Full E2E verification, and push the completed repository and all commits to GitHub `origin master` as the final step.

## Working Directory
`.agents/teamwork/worker_phase4/`

## Key Specifications & Blueprints
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 4, Sprints 13-16)
- `docs/hld.md` (High-Level Design: Section 3 Layered Architecture, Section 4 Data Flows, Section 5 Security)
- `docs/lld.md` (Low-Level Design: Section 2.1 Crate Architecture, Section 3 React UI, Section 4 IPC API)
- `tests/runner.js` (E2E acceptance runner)
- `.agents/teamwork/reviewer_phase3/handoff.md` (Phase 3 Code Review Report & Findings)

## Requirements Checklist

### 1. Sentinel Watchdogs & Alerting Engine (`crates/iptracer-core/src/watchdog.rs`)
- Background health monitor executing periodic probes against critical targets (default gateway, primary DNS, public anchor).
- Network interface state watcher detecting adapter transitions (Up/Down, IP changes, gateway shifts).
- Configurable thresholds for latency spikes (>100ms) and packet loss (>5%).
- Event emitter streaming `watchdog:status` and `watchdog:alert` events.
- IPC commands: `start_watchdog`, `stop_watchdog`, `get_watchdog_status`.

### 2. Multi-Target Traceroute & Historical Route Deviation Engine (`crates/iptracer-core/src/multitrace.rs`)
- Concurrent execution of incremental TTL traceroutes across multiple target endpoints (up to 8 targets in parallel).
- Route deviation detection: comparing current hop paths against cached baseline paths in SQLite vault to identify BGP route churn, path shifts, or intermediate hop anomalies.
- IPC commands: `run_multitrace`, `get_historical_paths`.
- Event streams: `multitrace:progress`, `multitrace:completed`.

### 3. Multi-Format Diagnostic Reporting & Export (`crates/iptracer-core/src/report.rs`)
- PCAP Export: serialize captured raw/synthetic packets into valid standard libpcap 2.4 binary format (`.pcap`).
- CSV Metrics Export: export ping latency time-series, port scan tables, and LAN device inventories into well-structured RFC 4180 CSV strings.
- HTML/JSON Executive Diagnostic Summary: self-contained executive diagnostic audit report with cyber-glassmorphic styling, key metrics summary cards, and hop-by-hop latency tables.
- IPC command: `export_report`.

### 4. Enterprise Cloud Telemetry Stubs & Policy Engine (`crates/iptracer-core/src/cloud.rs`)
- Enterprise cloud telemetry sync client stub with bearer authentication and offline spooling.
- Enterprise diagnostic policy profiles (JSON/YAML) defining diagnostic intervals, allowed port ranges, and alert thresholds.
- IPC commands: `sync_cloud_telemetry`, `get_enterprise_policy`.

### 5. IPC Wiring & Tauri v2 Integration (`src-tauri/crates/iptracer-ui/src/`)
- Wire up new Phase 4 modules in `iptracer-core/src/lib.rs`.
- Register all new IPC commands in `commands.rs` and `lib.rs` invoke handler.
- Maintain strong typing with `AppResponse<T>` and robust error handling via `AppError`.

### 6. React 19 Frontend Views & Stores (`src/`)
- `src/components/enterprise/WatchdogView.tsx`: Live monitor dashboard with status pills, alert log, threshold config sliders, and interface health badges.
- `src/components/enterprise/MultiTraceView.tsx`: Multi-target traceroute view with concurrent progress bars, hop comparison table, and path deviation indicators.
- `src/components/common/ReportExportModal.tsx`: Export dialog supporting PCAP, CSV, and HTML audit report downloads.
- `src/stores/useWatchdogStore.ts` and `src/stores/useMultiTraceStore.ts`.
- Update `src/components/layout/Sidebar.tsx`: Ensure ALL navigation items are now marked `isActiveModule: true` with Phase badges.
- Update `src/App.tsx`: Mount views for `watchdog` and `multitrace`.

### 7. Automated Verification Across All 16 Sprints
- `node tests/runner.js` passes all 28 acceptance tests (100% pass rate).
- `cargo check --workspace --manifest-path src-tauri/Cargo.toml` (0 errors, 0 warnings).
- `cargo test --workspace --manifest-path src-tauri/Cargo.toml` (all unit tests pass across all crates).
- `npm run build` (clean TypeScript typecheck & Vite production bundling).

### 8. Final Step: GitHub Remote Push (Requirement R4)
- Check `git remote -v`.
- Stage all files: `git add .`.
- Commit changes: `git commit -m "feat: complete NetPulse cross-platform desktop suite (Phases 1-4)"`.
- Push commits to GitHub: `git push -u origin master`.
- Verify remote push status.

### 9. Deliverables & Handoff
- Deliver structured handoff report in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase4\handoff.md`.
- Communicate completion to orchestrator via `send_message`.
