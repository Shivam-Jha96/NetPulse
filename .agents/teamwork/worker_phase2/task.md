# Phase 2 Worker Task: Enhanced Diagnostic Suite (Sprints 5–8)

## Objective
Implement Phase 2 of the NetPulse desktop suite per `docs/implementation_roadmap.md`, `docs/hld.md`, and `docs/lld.md`. Build the High-Speed Port Scanner, DNS Inspector & Global Propagation Checker, WHOIS/RDAP Registry Inspector with offline mock cache, Threat Intel scoring, 20 Hz Telemetry Streaming with Apache ECharts, Local SQLite Data Vault, and Auto-updater scaffolding.

## Working Directory
`.agents/teamwork/worker_phase2/`

## Key Specifications & Blueprints
- `PROJECT.md` & `README.md`
- `docs/implementation_roadmap.md` (Phase 2, Sprints 5-8)
- `docs/hld.md` (High-Level Design: service boundaries, telemetry streaming)
- `docs/lld.md` (Low-Level Design: Section 2.1 crates, Section 3 React 19 UI, Section 4 IPC contracts, Section 5 JSON schemas)
- `schemas/` (`port_scanner_schema.json`, `dns_inspector_schema.json`, `whois_rdap_schema.json`)
- `tests/runner.js` (E2E acceptance runner)
- `.agents/teamwork/reviewer_phase1/handoff.md` (Phase 1 Code Review Report & Findings)

## Requirements Checklist
1. **Fix Reviewer Finding 1 (Byte Order Normalization)**:
   - In `src-tauri/crates/iptracer-net/src/windows.rs:151`, change:
     `let responder_ip = IpAddr::V4(Ipv4Addr::from(reply.address.to_ne_bytes()));`
     to correctly preserve network byte order when reading Win32 `ICMP_ECHO_REPLY`.
2. **High-Speed Port Scanner & Service Discovery (`iptracer-core/src/portscan.rs`)**:
   - Asynchronous TCP connect scan engine using Tokio with semaphore concurrency control (100-500 concurrent probes).
   - Presets: Top 20, Top 100, Common Web (80, 443, 8080, 8443), Database (3306, 5432, 27017, 6379), Mail, SSH/Telnet, and Custom ranges.
   - Banner grabbing for open ports (HTTP HEAD, SSH protocol identification, SMTP greeting, etc.) with timeout.
   - Service identification matching (HTTP, HTTPS, SSH, FTP, Telnet, SMTP, DNS, MySQL, PostgreSQL, Redis, MongoDB, RDP).
   - IPC command: `scan_ports` (`target: string, ports: PortRange, mode: ScanMode`) returning `PortScanResult` conforming to `schemas/port_scanner_schema.json`.
   - Streaming event: `port:found` (with 20 Hz batching).
3. **DNS Inspector & Global Propagation Checker (`iptracer-core/src/dns.rs`)**:
   - Comprehensive DNS record queries: A, AAAA, MX, NS, TXT, SOA, CNAME, PTR, SRV, CAA, and DNSSEC validation status.
   - Global multi-node propagation check querying 15+ global DNS resolvers / DoH endpoints (Cloudflare, Google, Quad9, OpenDNS, Level3, plus regional resolvers).
   - Connect reverse DNS (PTR lookup) to resolve intermediate hop hostnames in traceroute.
   - IPC command: `query_dns` (`domain: string, recordTypes: string[], servers: string[]`) returning `DnsLookupResult` conforming to `schemas/dns_inspector_schema.json`.
4. **WHOIS & RDAP Registry Inspector (`iptracer-core/src/whois.rs`)**:
   - RDAP REST client querying regional internet registries (ARIN, RIPE, APNIC, LACNIC, AFRINIC) with Port 43 WHOIS fallback.
   - Offline mock / bundled dataset fallback when network is unavailable or rate limits occur (as required by Acceptance Criteria).
   - Entity parsing: registrar name, abuse contacts, creation/expiration dates, status codes, CIDR allocation, ASN details.
   - IPC command: `query_whois` (`query: string`) returning `WhoisResult` conforming to `schemas/whois_rdap_schema.json`.
5. **Threat Intel & IP Reputation (`iptracer-geo/src/threat.rs`)**:
   - Threat score calculation, AbuseIPDB/VirusTotal rating models, Tor exit node and VPN/proxy detection badges.
6. **20 Hz Telemetry Streaming & SQLite Data Vault (`iptracer-core/src/storage.rs`, `iptracer-ui`)**:
   - 20 Hz micro-batched event channel (`*:batch`) for smooth UI rendering without event loop starvation.
   - Persistent scan history, saved favorites, and diagnostic session records stored in embedded SQLite vault.
7. **Auto-Updater Scaffolding (`iptracer-ui/src/updater.rs`)**:
   - Ed25519 signature validation scaffolding and update check endpoint stub.
8. **Frontend Views & Stores (`src/`)**:
   - `src/components/portscan/PortScanView.tsx` with port range selector, scan progress bar, open port list, and banner inspector modal.
   - `src/components/dns/DnsView.tsx` with record type tabs, DNSSEC badge, and global propagation nodes status table/map.
   - `src/components/whois/WhoisView.tsx` with RDAP card tree, registrar info, and abuse contacts.
   - Zustand stores: `usePortScanStore.ts`, `useDnsStore.ts`, `useWhoisStore.ts`.
   - Update `src/components/layout/Sidebar.tsx` to enable active navigation to Port Scanner, DNS Inspector, WHOIS/RDAP, and Settings.
   - ECharts integration for latency distributions and sparklines.
9. **Automated Verification**:
   - Run `cargo check --workspace --manifest-path src-tauri/Cargo.toml` (0 errors).
   - Run `cargo test --workspace --manifest-path src-tauri/Cargo.toml` (all unit tests pass including new tests).
   - Run `npm run build` (clean TypeScript typecheck and Vite build).
   - Run `node tests/runner.js` (100% pass rate).
   - Deliver `handoff.md` in `.agents/teamwork/worker_phase2/` detailing changes, test commands, and verification outputs.
