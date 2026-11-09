# Task Assignment: Milestone M2 Test Execution (Protocol & Diagnostic Suites)

- Role: teamwork_worker
- Working Directory: d:\Dev\repos\NetPulse\.agents\teamwork\worker_m2
- Authoritative User Request: d:\Dev\repos\NetPulse\.agents\teamwork\ORIGINAL_REQUEST.md
- Project Scope Document: d:\Dev\repos\NetPulse\.agents\teamwork\orchestrator_1\PROJECT.md
- Specification Document: d:\Dev\repos\NetPulse\docs\manual_testing_scripts_e2e.md
- Spec Miner Extraction: d:\Dev\repos\NetPulse\.agents\teamwork\spec_miner_survey_1\handoff.md
- Milestone M1 Handoff: d:\Dev\repos\NetPulse\.agents\teamwork\worker_m1_gen2\handoff.md
- Established Test Driver: `tests/e2e/cdp_driver.js`
- Target Executable: `src-tauri/target/release/netpulse.exe`

## MANDATORY INTEGRITY WARNING
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Objective
Implement and execute the Milestone M2 test runner in `tests/e2e/run_m2_suites.js` leveraging `tests/e2e/cdp_driver.js` against the live native desktop binary `src-tauri/target/release/netpulse.exe`.

Milestone M2 covers exactly 11 test cases across 6 test suites:
1. `MTS-PING-001`: High-Frequency Telemetry & RFC 3550 Jitter Accumulation
   - Target: `1.1.1.1`, interval: 200ms
   - Verify sparkline renders, min/avg/max/jitter/loss metrics update in real-time.
2. `MTS-PING-002`: Packet Loss & Unreachable Host Handling
   - Target: `192.0.2.1` (TEST-NET-1), 500ms interval
   - Verify 100% packet loss climbs, timeout ticks tagged, zero UI freezing.
3. `MTS-SUBNET-001`: CIDR Bitwise Calculator & Visual Octets
   - Target CIDR: `192.168.10.0/24`
   - Verify usable range (`192.168.10.1 - 192.168.10.254`), broadcast (`192.168.10.255`), netmask (`255.255.255.0`), wildcard (`0.0.0.255`), 32-bit binary octets, and JSON export.
4. `MTS-SUBNET-002`: Variable Length Subnet Mask (VLSM) Partitioner
   - Base CIDR: `10.0.0.0/16`
   - Subnets: Engineering (100 hosts), Sales (50 hosts), Infrastructure (20 hosts), DMZ (10 hosts)
   - Verify descending allocation table, collision-free ranges, and total host capacity math.
5. `MTS-PORT-001`: Multi-Mode TCP Connect Port Scanner & Service Discovery
   - Target: `scanme.nmap.org`, preset: Web (80, 443, 8080), banner grabbing enabled
   - Verify scan completion (0-100%), summary cards, discovered ports table, latency bars, service identification.
6. `MTS-PORT-002`: Monospace TLS Certificate Inspector
   - Inspect Port 443 on `scanme.nmap.org` or `cloudflare.com`
   - Verify Port Detail Drawer displays Subject, Issuer, Validity window, Cipher Suite, and ALPN.
7. `MTS-PORT-003`: Custom Port Syntax Parser & Concurrency Scaling
   - Custom string: `21-25, 53, 80, 443, 3306, 8000-8010`, concurrency: 500
   - Verify parsed unique port list, concurrency scaling, and rejection of invalid syntax.
8. `MTS-DNS-001`: Multi-Record & Cryptographic DNSSEC Inspector
   - Domain: `cloudflare.com`, records: A and MX
   - Verify DNS Answers table (TTL, IP), DNSSEC Status badge (`SECURE` / `INSECURE`).
9. `MTS-DNS-002`: Global DNS Propagation Grid
   - Domain query execution across 15+ international resolver nodes
   - Verify propagation grid shows latency, country flags, status pills (`MATCH`/`MISMATCH`), and % agreement.
10. `MTS-WHOIS-001`: RFC 7480 RDAP Registry & Contact Inspector
    - Domain: `cloudflare.com` or IP: `1.1.1.1`
    - Verify structured contact cards (Handle, CIDR, Lifecycle dates, Abuse Department), nameservers, raw RDAP toggle.
11. `MTS-LAN-001`: Unprivileged LAN Device Discovery Sweep
    - Local network sweep on active interface
    - Verify discovered devices table: IP, MAC, IEEE OUI Vendor resolution, Hostname probing, and PAL unprivileged badge.

## Deliverables
1. Script: `tests/e2e/run_m2_suites.js`
2. Execution against `src-tauri/target/release/netpulse.exe`
3. Multi-modal observable evidence:
   - Screenshots in `tests/e2e/artifacts/screenshots/`
   - Telemetry JSON dumps in `tests/e2e/artifacts/telemetry/`
   - Console logs
4. Handoff report in `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m2\handoff.md` following the 5-component handoff protocol.

## 2026-11-07T18:08:00Z
Received dispatch message:
MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Scope: Milestone M2 Test Execution (Protocol & Diagnostic Suites)
Leverage `tests/e2e/cdp_driver.js` to author and execute `tests/e2e/run_m2_suites.js` against the live native desktop binary `src-tauri/target/release/netpulse.exe`.
Execute all 11 test cases across the 6 test suites:
1. MTS-PING-001 (High-frequency ping to 1.1.1.1, sparkline, jitter)
2. MTS-PING-002 (Packet loss handling to 192.0.2.1)
3. MTS-SUBNET-001 (CIDR bitwise calculation 192.168.10.0/24)
4. MTS-SUBNET-002 (VLSM partitioner 10.0.0.0/16)
5. MTS-PORT-001 (TCP connect scan to scanme.nmap.org web preset)
6. MTS-PORT-002 (TLS cert inspector port 443)
7. MTS-PORT-003 (Custom port syntax parser & concurrency 500)
8. MTS-DNS-001 (Multi-record A/MX & DNSSEC cloudflare.com)
9. MTS-DNS-002 (Global propagation grid 15+ nodes)
10. MTS-WHOIS-001 (RFC 7480 RDAP registry lookup cloudflare.com/1.1.1.1)
11. MTS-LAN-001 (Unprivileged LAN sweep, ARP/ICMP, OUI vendor resolution)

Capture observable evidence:
- Screenshots in `tests/e2e/artifacts/screenshots/`
- Telemetry JSON in `tests/e2e/artifacts/telemetry/`
- Console output

Deliver your complete execution report to `d:\Dev\repos\NetPulse\.agents\teamwork\worker_m2\handoff.md`.
Follow the Handoff Protocol and send a completion message back with your report path.
