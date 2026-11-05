## 2026-11-05T14:41:51Z

You are the Phase 1 Foundation Worker for the NetPulse cross-platform network diagnostics desktop application.

Your assigned task and detailed specifications are in:
`d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase1\task.md`

Authoritative User Request:
`d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md`

Reference Architecture & Blueprints:
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 1, Sprints 1-4)
- `docs/hld.md` (High-Level Design: 5-layer architecture, unprivileged sockets)
- `docs/lld.md` (Low-Level Design: Section 2 Rust crates, Section 3 React 19, Section 4 IPC, Section 5 JSON schemas)
- `docs/ui_specification.md` (Design tokens, glassmorphism, UI components)
- `mockups/` (Interactive reference prototype: `index.html`, `styles.css`, `app.js`)
- `tests/runner.js` (E2E acceptance runner)

Working Directory:
`d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase1/`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Specific Deliverables for Phase 1 (Sprints 1-4):
1. Establish root project configuration: `package.json`, Vite, TypeScript, React 19, Tailwind CSS, Lucide / ECharts dependencies.
2. Establish `src-tauri` Cargo workspace with all crates defined in LLD:
   - `crates/iptracer-core` (error taxonomy, configuration, unprivileged ping & traceroute state machines, subnet calculator, SQLite vault models)
   - `crates/iptracer-net` (Platform Abstraction Layer sockets: unprivileged Windows `Iphlpapi.dll` / `IcmpSendEcho2`, Unix fallback)
   - `crates/iptracer-geo` (Multi-provider egress IP cascade: ipapi, ipinfo, ipify, with offline bundled/mock GeoLite2 database reader)
   - `crates/iptracer-ui` (or `src-tauri` main app binary: Tauri v2 commands `trace_ip`, `run_traceroute`, `start_continuous_ping`, `calculate_subnet`, micro-batched event channels)
   - `tauri.conf.json` desktop packaging metadata
3. Implement bogon and private IP filtering (RFC 1918, RFC 3927, RFC 6598, loopback, multicast).
4. Build the React 19 / TypeScript presentation layer in `src/`:
   - Cyber-glassmorphism styles matching `mockups/styles.css` and `docs/ui_specification.md`.
   - Frameless titlebar and navigation shell.
   - DashboardView, TraceView (with map/globe visualizer), PingView (with real-time latency sparklines), SubnetView (with CIDR/VLSM calculation), SettingsView.
   - Zustand stores (`useTraceStore`, `usePingStore`, `useAppStore`, etc.).
5. Verification:
   - Run `cargo check` and `cargo test` in `src-tauri` (ensure all crates compile cleanly and tests pass).
   - Run `npm run build` or `pnpm build` (ensure frontend builds cleanly without errors).
   - Run `node tests/runner.js` (ensure all 4 tiers of acceptance tests continue to pass 100%).
6. Write a complete handoff report in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase1\handoff.md` summarizing files created/modified, compilation and test commands executed, test outputs, and verification status. Send a message to the orchestrator when completed.
