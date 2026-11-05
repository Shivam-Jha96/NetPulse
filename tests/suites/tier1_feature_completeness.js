import fs from 'node:fs';
import path from 'node:path';
import { Assert } from '../lib/assertions.js';

export async function runTier1Suite(context) {
  const { projectRoot, docsRoot, registerTest } = context;

  // --------------------------------------------------------------------------
  // 1.1 Deliverables Presence & Minimum Byte Thresholds
  // --------------------------------------------------------------------------
  registerTest('Tier 1: Deliverables - Core Specification Documents Exist', () => {
    const requiredDocs = [
      { relPath: 'feasibility_study.md', minSize: 10000, desc: 'Feasibility Study (R1)' },
      { relPath: 'ui_specification.md', minSize: 8000, desc: 'UI Specification (R3)' },
      { relPath: 'hld.md', minSize: 10000, desc: 'High-Level Design (R4)' }
    ];

    for (const doc of requiredDocs) {
      const fullPath = path.join(docsRoot, doc.relPath);
      Assert.fileExists(fullPath, `Expected ${doc.desc} to exist at ${fullPath}`);
      Assert.fileNotEmpty(fullPath, doc.minSize, `Expected ${doc.desc} to exceed ${doc.minSize} bytes`);
    }
  });

  registerTest('Tier 1: Deliverables - LLD & Implementation Roadmap Exist', () => {
    const requiredDocs = [
      { relPath: 'lld.md', minSize: 10000, desc: 'Low-Level Design (R5)' },
      { relPath: 'implementation_roadmap.md', minSize: 5000, desc: 'Implementation Roadmap (R2)' }
    ];

    for (const doc of requiredDocs) {
      const fullPath = path.join(docsRoot, doc.relPath);
      Assert.fileExists(fullPath, `Expected ${doc.desc} to exist at ${fullPath}`);
      Assert.fileNotEmpty(fullPath, doc.minSize, `Expected ${doc.desc} to exceed ${doc.minSize} bytes`);
    }
  });

  registerTest('Tier 1: Deliverables - Interactive Web Mockup Artifacts Exist', () => {
    const mockupFiles = [
      { relPath: 'mockups/index.html', minSize: 15000, desc: 'Interactive Prototype HTML' },
      { relPath: 'mockups/styles.css', minSize: 10000, desc: 'Cyber-Glassmorphism CSS' },
      { relPath: 'mockups/app.js', minSize: 10000, desc: 'Reactive UI Engine JS' }
    ];

    for (const f of mockupFiles) {
      const fullPath = path.join(docsRoot, f.relPath);
      Assert.fileExists(fullPath, `Expected ${f.desc} to exist at ${fullPath}`);
      Assert.fileNotEmpty(fullPath, f.minSize, `Expected ${f.desc} to exceed ${f.minSize} bytes`);
    }
  });

  registerTest('Tier 1: Deliverables - All 7 Formal JSON Schemas Exist', () => {
    const schemasDir = path.join(docsRoot, 'schemas');
    Assert.fileExists(schemasDir, `Schemas directory must exist at ${schemasDir}`);

    const expectedSchemas = [
      'ip_trace_schema.json',
      'traceroute_schema.json',
      'ping_monitor_schema.json',
      'port_scanner_schema.json',
      'dns_inspector_schema.json',
      'whois_rdap_schema.json',
      'subnet_calculator_schema.json'
    ];

    for (const schemaName of expectedSchemas) {
      const schemaPath = path.join(schemasDir, schemaName);
      Assert.fileExists(schemaPath, `Expected schema "${schemaName}" at ${schemaPath}`);
      Assert.fileNotEmpty(schemaPath, 200, `Schema "${schemaName}" must not be empty`);
    }
  });

  // --------------------------------------------------------------------------
  // 1.2 R1: Feasibility Study Completeness
  // --------------------------------------------------------------------------
  registerTest('Tier 1: R1 Feasibility - Evaluates 5 Desktop Frameworks with Trade-Off Matrix', () => {
    const filePath = path.join(docsRoot, 'feasibility_study.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // Frameworks
    const frameworks = ['Tauri', 'Electron', 'Flutter', 'Wails', 'Qt'];
    for (const fw of frameworks) {
      Assert.includes(content, fw, `Feasibility study must evaluate candidate framework: ${fw}`);
    }

    // Trade-off evaluation criteria
    Assert.match(content, /trade-off/i, 'Must contain a trade-off matrix');
    Assert.match(content, /recommendation/i, 'Must contain a framework recommendation');
    Assert.match(content, /Tauri v2/i, 'Must explicitly recommend Tauri v2');
    Assert.match(content, /Npcap/i, 'Must evaluate Windows Npcap licensing constraints');
    Assert.match(content, /IcmpSendEcho2/i, 'Must detail Win32 IcmpSendEcho2 unprivileged API');
    Assert.match(content, /IPPROTO_ICMP/i, 'Must detail Linux/macOS unprivileged socket API');
  });

  registerTest('Tier 1: R1 Feasibility - Researches and Details All 7 Companion Utilities', () => {
    const filePath = path.join(docsRoot, 'feasibility_study.md');
    const content = fs.readFileSync(filePath, 'utf8');

    const utilities = [
      'Visual Traceroute',
      'Continuous Ping',
      'Port Scanner',
      'DNS Inspector',
      'WHOIS',
      'Subnet',
      'LAN Device Discovery'
    ];

    for (const util of utilities) {
      Assert.includes(content, util, `Feasibility study must evaluate utility: ${util}`);
    }
  });

  // --------------------------------------------------------------------------
  // 1.3 R2: Implementation Roadmap Completeness
  // --------------------------------------------------------------------------
  registerTest('Tier 1: R2 Roadmap - Details Phased Milestones, WBS, Effort, and Risks', () => {
    const filePath = path.join(docsRoot, 'implementation_roadmap.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // Phased milestones
    Assert.match(content, /MVP|Phase 1/i, 'Roadmap must include MVP / Phase 1');
    Assert.match(content, /Phase 2|Core/i, 'Roadmap must include Phase 2 / Core');
    Assert.match(content, /Phase 3|Professional/i, 'Roadmap must include Phase 3');
    Assert.match(content, /Phase 4|Enterprise|Release/i, 'Roadmap must include Phase 4');

    // WBS and effort estimation
    Assert.match(content, /WBS|Work Breakdown/i, 'Roadmap must detail Work Breakdown Structure');
    Assert.match(content, /dependency|dependencies/i, 'Roadmap must specify milestone dependency chains');
    Assert.match(content, /risk|mitigation/i, 'Roadmap must specify risk mitigations');
  });

  // --------------------------------------------------------------------------
  // 1.4 R3: UI Specification & Interactive Mockups Completeness
  // --------------------------------------------------------------------------
  registerTest('Tier 1: R3 UI Spec - Defines Design Tokens, Cyber-Glassmorphism & Component Hierarchy', () => {
    const filePath = path.join(docsRoot, 'ui_specification.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // Tokens
    Assert.match(content, /--color-bg|palette|color token/i, 'UI Spec must specify color tokens');
    Assert.match(content, /typography|font/i, 'UI Spec must specify typography tokens');
    Assert.match(content, /Inter|JetBrains Mono/i, 'UI Spec must recommend standard font families');
    Assert.match(content, /glassmorphic|glassmorphism/i, 'UI Spec must document glassmorphic aesthetics');
    Assert.match(content, /dark.*theme|light.*theme/i, 'UI Spec must document both dark and light themes');

    // 4 major views
    Assert.match(content, /Dashboard/i, 'UI Spec must specify Dashboard view');
    Assert.match(content, /Trace|Route/i, 'UI Spec must specify IP Trace view');
    Assert.match(content, /Utilities/i, 'UI Spec must specify Utilities view');
    Assert.match(content, /Settings|Configuration/i, 'UI Spec must specify Settings view');
  });

  registerTest('Tier 1: R3 Mockups - HTML Implements 4 View Containers & Theme Controls', () => {
    const htmlPath = path.join(docsRoot, 'mockups/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // Check 4 view sections
    Assert.includes(html, 'id="view-dashboard"', 'index.html must contain #view-dashboard');
    Assert.includes(html, 'id="view-trace"', 'index.html must contain #view-trace');
    Assert.includes(html, 'id="view-utilities"', 'index.html must contain #view-utilities');
    Assert.includes(html, 'id="view-settings"', 'index.html must contain #view-settings');

    // Theme toggle
    Assert.match(html, /theme.*toggle|themeToggleBtn/i, 'index.html must contain theme toggle control');

    // Link to styles and script
    Assert.match(html, /<link[^>]+href=["']styles\.css["']/i, 'index.html must link styles.css');
    Assert.match(html, /<script[^>]+src=["']app\.js["']/i, 'index.html must load app.js');

    // Verify zero external CDN links (offline readiness)
    const externalCdn = /<script[^>]+src=["']https?:\/\//i.test(html) || /<link[^>]+href=["']https?:\/\//i.test(html);
    Assert.equal(externalCdn, false, 'index.html must not depend on external CDN resources for offline capability');
  });

  // --------------------------------------------------------------------------
  // 1.5 R4: High-Level Design (HLD) Completeness
  // --------------------------------------------------------------------------
  registerTest('Tier 1: R4 HLD - Documents Layered Architecture, Boundaries, Security & Data Flows', () => {
    const filePath = path.join(docsRoot, 'hld.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // System Architecture
    Assert.match(content, /layered|layers/i, 'HLD must describe layered architecture');
    Assert.match(content, /Tauri v2/i, 'HLD must be architected around Tauri v2');
    Assert.match(content, /IPC|bridge/i, 'HLD must describe IPC bridge');
    Assert.match(content, /service boundaries|subsystem/i, 'HLD must define service boundaries');

    // Sequence flows
    Assert.match(content, /sequenceDiagram/i, 'HLD must contain Mermaid sequence diagrams');
    Assert.match(content, /failover/i, 'HLD must detail multi-provider failover');

    // Security & Privacy
    Assert.match(content, /Content Security Policy|CSP/i, 'HLD must define Content Security Policy');
    Assert.match(content, /privilege separation/i, 'HLD must define privilege separation architecture');
    Assert.match(content, /DPAPI|Keychain|Secret Service/i, 'HLD must specify OS secret storage');
  });

  // --------------------------------------------------------------------------
  // 1.6 R5: Low-Level Design (LLD) Completeness
  // --------------------------------------------------------------------------
  registerTest('Tier 1: R5 LLD - Documents Module Structs, IPC Contracts, State & Error Taxonomy', () => {
    const filePath = path.join(docsRoot, 'lld.md');
    const content = fs.readFileSync(filePath, 'utf8');

    // Rust & TypeScript structures
    Assert.match(content, /struct|trait/i, 'LLD must specify Rust structs / traits');
    Assert.match(content, /interface|type/i, 'LLD must specify TypeScript interfaces / types');
    Assert.match(content, /invoke/i, 'LLD must specify Tauri invoke command contracts');

    // State management & errors
    Assert.match(content, /state management|store/i, 'LLD must specify state management pattern');
    Assert.match(content, /error handling|error taxonomy|ErrorCode/i, 'LLD must define error handling taxonomy');
  });
}
