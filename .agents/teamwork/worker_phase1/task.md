# Phase 1 Worker Task: Foundation & MVP Desktop Release (Sprints 1-4)

## Objective
Implement Phase 1 of the NetPulse desktop suite per `docs/implementation_roadmap.md`, `docs/hld.md`, and `docs/lld.md`. Establish the Tauri v2 scaffolding, Rust workspace crates, Platform Abstraction Layer (PAL) sockets, egress IP discovery with offline GeoLite2 fallback, ICMP ping/traceroute engine, subnet calculator, and React 19 UI shell.

## Working Directory
`.agents/teamwork/worker_phase1/`

## Key Specifications & Blueprints
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 1, Sprints 1-4)
- `docs/hld.md` (High-Level Design: 5-layer architecture, unprivileged OS sockets)
- `docs/lld.md` (Low-Level Design: Section 2 Rust crates, Section 3 React 19 frontend, Section 4 IPC contracts, Section 5 JSON schemas)
- `docs/ui_specification.md` (Design tokens, glassmorphism, views)
- `mockups/` (Interactive prototype reference: `index.html`, `styles.css`, `app.js`)
- `tests/runner.js` (E2E acceptance runner)

## Requirements Checklist
1. **Repository & Tauri v2 Scaffolding**:
   - `package.json` with React 19, TypeScript, Vite, Tailwind CSS, Zustand, ECharts, Lucide React (or equivalent icons).
   - `src-tauri/` Cargo workspace containing:
     - `crates/iptracer-core` (error taxonomy, config, ping, traceroute, subnet, storage vault)
     - `crates/iptracer-net` (PAL socket abstraction layer: Windows `Iphlpapi.dll`/`IcmpSendEcho2`, Unix fallback)
     - `crates/iptracer-geo` (Egress IP cascade: `ipapi.co`, `ipinfo.io`, `ipify`, and offline bundled/mock MaxMind GeoLite2 reader)
     - `crates/iptracer-ui` (or `src-tauri` app binary: Tauri commands, IPC event emitters, state initialization)
   - `tauri.conf.json` with capabilities, window config, and desktop packaging metadata.
2. **Core PAL Socket Layer (`iptracer-net`)**:
   - Unprivileged ICMP echo probe system using Windows `Iphlpapi.dll` (`IcmpCreateFile`, `IcmpSendEcho2`, `IcmpCloseHandle`).
   - Clean traits (`PlatformSocketProvider`, `SocketProvider`) with graceful fallback when elevated sockets are absent.
3. **Egress IP & Geolocation (`iptracer-geo`)**:
   - Multi-provider client IP discovery with automatic failover.
   - Offline fallback: bundled offline mock/minimal GeoLite2 dataset or embedded data table when external API credentials/internet are unavailable.
   - Bogon & private IP filtering (RFC 1918, RFC 3927, RFC 6598, loopback, multicast).
4. **Diagnostic Engines (`iptracer-core`)**:
   - Unprivileged ICMP Traceroute engine with TTL increment loop, hop discovery, and streaming events.
   - Continuous Ping monitor engine with RTT statistics (min, avg, max, stddev) and RFC 3550 jitter calculation.
   - Subnet / CIDR & VLSM Calculator engine (IPv4 & IPv6 network address, broadcast, usable range, binary mask, VLSM partitioner).
5. **Tauri IPC Command Bridge**:
   - `trace_ip`, `run_traceroute`, `start_continuous_ping`, `calculate_subnet`.
   - Streaming event channels: `trace:hop-discovered`, `ping:tick` (with 20 Hz batching support).
6. **Frontend Implementation (`src/`)**:
   - Cyber-glassmorphism styling matching `mockups/styles.css` and `docs/ui_specification.md`.
   - Frameless titlebar with window controls.
   - Navigation tabs: Dashboard, IP Trace, Ping Monitor, Subnet Calculator, Settings.
   - DashboardView, TraceView (with map/globe visualizer), PingView (with sparkline latency chart), SubnetView, SettingsView.
7. **Verification**:
   - Run `cargo check` and `cargo test` in `src-tauri`.
   - Run `pnpm build` or `npm run build` for frontend.
   - Run `node tests/runner.js` to ensure 100% pass rate.
   - Deliver `handoff.md` in `.agents/teamwork/worker_phase1/` detailing all implemented files, test outputs, and verification commands.
