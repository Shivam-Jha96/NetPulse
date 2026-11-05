## 2026-11-05T17:40:14Z

You are the Phase 3 Intelligence & Hardening Worker for the NetPulse cross-platform network diagnostics desktop application.

Your task description and detailed checklist are located at:
`d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase3\task.md`

Authoritative User Request:
`d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md`

Phase 2 Code Review Report & Findings:
`d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_phase2\handoff.md`

Reference Blueprints & Specifications:
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 3, Sprints 9-12)
- `docs/hld.md` (High-Level Design: Section 3.2 Dual-Process Privilege Model)
- `docs/lld.md` (Low-Level Design: Section 2.2 Privilege Separation Daemon, Section 3 React UI, Section 4 IPC)
- `tests/runner.js` (E2E acceptance runner)

Working Directory:
`d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase3/`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Key Deliverables for Phase 3 (Sprints 9-12):
1. Implement Privilege Separation Daemon `iptracer-helper` in `src-tauri/crates/iptracer-daemon`:
   - Daemon binary (`src/main.rs`) and library (`src/lib.rs`, `src/ipc_server.rs`, `src/auth.rs`, `src/raw_engine.rs`).
   - Named Pipe IPC channel (`\\.\pipe\iptracer-helper`) / Unix Domain Socket (`/var/run/iptracer-helper.sock`) with mutual peer authentication / handshake.
   - Commands: `StartSynScan`, `StartPacketSniffer`, `StopOperation`.
   - Events: `SynPortDiscovered`, `PacketCaptured`, `OperationError`, `OperationCompleted`.
   - Client implementation `PrivilegeHelperClient` in `iptracer-daemon`.
2. Implement LAN ARP Discovery Scanner in `iptracer-core/src/lan.rs`:
   - Local network neighbor sweep (`GetIpNetTable2` / OS neighbor cache / ping sweep).
   - IEEE OUI vendor database resolver: maps MAC address prefixes to manufacturer badges (Apple, Intel, Cisco, Raspberry Pi, Espressif, Samsung, Microsoft, etc.).
   - Hostname resolution probing (NetBIOS / mDNS / reverse DNS).
   - IPC command: `scan_lan` (`interfaceName?: string`) returning `LanScanResult`.
   - Streaming event: `lan:device-discovered` (with 20 Hz batching `lan:device-discovered-batch`).
3. Non-Elevated Graceful Fallback / Simulated Mode (MANDATORY):
   - When Administrator elevation is absent or helper daemon is unavailable:
     - SYN Scan gracefully falls back to unprivileged TCP Connect scan.
     - Raw packet sniffer gracefully falls back to simulated/synthetic local interface traffic inspection.
     - LAN ARP scanner operates using unprivileged OS neighbor tables and unprivileged ping sweeps.
     - System NEVER panics or fails due to lack of elevation.
4. Address Phase 2 Reviewer Recommendations:
   - In `dns.rs`: when remote resolvers fail or time out, report `PropagationStatus::Timeout` or `PropagationStatus::Error` instead of synthetic `Match`.
   - In `threat.rs`: refine IPv6 datacenter classification so generic IPv6 addresses are not blanket-classified as datacenters.
5. Code Signing & Hardening Scaffolding:
   - Tauri v2 security hardening: CSP validation, IPC command input validation, and code signing metadata stubs.
6. React 19 Frontend Views & Stores in `src/`:
   - `src/components/lan/LanView.tsx`: Local device grid with MAC vendor badges, IP/MAC/Hostname/Latency table, scan progress bar, and interface selector.
   - `src/stores/useLanStore.ts`: Zustand store for LAN scan state and discovered devices.
   - `src/hooks/useElevation.ts`: OS privilege status hook and elevation prompt modal / pill.
   - Update `src/components/layout/Sidebar.tsx` and `src/App.tsx` so the LAN Scanner tab is fully active and navigable.
7. Automated Verification:
   - Run `cargo check --workspace --manifest-path src-tauri/Cargo.toml` (0 errors).
   - Run `cargo test --workspace --manifest-path src-tauri/Cargo.toml` (all tests pass).
   - Run `npm run build` (clean TypeScript typecheck & Vite build).
   - Run `node tests/runner.js` (100% pass rate).
8. Deliver comprehensive handoff report in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase3\handoff.md` and send message to orchestrator upon completion.
