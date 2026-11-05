## 2026-11-05T17:02:49Z
You are the Phase 2 Diagnostics Worker for the NetPulse cross-platform network diagnostics desktop application.

Your task description and detailed checklist are located at:
`d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase2\task.md`

Authoritative User Request:
`d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md`

Phase 1 Code Review Report & Findings:
`d:\Dev\repos\NetPulse\.agents\teamwork\reviewer_phase1\handoff.md`

Reference Blueprints & Specifications:
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 2, Sprints 5-8)
- `docs/hld.md` (High-Level Design)
- `docs/lld.md` (Low-Level Design: Sections 2, 3, 4, 5)
- `schemas/` (`port_scanner_schema.json`, `dns_inspector_schema.json`, `whois_rdap_schema.json`)
- `tests/runner.js` (E2E acceptance runner)

Working Directory:
`d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase2/`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Key Deliverables for Phase 2 (Sprints 5-8):
1. Fix Reviewer Finding 1 in `src-tauri/crates/iptracer-net/src/windows.rs:151`:
   Normalize IP byte order: `let responder_ip = IpAddr::V4(Ipv4Addr::from(reply.address.to_ne_bytes()));`
2. Implement High-Speed Port Scanner & Service Discovery in `iptracer-core/src/portscan.rs` (async TCP connect scanner, semaphore concurrency control, presets, banner grabbing, service signatures, `scan_ports` command, streaming `port:found` events).
3. Implement DNS Inspector & Global Propagation Checker in `iptracer-core/src/dns.rs` (A, AAAA, MX, NS, TXT, SOA, CNAME, PTR, SRV, CAA, DNSSEC status, 15+ global nodes, reverse DNS integration for traceroute, `query_dns` command).
4. Implement WHOIS & RDAP Registry Inspector in `iptracer-core/src/whois.rs` (RDAP client, offline mock/bundled dataset fallback when offline or unauthenticated, entity parsing, `query_whois` command).
5. Implement Threat Intel & IP Reputation in `iptracer-geo/src/threat.rs` (AbuseIPDB/VirusTotal rating models, Tor exit node & VPN badges).
6. Implement 20 Hz Telemetry Streaming and SQLite Data Vault in `iptracer-core/src/storage.rs` and `iptracer-ui` (micro-batched streaming, persistent scan history & favorites).
7. Implement Auto-updater scaffolding in `iptracer-ui/src/updater.rs`.
8. Implement React 19 views and stores in `src/`:
   - `PortScanView.tsx`, `DnsView.tsx`, `WhoisView.tsx`
   - `usePortScanStore.ts`, `useDnsStore.ts`, `useWhoisStore.ts`
   - Connect sidebar navigation so all Phase 2 views are active and interactive
   - ECharts integration for latency distributions and sparklines
9. Automated Verification:
   - Run `cargo check --workspace --manifest-path src-tauri/Cargo.toml` (0 errors)
   - Run `cargo test --workspace --manifest-path src-tauri/Cargo.toml` (all tests pass)
   - Run `npm run build` (clean TypeScript typecheck & Vite build)
   - Run `node tests/runner.js` (100% pass rate)
10. Deliver comprehensive handoff report in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_phase2\handoff.md` and send message to orchestrator upon completion.
