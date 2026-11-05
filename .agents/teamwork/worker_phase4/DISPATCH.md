## 2026-11-05T18:11:59Z
You are worker_phase4, a specialized engineering worker agent responsible for implementing Phase 4 (Enterprise, Telemetry & Ecosystem, Sprints 13–16) of the NetPulse desktop suite and executing the final repository push to GitHub origin master.

Your working directory is: `d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase4/`

Mandatory instructions:
1. First, create your `DISPATCH.md` and `BRIEFING.md` in your working directory.
2. Read your detailed task specification at: `d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase4\task.md`
3. Read the original user requirements at: `d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md`
4. Read the Phase 3 reviewer report and findings at: `d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_phase3\handoff.md`
5. Address the minor findings from Phase 3 review:
   - Gate `netpulse-dev-secret-token` behind `#[cfg(debug_assertions)]` in `iptracer-daemon/src/auth.rs`.
   - Enhance `read_system_arp_table` in `iptracer-core/src/lan.rs` for Linux output compatibility (`/proc/net/arp` and regex `\((.*?)\)`).
6. Implement all Phase 4 modules:
   - `crates/iptracer-core/src/watchdog.rs`: Sentinel background monitoring & alerting engine, interface watcher, latency/packet loss thresholds, event streaming (`watchdog:status`, `watchdog:alert`), IPC commands (`start_watchdog`, `stop_watchdog`, `get_watchdog_status`).
   - `crates/iptracer-core/src/multitrace.rs`: Multi-target concurrent traceroute engine (up to 8 targets), route deviation / diff engine comparing current hops against cached baseline in SQLite vault, IPC commands (`run_multitrace`, `get_historical_paths`), event streams (`multitrace:progress`, `multitrace:completed`).
   - `crates/iptracer-core/src/report.rs`: Multi-format diagnostic reporting (standard libpcap 2.4 `.pcap` binary serialization, RFC 4180 CSV export for ping/port/lan data, executive HTML/JSON diagnostic audit summary with cyber-glassmorphic styling and hop tables), IPC command (`export_report`).
   - `crates/iptracer-core/src/cloud.rs`: Enterprise cloud telemetry sync client stub with bearer auth and offline queue, enterprise policy profiles engine, IPC commands (`sync_cloud_telemetry`, `get_enterprise_policy`).
   - Wire all Phase 4 modules in `iptracer-core/src/lib.rs`, `src-tauri/crates/iptracer-ui/src/commands.rs`, and `src-tauri/crates/iptracer-ui/src/lib.rs`.
   - React 19 Frontend:
     - `src/components/enterprise/WatchdogView.tsx`: Live monitor dashboard with status pills, alert log, threshold config sliders, interface health badges.
     - `src/components/enterprise/MultiTraceView.tsx`: Multi-target traceroute view with concurrent progress bars, hop comparison table, path deviation indicators.
     - `src/components/common/ReportExportModal.tsx`: Export dialog supporting PCAP, CSV, and HTML audit report downloads.
     - `src/stores/useWatchdogStore.ts` and `src/stores/useMultiTraceStore.ts`.
     - Update `src/components/layout/Sidebar.tsx`: Ensure ALL navigation items are marked `isActiveModule: true`.
     - Update `src/App.tsx`: Mount views for `watchdog` and `multitrace`.
7. Automated Verification Across All 16 Sprints:
   - `cargo check --workspace --manifest-path src-tauri/Cargo.toml` (must have 0 errors, 0 warnings).
   - `cargo test --workspace --manifest-path src-tauri/Cargo.toml` (all tests must pass across all crates).
   - `npm run build` (tsc & vite build must pass with 0 errors).
   - `node tests/runner.js` (all 28 E2E acceptance tests must pass, 100% pass rate).
8. Final Step: GitHub Remote Push (Requirement R4):
   - Check `git status` and `git remote -v`.
   - Stage all files: `git add .`
   - Commit: `git commit -m "feat: complete NetPulse cross-platform desktop suite (Phases 1-4)"`
   - Push commits: `git push -u origin master` (if credentials/remote issues arise, diagnose and document).
9. Write your final handoff report in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase4\handoff.md` and notify orchestrator via `send_message`.
