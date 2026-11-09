# Diagnostic Modules 🛠️

> In-depth operational documentation for all 11 diagnostic modules and workstation tools in NetPulse.

---

## 1. 🌐 Primary Egress Gateway Dashboard

The **Dashboard** represents your network identity and primary gateway status.

```
+--------------------------------------------------------------------------+
| PRIMARY EGRESS GATEWAY                      [PUBLIC ROUTABLE] [MAXMIND]   |
| 1.1.1.1                                                                  |
| Cloudflare, Inc. (AS13335) • San Jose, California, United States         |
+--------------------------------------------------------------------------+
| [ISP / Org]          [Coordinates]        [Threat Score]    [Local NIC]  |
| Cloudflare Net       37.7749° N, 122.41° W Clean (0/100)     192.168.1.45 |
+--------------------------------------------------------------------------+
```

### Key Metrics & Indicators
- **Public IP & Classification**: Displays the current public egress IPv4/IPv6 address. Automatically tagged as `PUBLIC ROUTABLE` or `BOGON / PRIVATE` (RFC 1918 / RFC 6598 CGNAT).
- **ISP & ASN**: Identifies your Internet Service Provider, Autonomous System Number (ASN), and BGP prefix routing block.
- **Physical Geolocation**: City, region, country, timezone, and coordinates with accuracy radius.
- **Threat Intelligence**: Abuse confidence score (0–100), proxy/VPN detection, and Tor exit node verification.
- **Active Adapter**: Interface name, local private IP, and MAC address.

### Operational Tips
- Click **Refresh Gateway** (<kbd>🔄</kbd>) whenever toggling a VPN or proxy tunnel to confirm that your public egress path has properly changed.
- Click any quick-action button to immediately trace or ping your egress IP.

---

## 2. 🗺️ Visual Traceroute & MTR

Trace the exact hop-by-hop path packets take across the globe from your computer to any remote target.

### Features
- **Tactical Canvas Map**: Real-time hardware-accelerated 2D/3D route canvas rendering animated geodesic packet beams connecting hops.
- **MTR-Style Continuous Hop Telemetry**:
  - **TTL (Time to Live)**: Hop distance from your machine.
  - **Router IP & Reverse DNS Hostname**: Identified gateway names.
  - **Autonomous System (ASN)**: Carrier handling that segment.
  - **Round-Trip Times (RTT)**: Current, average, best, and worst latency in milliseconds.
  - **Packet Loss %**: Visual health bar highlighting where packet drops occur.

### How to Run a Trace
1. Navigate to **IP Trace & MTR** (or press <kbd>Ctrl</kbd>+<kbd>2</kbd>).
2. Enter a destination host (e.g., `github.com` or `1.1.1.1`).
3. Set the **Max Hops** slider (1 to 64 hops).
4. Click **Start Traceroute** (<kbd>▶</kbd>).
5. Watch the canvas animate and telemetry table populate hop by hop.

---

## 3. 📈 Live Ping & Jitter Monitor

High-frequency, 60 FPS connection stability and line quality monitoring.

### Why Jitter Telemetry Matters
While standard ping displays average round-trip time, **jitter** measures the statistical variation in latency between sequential packets (computed according to RFC 3550). High jitter indicates network congestion or bufferbloat, leading to choppy voice/video calls and stuttering remote sessions.

