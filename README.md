# NetPulse 🌐⚡

> **Next-Generation Cross-Platform Network Diagnostics & IP Geolocation Suite**  
> *Engineered with Tauri v2 (Rust Core + React 19 / TypeScript)*

[![Platform](https://img.shields.io/badge/Platform-Windows%20%7C%20macOS%20%7C%20Linux-blue?style=flat-square)](#)
[![Stack](https://img.shields.io/badge/Stack-Tauri%20v2%20%7C%20Rust%20%7C%20React%2019-teal?style=flat-square)](#)
[![Design](https://img.shields.io/badge/Design-Cyber--Glassmorphic-purple?style=flat-square)](#)
[![Architecture](https://img.shields.io/badge/Docs-HLD%20%26%20LLD%20Complete-success?style=flat-square)](#)
[![Tests](https://img.shields.io/badge/Tests-28%2F28%20Passing%20(100%25)-brightgreen?style=flat-square)](#)

---

## 📖 Overview

**NetPulse** is a standalone, high-performance desktop application for network engineers, cybersecurity analysts, and developers. Originating as a concept expansion of browser-based IP tracing, NetPulse transitions into an unconstrained, zero-elevation desktop powerhouse capable of deep network telemetry, real-time route tracing, and diagnostic scanning.

Built on **Tauri v2** with a native **Rust** backend and a **React 19 / TypeScript** UI, NetPulse delivers sub-35 MB RAM idle usage, snappy native execution, and complete cross-platform compatibility across Windows, macOS, and Linux without requiring administrative privileges or bulky third-party driver installations (such as Npcap OEM).

---

## 🛠️ Companion Utilities Suite

| Utility | Capability | Native Engine |
| :--- | :--- | :--- |
| **🌐 Egress IP & Geo Tracer** | Multi-provider fallback cascade (ipapi, ipinfo, ipify) + Offline MaxMind GeoLite2 `.mmdb` fallback | Rust `reqwest` + `maxminddb` |
| **🗺️ Visual Traceroute / MTR** | Hop-by-hop latency, packet loss %, autonomous system (ASN) mapping & visual route canvas | Native OS ICMP raw sockets (`IcmpSendEcho2` / `IP_RECVERR`) |
| **📈 Live Ping & Jitter Monitor** | 60 FPS real-time sparkline telemetry, min/avg/max/stddev jitter calculation | Native Rust asynchronous loop + 20 Hz IPC batching |
| **🔍 High-Speed Port Scanner** | Configurable common profiles, service banner grabbing, TCP connect & SYN scan modes | Async Tokio socket workers |
| **🔎 DNS & Propagation Inspector** | Direct DNS queries (A, AAAA, MX, NS, TXT, SOA, CNAME, DNSSEC) across 15+ global nodes | Custom UDP/TCP resolver + DoH/DoT |
| **📋 WHOIS & RDAP Registry** | Domain & ASN registrant inspection, abuse contact resolution, CIDR allocation blocks | RDAP REST API + fallback WHOIS port 43 client |
| **🔢 CIDR & VLSM Subnet Calculator** | IPv4/IPv6 mask breakdowns, usable range calculations, bitwise binary display & VLSM planner | High-precision Rust bitwise math |
| **📡 LAN Device Discovery** | Unprivileged ARP/ICMP sweeps, MAC OUI vendor resolution & device classification | Native socket broadcast & OS ARP tables |
| **🛡️ Enterprise Watchdog & Multi-Trace** | Concurrent multi-target path deviation tracing & 24/7 background gateway health monitor | Persistent Tokio daemon + desktop alerts |

---

## 🚀 How to Use the Application

NetPulse can be run as a **native desktop application** (powered by Tauri v2 with native Rust sockets) or in **browser preview mode** (with integrated fallback telemetry for zero-dependency UI testing).

### 1. Prerequisites & Launching

#### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Rust Toolchain**: Stable channel via [rustup.rs](https://rustup.rs/) (required for native desktop execution)
- **OS Build Prerequisites**:
  - **Windows**: Visual Studio C++ Build Tools & Microsoft Edge WebView2
  - **macOS**: Xcode Command Line Tools (`xcode-select --install`)
  - **Linux**: WebKitGTK and build utilities (`sudo apt install libwebkit2gtk-4.1-dev build-essential curl wget libssl-dev libxdo-dev`)

#### Method A: Launch as a Native Desktop App (Recommended)
```bash
# 1. Install frontend dependencies
npm install

# 2. Launch the desktop application with hot reloading
npx @tauri-apps/cli dev
```

To compile a production installer/binary (`.exe`/`.msi` on Windows, `.app`/`.dmg` on macOS, `.deb`/`.AppImage` on Linux):
```bash
npx @tauri-apps/cli build
```
Compiled bundles are located in `src-tauri/target/release/bundle/`.

#### Method B: Launch in Web Preview Mode (No Rust Required)
If you only need to explore the interface or test frontend components without compiling Rust, NetPulse includes a built-in mock telemetry layer:
```bash
npm run dev
```
Navigate to [http://localhost:1420](http://localhost:1420) in your web browser.

#### Method C: Zero-Build HTML5 Prototype
Double-click or open `mockups/index.html` directly in any web browser to test the interactive mock engine.

---

### 2. Workspace Layout & Navigation

- **Frameless Title Bar**:
  - Drag anywhere along the top bar to move the window.
  - View privilege elevation status (e.g. `ROOT` badge when run with administrative rights).
  - Use the **Theme Toggle** (sun/moon icon) to switch between **Cyber-Dark** (OLED glassmorphism) and **Tactical Light** high-contrast themes.
  - Click the **Export** icon (<kbd>Download</kbd>) to generate a diagnostic session audit.
- **Sidebar**: Switch between the 10 diagnostic modules and workstation configuration.
- **Persistent Status Bar**: Displays real-time network interface link status (`UP`/`DOWN`), primary IP/MAC address, memory footprint, and IPC channel health.

---

### 3. Step-by-Step Module Guide

#### 🌐 Dashboard (Primary Egress Gateway)
- **Automatic Gateway Discovery**: On launch, NetPulse automatically resolves your public egress IP, geo coordinates, ISP, and Autonomous System (ASN).
- **Network Classification**: Instantly flags whether your egress address is `PUBLIC ROUTABLE` or a `BOGON / PRIVATE` range (RFC 1918 / CGNAT).
- **Refresh Gateway**: Click the **Refresh Gateway** button to re-poll the multi-provider cascade (ipapi, ipinfo, ipify, or offline MaxMind database).
- **Quick Links**: Jump directly into Traceroute, Ping, or Subnet calculations using the metrics cards.

#### 🗺️ IP Trace & Visual MTR
1. Enter a destination IPv4/IPv6 address or domain (e.g., `1.1.1.1` or `github.com`).
2. Adjust the **Max Hops** slider (1 to 64 hops).
3. Click the **Start Traceroute** (<kbd>▶ Play</kbd>) button.
4. **Tactical Canvas Route Map**: Observe animated geodesic pulses travelling between hops in real time.
5. **Hop Telemetry Table**: Inspect each hop's router IP, reverse DNS hostname, latency (ms), packet loss %, and ASN organization.
6. Click **Stop** (<kbd>■ Square</kbd>) to halt an in-flight trace.

#### 📈 Live Ping & Jitter Monitor
1. Enter the target hostname or IP address.
2. Configure parameters:
   - **Interval (ms)**: Ping frequency (e.g., 500ms or 1000ms).
   - **Packet Size**: ICMP echo payload size in bytes (default: 32 bytes).
   - **DF (Don't Fragment) Bit**: Toggle path MTU discovery testing.
3. Click **Start Ping** to begin streaming continuous ping packets.
4. **60 FPS Sparkline Telemetry**: View real-time latency oscillations on the hardware-accelerated canvas.
5. **Quality Metrics**: Monitor real-time **Min**, **Avg**, **Max** latency, and **Jitter (stddev)** computed at 20 Hz.
6. Click **Reset Samples** to clear the current telemetry buffer.

#### 🔍 High-Speed Port Scanner
1. Enter the target host or IP address.
2. Select a scan profile:
   - **Presets**: *Top 20*, *Top 100*, *Web* (80, 443, 8080), *Database* (3306, 5432, 27017, etc.), *Mail* (25, 110, 143, 993), *Remote/SSH* (22, 3389).
   - **Custom Range**: Enter comma-delimited ports or ranges (e.g. `21-25, 80, 443, 8000-8888`).
3. Set **Concurrency** (worker count) and **Socket Timeout (ms)**.
4. Toggle **Grab Banners** to retrieve application banners (HTTP server headers, SSH versions, etc.).
5. Choose **Scan Mode**: *TCP Connect* (zero-elevation standard socket) or *SYN Stealth* (privileged raw socket).
6. Click **Run Scan** and view the categorized results for **Open**, **Closed**, and **Filtered** ports.

#### 🔎 DNS & Propagation Inspector
1. Enter the domain name to inspect (e.g., `cloudflare.com`).
2. Select the record type: `A`, `AAAA`, `CNAME`, `MX`, `TXT`, `NS`, `SOA`, `CAA`, `PTR`, or `SRV`.
3. Choose the resolution transport:
   - **UDP / TCP**: Standard system or direct authoritative query.
   - **DoH**: DNS-over-HTTPS (encrypted via Cloudflare or Google).
   - **DoT**: DNS-over-TLS.
4. Click **Resolve DNS** to view:
   - Detailed record values, TTLs, and response timings.
   - **DNSSEC Validation**: Cryptographic signature verification status (`SECURE`, `INSECURE`, or `BOGUS`).
   - **Global Propagation Checker**: Live validation percentage across 15+ global resolver nodes.

#### 📋 WHOIS & RDAP Registry
1. Enter a domain name, IP address, or Autonomous System number (`AS13335`) into the query field, or click any **Quick Chip** (`1.1.1.1`, `cloudflare.com`, etc.).
2. Click **Inspect Registry**.
3. View structured RDAP registration records:
   - **Registrant & Registrar**: Organization names, registry handles, creation and expiration dates.
   - **Abuse Contacts**: Direct email addresses and phone numbers for network abuse reporting.
   - **CIDR Blocks**: Allocated IP blocks and Autonomous System delegations.
   - **Raw Registry Text**: Expandable raw WHOIS response for low-level protocol inspection.

#### 🔢 CIDR & VLSM Subnet Calculator
1. Enter an IPv4/IPv6 address with CIDR notation (e.g., `192.168.1.0/24`).
2. Drag the **Prefix Slider** (`/0` to `/32`) to immediately recalculate:
   - Netmask, Wildcard Mask, Network Address, Broadcast Address.
   - Usable Host Range and total usable host count.
   - **Bitwise Binary View**: Visual color-coded separation between network bits and host bits.
3. **VLSM Subnet Planner**:
   - Add required subnets with custom names and host requirements (e.g., "Engineering - 60 hosts", "Servers - 12 hosts").
   - Click **Calculate VLSM** to generate non-overlapping, optimized variable-length subnets.

#### 📡 LAN Device Discovery (ARP Scanner)
1. Select the local network interface from the dropdown list.
2. Click **Scan Network** to initiate an unprivileged ARP/ICMP sweep across the local subnet.
3. Inspect discovered local devices:
   - IP address and MAC (Hardware) address.
   - **OUI Vendor Resolution**: Automatic manufacturer identification (Apple, Cisco, Intel, Raspberry Pi, etc.).
   - Classification badges: *Network Equipment*, *Workstation*, *Mobile*, *IoT*.
   - Filter by vendor name or device type for fast audits.

#### 🛡️ Enterprise Workstation Modules
- **Multi-Target MTR**: Add multiple target endpoints to simultaneously trace path changes and detect cross-path routing anomalies, upstream transit failures, and BGP route flapping.
- **Sentinel Watchdog**: Background continuous monitoring daemon for critical gateways and servers. Set latency thresholds and packet loss limits to trigger desktop notifications when anomalies occur.

#### 📑 Generating Diagnostic Audit Reports
1. Click the **Export Report** button in the top titlebar (or within Settings).
2. Choose your desired export scope:
   - *Full Workstation Audit* (all diagnostic modules)
   - *Active Module Only* (Traceroute, Ping, Port Scan, DNS, or Subnet)
3. Select the file format: **JSON** (machine-readable), **CSV** (tabular metrics), or **Markdown** (executive formatted summary).
4. Save the diagnostic log file to your local drive.

---

### 4. Global Keyboard Shortcuts

| Shortcut | Scope | Action |
|:---|:---|:---|
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>K</kbd> | Global | Focus global search & quick trace bar |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>1</kbd> | Global | Switch to **Dashboard** |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>2</kbd> | Global | Switch to **IP Trace & MTR** |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>3</kbd> | Global | Switch to **Ping Monitor** |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>4</kbd> | Global | Switch to **Subnet & VLSM Calculator** |
| <kbd>Ctrl</kbd> / <kbd>Cmd</kbd> + <kbd>R</kbd> | Global | Refresh current view telemetry / re-poll gateway |
| <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>T</kbd> | Global | Toggle **Cyber-Dark** / **Tactical-Light** visual theme |
| <kbd>Escape</kbd> | Global | Close active modal dialog or clear current search |

---

## 🏛️ System Architecture

```
┌────────────────────────────────────────────────────────────────────────┐
│                        NetPulse Frontend (React 19)                    │
│    Cyber-Glassmorphism UI • Canvas Route Map • 60 FPS Sparklines       │
│    Zustand State Stores • 20 Hz Micro-Batched IPC Listener             │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Tauri v2 IPC Bridge
┌────────────────────────────────────▼───────────────────────────────────┐
│                        NetPulse Rust Core Engine                       │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌───────────────┐  │
│  │ Egress & Geo Service │  │ Traceroute & Ping   │  │ Port Scanner  │  │
│  │ (Failover + MaxMind) │  │ (Zero-Elevation OS) │  │ (Tokio Async) │  │
│  └──────────────────────┘  └─────────────────────┘  └───────────────┘  │
│  ┌──────────────────────┐  ┌─────────────────────┐  ┌───────────────┐  │
│  │ DNS / RDAP Inspector │  │ Subnet Calculator   │  │ Local SQLite  │  │
│  │ (DNSSEC / DoH)       │  │ (Bitwise Math)      │  │ (History/Logs)│  │
│  └──────────────────────┘  └─────────────────────┘  └───────────────┘  │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │ Native OS System Sockets
                  ┌──────────────────┴──────────────────┐
                  ▼                                     ▼
        Windows / macOS / Linux             Remote Networks & APIs
```

---

## 📁 Repository Structure

```
NetPulse/
├── src/                           # React 19 / TypeScript cyber-glassmorphic frontend
│   ├── components/                # Diagnostic modules (Dashboard, Trace, Ping, PortScan, DNS, WHOIS, Subnet, LAN)
│   ├── stores/                    # Zustand reactive state stores
│   ├── api/                       # Tauri v2 IPC bridge & browser fallback layer
│   └── styles/                    # Glassmorphism CSS & design system tokens
├── src-tauri/                     # Tauri v2 native Rust core engine
│   ├── src/                       # Rust commands, network socket handlers & IPC routes
│   ├── Cargo.toml                 # Rust dependencies & crate configuration
│   └── tauri.conf.json            # Desktop window configuration & capabilities
├── docs/                          # Architecture, feasibility, HLD, LLD & roadmap specs
│   ├── feasibility_study.md       # Framework evaluation (Tauri v2 vs Electron vs Flutter vs Wails)
│   ├── hld.md                     # High-Level Design: System boundaries, architecture & security
│   ├── lld.md                     # Low-Level Design: Rust traits, TS stores, error taxonomy
│   ├── implementation_roadmap.md  # 32-week phased roadmap across 4 milestones (98 WBS packages)
│   ├── ui_specification.md        # Design tokens, color palette, typography & layout hierarchy
│   ├── mockups/                   # Web-based interactive prototype (HTML5/CSS3/ES6)
│   └── schemas/                   # 7 Draft-07 JSON schemas for IPC commands & data models
├── mockups/                       # Top-level standalone prototype directory
│   ├── index.html                 # Interactive prototype entrypoint
│   ├── styles.css                 # Cyber-glassmorphism CSS stylesheet
│   └── app.js                     # Reactive prototype JavaScript engine
├── schemas/                       # Top-level JSON data schemas
├── tests/                         # Automated 4-tier acceptance test suite
│   ├── runner.js                  # Automated test runner
│   ├── lib/                       # Test assertions, markdown & schema validators
│   └── suites/                    # Tier 1 to Tier 4 test suites
└── PROJECT.md                     # Feature inventory, milestone definitions & IPC contracts
```

---

## 🧪 Testing & Verification

NetPulse features a comprehensive 4-tier automated test suite verifying feature completeness, schema conformance, cross-module contract alignment, and acceptance criteria:

```bash
# Run all 4 test tiers
node tests/runner.js

# Run specific tier
node tests/runner.js --tier=1,2
```

---

## 🎨 Interactive Prototype

You can immediately explore the interactive cyber-glassmorphic prototype in any web browser:

1. Open `mockups/index.html` in your browser.
2. Experience tab switching across **Dashboard**, **IP Trace**, **Utilities**, and **Settings**.
3. Toggle between **Dark** and **Light** themes.
4. Test interactive simulations for **IP route mapping**, **live ping sparklines**, and the **CIDR subnet calculator**.

---

## 🗺️ Implementation Roadmap

* **Milestone 1: Core MVP (Weeks 1–8)** — Tauri v2 desktop shell, Rust IP geolocation cascade with offline MMDB, interactive Canvas route map, history storage.
* **Milestone 2: Diagnostic Utilities (Weeks 9–16)** — Continuous Ping monitor with 60 FPS sparkline telemetry, unprivileged visual Traceroute/MTR, comprehensive DNS resolver.
* **Milestone 3: Advanced Network Tools (Weeks 17–24)** — High-speed Port Scanner, WHOIS/RDAP client, CIDR/VLSM Subnet calculator.
* **Milestone 4: Enterprise Hardening & Release (Weeks 25–32)** — Automated CI/CD signing (Windows Authenticode, macOS Notarization, Linux AppImage/deb), threat intelligence badge integration, security audit.
