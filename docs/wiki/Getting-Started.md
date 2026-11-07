# Getting Started 🚀

> Step-by-step setup guide for running NetPulse as a native desktop application, web preview, or standalone prototype.

---

## 💻 System Requirements

NetPulse runs on all major desktop operating systems without requiring elevated administrator/root rights or third-party packet sniffing drivers.

| Operating System | Supported Versions | Prerequisites |
| :--- | :--- | :--- |
| **Windows** | Windows 10 (1809+) & Windows 11 (64-bit / ARM64) | Microsoft Edge WebView2 (preinstalled on modern Windows) |
| **macOS** | macOS 11 Big Sur or later | Apple Silicon (M1/M2/M3/M4) or Intel x86_64 |
| **Linux** | Ubuntu 22.04+, Fedora 38+, Arch, Debian 12+ | WebKitGTK 4.1 (`libwebkit2gtk-4.1-dev`), `curl`, `wget`, `libssl-dev` |

---

## 🛠️ Execution Options

Choose the execution method that matches your workflow:

### Option A: Native Desktop Application (Full Power)

This is the recommended deployment mode. It provides direct access to native OS raw and unprivileged ICMP/TCP sockets via compiled Rust.

#### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Rust Toolchain**: Stable channel via [rustup.rs](https://rustup.rs/)

#### 2. Install & Run in Dev Mode
```bash
# Clone the repository
git clone https://github.com/Shivam-Jha96/NetPulse.git
cd NetPulse

# Install frontend dependencies
npm install

# Launch desktop app with hot-reloading
npm run tauri dev
```

#### 3. Compile Production Installers
```bash
npm run tauri build
```
Compiled standalone bundles are output to:
- **Windows**: `src-tauri/target/release/bundle/msi/` or `bundle/nsis/` (`.exe` / `.msi`)
- **macOS**: `src-tauri/target/release/bundle/dmg/` or `bundle/macos/` (`.app` / `.dmg`)
- **Linux**: `src-tauri/target/release/bundle/deb/` or `bundle/appimage/` (`.deb` / `.AppImage`)

---

### Option B: Instant Web Preview Mode (No Rust Required)

If you want to review the interface, test components, or verify design tokens without installing Rust:

```bash
# 1. Install dependencies
npm install

# 2. Start Vite server
npm run dev
```

Open **[http://localhost:1420](http://localhost:1420)** in your browser. NetPulse automatically activates its built-in browser mock telemetry layer (`src/api/ipc.ts`), enabling full exploration of all diagnostic tabs, charts, and calculators.

---

### Option C: Zero-Build HTML5 Standalone Prototype

NetPulse includes a zero-dependency HTML5/CSS3/ES6 interactive mockup that runs in any modern browser without installing Node.js or Rust:

1. Open the `mockups/` folder in your file explorer.
2. Double-click `index.html` (or drag it into Chrome, Edge, Safari, or Firefox).
3. Test view switching across Dashboard, Traceroute, Utilities, and Settings with full theme toggling and live simulated telemetry.

---

## 🧪 Verifying Your Installation

NetPulse includes an automated 4-tier acceptance test suite that verifies system contracts, schemas, UI integrity, and feature deliverables:

```bash
# Run all 28 automated acceptance tests
npm run test:spec
```

Expected output:
```text
======================================================================
   NetPulse E2E Acceptance & Architecture Test Runner
======================================================================
Target Directory: docs
Active Tiers: [1, 2, 3, 4] | Total Tests: 28

✔ ALL 28 ACCEPTANCE TESTS PASSED (100% PASS RATE)
```
