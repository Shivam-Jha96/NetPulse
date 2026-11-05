# Phase 3 Worker Task: Deep Packet Intelligence & Hardening (Sprints 9–12)

## Objective
Implement Phase 3 of the NetPulse desktop suite per `docs/implementation_roadmap.md`, `docs/hld.md`, and `docs/lld.md`. Deliver the Privilege Separation Daemon (`iptracer-helper`), Raw SYN Stealth Scan, LAN ARP Discovery with IEEE OUI resolution, Non-elevated Graceful Fallback / Simulated Mode, and Code Signing Hardening.

## Working Directory
`.agents/teamwork/worker_phase3/`

## Key Specifications & Blueprints
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 3, Sprints 9-12)
- `docs/hld.md` (High-Level Design: Section 3.2 Dual-Process Privilege Model, Named Pipe IPC)
- `docs/lld.md` (Low-Level Design: Section 2.2 Daemon trait, Section 2.1 crates, Section 3 React UI, Section 4 IPC)
- `tests/runner.js` (E2E acceptance runner)
- `.agents/teamwork/reviewer_phase2/handoff.md` (Phase 2 Review Report & Findings)

## Requirements Checklist
1. **Privilege Separation Daemon `iptracer-helper` (`crates/iptracer-daemon`)**:
   - Implement `iptracer-daemon` binary and library components:
     - IPC server over Windows Named Pipe `\\.\pipe\iptracer-helper` (POSIX: `/var/run/iptracer-helper.sock`) with mutual peer authentication / handshake.
     - Elevated command dispatcher (`StartSynScan`, `StartPacketSniffer`, `StopOperation`).
     - Event stream emitter (`SynPortDiscovered`, `PacketCaptured`, `OperationError`, `OperationCompleted`).
     - `PrivilegeHelperClient` client implementation in `iptracer-daemon` with `is_connected`, `connect`, and `dispatch_command`.
2. **Raw SYN Stealth Scanning & Packet Sniffing**:
   - Implement raw TCP SYN packet crafting and listener in `iptracer-daemon/src/raw_engine.rs`.
   - Wire SYN scan to port scanner as an elevated mode.
3. **Local Area Network (LAN) ARP Discovery Scanner (`crates/iptracer-core/src/lan.rs`)**:
   - ARP / NDP neighbor cache parser (`GetIpNetTable2` / `arp -a`) and active subnet ping sweep.
   - IEEE OUI vendor database resolver: maps MAC address OUI prefixes to manufacturer badges (Apple, Intel, Cisco, Raspberry Pi, Espressif, Samsung, Microsoft, Dell, HP, etc.).
   - Hostname resolution probing (NetBIOS, mDNS, reverse DNS).
   - IPC command: `scan_lan` (`interfaceName?: string`) returning `LanScanResult`.
   - Streaming event: `lan:device-discovered` (with 20 Hz micro-batching `lan:device-discovered-batch`).
4. **Non-Elevated Graceful Fallback / Simulated Mode (MANDATORY ACCEPTANCE CRITERION)**:
   - When Administrator elevation is absent or helper daemon is unavailable:
     - SYN Scan must gracefully fall back to zero-elevation unprivileged TCP Connect scan.
     - Raw packet sniffer must fall back to simulated / local synthetic traffic inspection.
     - LAN ARP scanner must operate using zero-elevation OS neighbor tables and unprivileged ping sweeps.
     - System must NEVER panic or fail due to lack of elevation.
5. **Address Phase 2 Reviewer Recommendations**:
   - In `dns.rs`: when remote resolvers fail or time out, report `PropagationStatus::Timeout` or `PropagationStatus::Error` instead of synthetic `Match`.
   - In `threat.rs`: refine IPv6 datacenter classification so generic IPv6 addresses are not blanket-classified as datacenters.
6. **Code Signing & Hardening Scaffolding**:
   - Tauri v2 security hardening: CSP validation, IPC command input validation, and code signing metadata stubs.
7. **React 19 Frontend Views & Stores (`src/`)**:
   - `src/components/lan/LanView.tsx`: Local device grid with MAC vendor badges, IP/MAC/Hostname/Latency table, scan progress bar, and interface selector.
   - `src/stores/useLanStore.ts`: Zustand store for LAN scan state and discovered devices.
   - `src/hooks/useElevation.ts`: OS privilege status hook and elevation prompt modal / pill.
   - Update `src/components/layout/Sidebar.tsx` and `src/App.tsx` so the LAN Scanner tab is fully active and navigable.
8. **Automated Verification**:
   - Run `cargo check --workspace --manifest-path src-tauri/Cargo.toml` (0 errors).
   - Run `cargo test --workspace --manifest-path src-tauri/Cargo.toml` (all tests pass including new daemon/lan tests).
   - Run `npm run build` (clean TypeScript typecheck & Vite build).
   - Run `node tests/runner.js` (100% pass rate).
   - Deliver `handoff.md` in `.agents/teamwork/worker_phase3/`.