### Configurable Parameters
- **Target Host**: IP address or domain name.
- **Interval (ms)**: Ping frequency (50 ms for stress testing, 1000 ms for continuous health monitoring).
- **Packet Size (bytes)**: ICMP payload size (default: 32 bytes; up to 1472 bytes for MTU testing).
- **DF (Don't Fragment) Bit**: Toggle to detect the path MTU without fragmenting IP packets.

---

## 4. 🔍 High-Speed Port Scanner & Banner Grabbing

Scan servers, routers, firewalls, and workstations to identify open services and listening ports.

### Scan Profiles
- **Top 20**: Rapid reconnaissance of standard ports (21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 993, 995, 1433, 3306, 3389, 5432, 8080, etc.).
- **Top 100**: Comprehensive scan of common service ports.
- **Web Profile**: Ports 80, 443, 8080, 8443.
- **Database Profile**: Ports 1433 (MSSQL), 3306 (MySQL), 5432 (PostgreSQL), 6379 (Redis), 27017 (MongoDB).
- **Mail Profile**: Ports 25 (SMTP), 110 (POP3), 143 (IMAP), 465, 587, 993.
- **Custom Range**: Enter comma-separated ranges (e.g. `22, 80, 443, 8000-8088`).

### Scan Modes
- **TCP Connect Mode (Default)**: Completes standard 3-way TCP handshake using unprivileged sockets. Safe, reliable, and requires zero administrative elevation.
- **SYN Stealth Mode**: Sends raw SYN packets; requires elevated administrator/root rights.

---

## 5. 🔎 DNS & Global Propagation Inspector

Troubleshoot DNS record misconfigurations, audit DNSSEC validity, and verify global propagation across 15+ geographically distributed resolvers.

### Supported Record Types
`A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SOA`, `CAA`, `PTR`, `SRV`.

### Resolution Transports
- **UDP / TCP**: Direct system or authoritative DNS queries.
- **DoH (DNS-over-HTTPS)**: Encrypted DNS queries via Cloudflare (`1.1.1.1`) or Google (`8.8.8.8`).
- **DoT (DNS-over-TLS)**: Encrypted queries over port 853.

### DNSSEC Status Badges
- 🟢 **SECURE**: Validated cryptographic signatures (RRSIG, DNSKEY, DS).
- 🟡 **INSECURE**: Domain does not publish DNSSEC records.
- 🔴 **BOGUS**: Cryptographic signature mismatch or expired validation key.

---

## 6. 📋 WHOIS & RDAP Registry Explorer

Query domain registrars, IP allocation blocks, and abuse reporting contacts.

### Features
- **Modern RDAP (RFC 7480)**: Queries authoritative Regional Internet Registries (RIRs: ARIN, RIPE, APNIC, LACNIC, AFRINIC) via structured HTTPS REST APIs.
- **Automatic Port 43 Fallback**: Queries legacy WHOIS servers when RDAP records are unavailable.
- **Abuse Contacts**: Direct extraction of security and abuse contact email addresses and phone numbers.
- **CIDR Blocks**: Displays the assigned network block and routing authority.

---

## 7. 🔢 CIDR & VLSM Subnet Calculator

Plan and partition IPv4 and IPv6 address spaces with an interactive bitwise binary view.

```
IP Address: 192.168.1.0/24   [Prefix Slider: /24]
Network Bits (24):  11000000.10101000.00000001  (Cyan)
Host Bits (8):      00000000                     (Orange)
====================================================================
Subnet Mask:      255.255.255.0      Usable Hosts: 254
Network Address:  192.168.1.0        First Host:   192.168.1.1
Broadcast Address: 192.168.1.255     Last Host:    192.168.1.254
```

### Capabilities
- **Prefix Slider**: Drag from `/0` to `/32` to immediately see mask changes, usable host counts, and boundary addresses.
- **Bitwise Binary Visualizer**: Displays exact binary representations color-coded by network and host octets.
- **VLSM Planner**: Enter multiple department names and required host counts. NetPulse automatically generates an optimal, non-overlapping subnet partition.

---

## 8. 📡 LAN Device Discovery (ARP Scanner)

Audit local wired Ethernet and Wi-Fi networks to identify active devices, hardware manufacturers, and device types.

### Capabilities
- **Unprivileged ARP/ICMP Sweeps**: Scans local `/24` subnets in seconds without requiring administrative privileges.
- **MAC OUI Vendor Resolution**: Automatically maps MAC address prefixes to manufacturers (Apple, Cisco, Intel, Raspberry Pi, Espressif, Samsung, Dell, HP, etc.).
- **Device Classification**: Tags devices as *Workstation*, *Network Equipment*, *Mobile*, or *IoT*.
- **Quick Vendor Filtering**: Filter discovered hardware by vendor chip or keyword.

---

## 9. 🛡️ Enterprise Multi-Trace & Sentinel Watchdog

Designed for enterprise reliability and proactive site reliability engineering (SRE).

### Multi-Target MTR & Route Diff
- Add multiple destination endpoints to trace simultaneously.
- Detects **BGP route flapping** and **path deviation** when transit routing changes between hops.
- Stores historical routes to compare today's path against baseline historical traces.

### Sentinel Background Watchdog
- Persistent background monitoring daemon for critical default gateways, VPN concentrators, and DNS servers.
- Configurable latency thresholds and packet loss limits.
- Triggers native desktop notifications when link degradation or connection drops occur.

---

## 10. 📑 Diagnostic Audit & Report Export

Export complete diagnostic sessions or individual module findings for ISP tickets, compliance audits, or Wireshark inspection.

### Supported Formats
- **HTML Audit**: Self-contained, styled executive dashboard document with cyber-glassmorphic visuals.
- **RFC 4180 CSV**: Spreadsheet-ready tabular metrics for Excel or Google Sheets.
- **Libpcap 2.4 (PCAP)**: Standard binary packet capture format (`.pcap`) directly ingestible by Wireshark and tcpdump, generated using native Rust without requiring Npcap drivers.
- **Raw JSON**: Machine-readable structured payload strictly conforming to NetPulse Draft-07 schemas.

---

## 11. ⚙️ Workstation Settings & In-App Update Center

Configure workstation preferences, offline intelligence, and software integrity.

### Capabilities & Controls
- **Offline Geolocation Engine**: Toggle offline MaxMind GeoLite2 `.mmdb` database lookups for instant sub-millisecond geolocation without third-party API keys or internet egress.
- **Default DNS Resolver**: Select preferred baseline DNS provider (Cloudflare `1.1.1.1`, Google `8.8.8.8`, Quad9 `9.9.9.9`, or Local System DNS).
- **Default Ping Interval**: Configure standard probe frequencies (500 ms, 1000 ms, 2000 ms).
- **In-App Update Channels**: Switch between `Stable`, `Beta`, and `Canary` release tracks.
- **Cryptographic Trust Anchor Verification**: Updates are cryptographically validated against the official Ed25519 public key (`e3b0c442...`) before installation.
- **Fast Diagnostic Export Triggers**: One-click shortcuts to export current workstation telemetry into HTML, CSV, PCAP, or JSON formats.
