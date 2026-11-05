import fs from 'node:fs';
import path from 'node:path';
import { Assert } from '../lib/assertions.js';

export async function runTier3Suite(context) {
  const { projectRoot, docsRoot, registerTest } = context;

  // --------------------------------------------------------------------------
  // 3.1 IPC Interface Contract Alignment (PROJECT.md vs HLD vs LLD)
  // --------------------------------------------------------------------------
  registerTest('Tier 3: IPC Bridge - Commands Alignment Across PROJECT.md, HLD & LLD', () => {
    const projectMdPath = path.join(projectRoot, '.agents/teamwork/orchestrator/PROJECT.md');
    Assert.fileExists(projectMdPath, 'PROJECT.md must exist in orchestrator folder');

    const projectContent = fs.readFileSync(projectMdPath, 'utf8');
    const hldPath = path.join(docsRoot, 'hld.md');
    const lldPath = path.join(docsRoot, 'lld.md');

    const expectedCommands = [
      'trace_ip',
      'run_traceroute',
      'start_continuous_ping',
      'scan_ports',
      'query_dns',
      'query_whois',
      'calculate_subnet',
      'scan_lan'
    ];

    // Check PROJECT.md declares all 8 IPC commands
    for (const cmd of expectedCommands) {
      Assert.includes(projectContent, cmd, `PROJECT.md must declare command: ${cmd}`);
    }

    // Check HLD documents the corresponding service subsystems
    if (fs.existsSync(hldPath)) {
      const hldContent = fs.readFileSync(hldPath, 'utf8');
      Assert.match(hldContent, /Egress IP & Geo/i, 'HLD must document Egress IP service');
      Assert.match(hldContent, /Traceroute.*MTR/i, 'HLD must document Traceroute / MTR service');
      Assert.match(hldContent, /Ping & Quality Monitor/i, 'HLD must document Ping service');
      Assert.match(hldContent, /Port Scanner/i, 'HLD must document Port Scanner service');
      Assert.match(hldContent, /DNS &.*Inspector/i, 'HLD must document DNS Inspector service');
      Assert.match(hldContent, /WHOIS.*RDAP/i, 'HLD must document WHOIS / RDAP service');
      Assert.match(hldContent, /Subnet.*VLSM/i, 'HLD must document Subnet Calculator service');
      Assert.match(hldContent, /LAN.*Discovery/i, 'HLD must document LAN Discovery service');
    }

    // Check LLD defines exact IPC command handlers/types
    if (fs.existsSync(lldPath)) {
      const lldContent = fs.readFileSync(lldPath, 'utf8');
      for (const cmd of expectedCommands) {
        Assert.includes(lldContent, `'${cmd}'`, `LLD must implement/define contract for command: '${cmd}'`);
      }
    }
  });

  // --------------------------------------------------------------------------
  // 3.2 Real-Time Event Bus Streaming Alignment
  // --------------------------------------------------------------------------
  registerTest('Tier 3: Event Bus - Streaming Event Channels Alignment', () => {
    const lldPath = path.join(docsRoot, 'lld.md');
    Assert.fileExists(lldPath, 'lld.md must exist');
    const lldContent = fs.readFileSync(lldPath, 'utf8');

    const expectedEventChannels = [
      'trace:',
      'ping:',
      'port:',
      'lan:'
    ];

    for (const channel of expectedEventChannels) {
      Assert.includes(lldContent, channel, `LLD must specify streaming event channel prefix: ${channel}`);
    }

    // Check micro-batching frequency (20 Hz / 50ms)
    Assert.match(lldContent, /20 Hz|50\s*ms/i, 'LLD must specify 20 Hz (50 ms) micro-batching telemetry rate');
  });

  // --------------------------------------------------------------------------
  // 3.3 21-Feature Inventory Traceability Matrix
  // --------------------------------------------------------------------------
  registerTest('Tier 3: Traceability - All 21 Features in PROJECT.md Covered in Specs', () => {
    const projectMdPath = path.join(projectRoot, '.agents/teamwork/orchestrator/PROJECT.md');
    const projectContent = fs.readFileSync(projectMdPath, 'utf8');

    // Extract feature lines from PROJECT.md
    const featureLines = projectContent
      .split('\n')
      .filter(l => /^\s*\|\s*\d+\s*\|/.test(l));

    Assert.equal(featureLines.length, 21, `Expected exactly 21 features in PROJECT.md feature inventory, found ${featureLines.length}`);

    // Read all available docs to check aggregate coverage
    const allDocFiles = [
      'feasibility_study.md',
      'ui_specification.md',
      'hld.md',
      'lld.md',
      'implementation_roadmap.md'
    ];

    let combinedDocText = '';
    for (const f of allDocFiles) {
      const p = path.join(docsRoot, f);
      if (fs.existsSync(p)) {
        combinedDocText += ' ' + fs.readFileSync(p, 'utf8');
      }
    }

    // Verify key domain capabilities across all 21 features
    const criticalFeatureConcepts = [
      { id: 1, name: 'Egress IP Tracing & Failover', pattern: /ipapi\.co|ipinfo\.io|MaxMind GeoLite2/i },
      { id: 2, name: 'Bogon & Private IP Filtering', pattern: /RFC 1918|Bogon|private IP/i },
      { id: 3, name: 'Domain/Host DNS Resolution', pattern: /DNS-over-HTTPS|DoH|Cloudflare|Quad9/i },
      { id: 4, name: 'Interactive Route & Geo Map', pattern: /MapLibre|WebGL|geodesic|hop/i },
      { id: 5, name: 'Threat Intel & IP Reputation', pattern: /AbuseIPDB|VirusTotal|Tor exit/i },
      { id: 6, name: 'Cross-Platform Framework Selection', pattern: /Tauri v2.*Electron.*Flutter/i },
      { id: 7, name: 'Zero-Elevation OS Socket Architecture', pattern: /IcmpSendEcho2|IPPROTO_ICMP|unprivileged/i },
      { id: 8, name: 'Privilege Separation Helper Daemon', pattern: /privilege separation|helper daemon/i },
      { id: 9, name: 'Utility 1: Visual Traceroute / MTR', pattern: /Visual Traceroute|MTR/i },
      { id: 10, name: 'Utility 2: Continuous Ping & Quality Monitor', pattern: /Continuous Ping|jitter|RFC 3550/i },
      { id: 11, name: 'Utility 3: Port Scanner & Service Discovery', pattern: /Port Scanner|banner grabbing/i },
      { id: 12, name: 'Utility 4: DNS Inspector & Propagation', pattern: /DNS Inspector|DNSSEC|propagation/i },
      { id: 13, name: 'Utility 5: WHOIS & RDAP Registry Inspector', pattern: /WHOIS|RDAP/i },
      { id: 14, name: 'Utility 6: Subnet / CIDR & VLSM Calculator', pattern: /Subnet|CIDR|VLSM/i },
      { id: 15, name: 'Utility 7: LAN Device Discovery / ARP Scanner', pattern: /LAN Device Discovery|ARP/i },
      { id: 16, name: 'Design System & Token Hierarchy', pattern: /Cyber-glassmorphism|design tokens/i },
      { id: 17, name: 'Interactive Web Mockup / Prototype', pattern: /mockup|prototype|index\.html/i },
      { id: 18, name: 'High-Level Design (HLD) Architecture', pattern: /High-Level Design|HLD/i },
      { id: 19, name: 'Low-Level Design (LLD) Specifications', pattern: /Low-Level Design|LLD/i },
      { id: 20, name: 'JSON Schemas & Data Contracts', pattern: /JSON Schema|Draft-07/i },
      { id: 21, name: 'Phased Implementation Roadmap', pattern: /Roadmap|WBS|milestones/i }
    ];

    for (const fc of criticalFeatureConcepts) {
      Assert.match(combinedDocText, fc.pattern, `Combined design documentation must cover Feature #${fc.id}: "${fc.name}"`);
    }
  });

  // --------------------------------------------------------------------------
  // 3.4 UI View Data Alignment with LLD Schemas
  // --------------------------------------------------------------------------
  registerTest('Tier 3: UI & Schema Alignment - Mockup Data Fields Align with Schemas', () => {
    const htmlPath = path.join(docsRoot, 'mockups/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // UI elements corresponding to schema properties
    const schemaFieldMappings = [
      { elementId: 'asnValue', property: 'asn / organization' },
      { elementId: 'cidrValue', property: 'route / cidr' },
      { elementId: 'threatScoreDisplay', property: 'threatIntelligence.abuseScore' },
      { elementId: 'threatTorFlag', property: 'isTorExit' },
      { elementId: 'threatProxyFlag', property: 'isProxy / isDatacenter' },
      { elementId: 'hopTableTbody', property: 'hops[]' }
    ];

    for (const mapping of schemaFieldMappings) {
      Assert.includes(html, `id="${mapping.elementId}"`, `Mockup HTML must provide element #${mapping.elementId} to render ${mapping.property}`);
    }
  });
}
