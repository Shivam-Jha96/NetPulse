# Getting Started 🚀

> Step-by-step setup guide for installing, running, and compiling NetPulse across Windows, macOS, and Linux.

---

## 💻 System Requirements

NetPulse runs natively on all major desktop operating systems without requiring elevated administrator/root rights or third-party packet sniffing drivers (such as Npcap OEM).

| Operating System | Supported Versions | Prerequisites |
| :--- | :--- | :--- |
| **Windows** | Windows 10 (1809+) & Windows 11 (64-bit / ARM64) | Microsoft Edge WebView2 (preinstalled on modern Windows) |
| **macOS** | macOS 11 Big Sur or later | Apple Silicon (M1/M2/M3/M4) or Intel x86_64 |
| **Linux** | Ubuntu 22.04+, Fedora 38+, Arch, Debian 12+ | WebKitGTK 4.1 (`libwebkit2gtk-4.1-dev`), `curl`, `wget`, `libssl-dev` |

---

## 🛠️ Installation & Execution Methods

Choose the deployment method that fits your environment:

### Method 1: Windows Package Manager (`winget`) — Recommended for Windows

Install NetPulse directly from PowerShell or Command Prompt with a single command:

```bash
winget install Shivam-Jha96.NetPulse
```

NetPulse installs cleanly into the current user scope without requiring administrative UAC prompts. Official manifests are maintained in the repository under [`.winget/manifests/s/Shivam-Jha96/NetPulse/1.0.0/`](https://github.com/Shivam-Jha96/NetPulse/tree/master/.winget/manifests/s/Shivam-Jha96/NetPulse/1.0.0/).

---

### Method 2: Pre-Built Production Installers

Download pre-compiled native installers directly from the [GitHub Releases](https://github.com/Shivam-Jha96/NetPulse/releases) page:

- **Windows**: `NetPulse_1.0.0_x64-setup.exe` (NSIS Wizard Installer, ~4.39 MB)
- **macOS**: `NetPulse_1.0.0_universal.dmg` (Intel & Apple Silicon Drag-and-Drop)
- **Linux**: `NetPulse_1.0.0_amd64.deb` (.deb) or `NetPulse_1.0.0_amd64.AppImage` (.AppImage)

---

### Method 3: Run & Compile from Source (Desktop Dev Mode)

To run or build the fully compiled, high-performance desktop application locally:

#### 1. Prerequisites
- **Node.js**: v20.0.0 or higher (Node 22 recommended)
- **Rust Toolchain**: Stable channel via [rustup.rs](https://rustup.rs/)

#### 2. Install Dependencies & Launch
```bash
# 1. Clone the repository
git clone https://github.com/Shivam-Jha96/NetPulse.git
cd NetPulse

# 2. Install frontend dependencies
npm install

# 3. Launch desktop app with hot-reloading
npm run tauri dev
```

#### 3. Packaging Commercial Production Installers
```bash
# Option 1: Fast NSIS Windows Installer compilation (~4.39 MB)
npm run package

# Option 2: Compile all configured platform bundles
npm run package:all

# Option 3: Full automated build, NSIS packaging & Authenticode signing (PowerShell)
powershell -ExecutionPolicy Bypass -File scripts/package-and-sign.ps1

# (Optional) Generate local development code signing certificate
powershell -ExecutionPolicy Bypass -File scripts/create-dev-cert.ps1
```

Compiled platform-native installers are generated in:
- **Windows**: `src-tauri/target/release/bundle/nsis/NetPulse_1.0.0_x64-setup.exe`
- **macOS**: `src-tauri/target/release/bundle/dmg/`
- **Linux**: `src-tauri/target/release/bundle/deb/` or `bundle/appimage/`

#### 4. Automated Multi-Platform CI/CD Releases
NetPulse includes an automated GitHub Actions release workflow ([`.github/workflows/release.yml`](https://github.com/Shivam-Jha96/NetPulse/blob/master/.github/workflows/release.yml)) that compiles, signs, and publishes release assets for Windows, macOS, and Linux whenever a version tag (`v*`) is pushed.

---

### Method 4: Instant Web Preview Mode (No Rust Required)

If you want to review the interface, test components, or verify design tokens without installing Rust:

```bash
# 1. Install dependencies
npm install

# 2. Start Vite server
npm run dev
```

Open **[http://localhost:1420](http://localhost:1420)** in your browser. NetPulse automatically activates its built-in browser mock telemetry layer (`src/api/ipc.ts`), enabling full exploration of all diagnostic tabs, charts, and calculators.

---

### Method 5: Zero-Build HTML5 Standalone Prototype

NetPulse includes a zero-dependency HTML5/CSS3/ES6 interactive mockup that runs in any modern browser without installing Node.js or Rust:

1. Open the `mockups/` folder in your file explorer.
2. Double-click `index.html` (or drag it into Chrome, Edge, Safari, or Firefox).
3. Test view switching across Dashboard, Traceroute, Utilities, and Settings with full theme toggling and live simulated telemetry.

---

## 🧪 Testing & Quality Verification

NetPulse features a dual-track automated and empirical verification framework:

### 1. Specification & Architecture Test Suite
```bash
# Run all 28 automated acceptance tests across 4 tiers
npm run test:spec
```

```text
======================================================================
   NetPulse Acceptance & Architecture Test Runner
======================================================================
Target Directory: docs
Active Tiers: [1, 2, 3, 4] | Total Tests: 28

--- [TIER 1] Deliverables & Specifications   ✔ 11/11 Passed
--- [TIER 2] Schemas & Markdown Validation   ✔ 5/5 Passed
--- [TIER 3] IPC Bridge & Event Bus Alignment ✔ 4/4 Passed
--- [TIER 4] End-to-End Acceptance Criteria   ✔ 8/8 Passed

✔ ALL 28 ACCEPTANCE TESTS PASSED (100% PASS RATE)
```

### 2. Live Desktop E2E Verification
The release executable (`netpulse.exe`, 17.05 MB) was rigorously audited using a Chrome DevTools Protocol (CDP) WebSocket bridge over port 9222:
- **14 Test Suites**: 100% Executed
- **25 Master Test Cases**: 25 / 25 PASS (100%)
- **10 Chaos & Fuzzing Vectors**: 10 / 10 PASS (100%)
- **2 Concurrency Stress Scenarios**: 2 / 2 PASS (100%)
- **3 User Persona Journeys**: 3 / 3 PASS (100%)
- **Forensic Integrity Verdict**: **CLEAN** (Zero mocks, genuine unprivileged OS sockets)

Detailed execution report: [`docs/E2E_MANUAL_TESTING_REPORT.md`](https://github.com/Shivam-Jha96/NetPulse/blob/master/docs/E2E_MANUAL_TESTING_REPORT.md)
