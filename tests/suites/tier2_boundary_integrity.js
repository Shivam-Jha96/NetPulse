import fs from 'node:fs';
import path from 'node:path';
import { Assert } from '../lib/assertions.js';
import { SchemaValidator } from '../lib/schema-validator.js';
import { MarkdownParser } from '../lib/markdown-parser.js';

export async function runTier2Suite(context) {
  const { projectRoot, docsRoot, registerTest } = context;
  const schemasDir = path.join(docsRoot, 'schemas');

  // --------------------------------------------------------------------------
  // 2.1 JSON Schema Syntax & Draft-07 Conformance
  // --------------------------------------------------------------------------
  registerTest('Tier 2: JSON Schemas - Draft-07 Syntax and Structural Conformance', () => {
    Assert.fileExists(schemasDir, `Schemas directory must exist at ${schemasDir}`);

    const schemaFiles = [
      'ip_trace_schema.json',
      'traceroute_schema.json',
      'ping_monitor_schema.json',
      'port_scanner_schema.json',
      'dns_inspector_schema.json',
      'whois_rdap_schema.json',
      'subnet_calculator_schema.json'
    ];

    for (const file of schemaFiles) {
      const filePath = path.join(schemasDir, file);
      Assert.fileExists(filePath, `Schema file ${file} must exist`);

      const raw = fs.readFileSync(filePath, 'utf8');
      const schemaObj = Assert.validJson(raw, `Schema ${file} must be valid JSON`);

      Assert.draft07Schema(schemaObj, `Schema ${file} must adhere to Draft-07 conventions`);
      Assert.equal(schemaObj.type, 'object', `Schema ${file} root type must be "object"`);
      Assert.ok(typeof schemaObj.title === 'string' && schemaObj.title.length > 0, `Schema ${file} must have a title`);
      Assert.ok(schemaObj.properties && typeof schemaObj.properties === 'object', `Schema ${file} must declare properties`);
      Assert.ok(Array.isArray(schemaObj.required) && schemaObj.required.length > 0, `Schema ${file} must declare required properties`);
    }
  });

  // --------------------------------------------------------------------------
  // 2.2 JSON Schema Payload Validation (Positive & Negative Cases)
  // --------------------------------------------------------------------------
  registerTest('Tier 2: JSON Schemas - Positive and Negative Payload Validation', () => {
    // 1. IP Trace Schema Validation
    const ipTracePath = path.join(schemasDir, 'ip_trace_schema.json');
    if (fs.existsSync(ipTracePath)) {
      const schema = JSON.parse(fs.readFileSync(ipTracePath, 'utf8'));
      
      const validPayload = {
        query: '8.8.8.8',
        ip: '8.8.8.8',
        ipVersion: 'IPv4',
        isBogon: false,
        isAnycast: true,
        hostname: 'dns.google',
        location: {
          country: 'United States',
          countryCode: 'US',
          region: 'California',
          regionCode: 'CA',
          city: 'Mountain View',
          postalCode: '94043',
          latitude: 37.4056,
          longitude: -122.0775,
          timezone: 'America/Los_Angeles',
          accuracyRadiusKm: 20
        },
        network: {
          asn: 15169,
          asnOrg: 'Google LLC',
          isp: 'Google LLC',
          cidr: '8.8.8.0/24',
          bgpPrefix: '8.8.8.0/24'
        },
        threat: {
          abuseConfidenceScore: 0,
          totalReports: 0,
          isTorExit: false,
          isProxy: false,
          isDatacenter: true,
          threatLevel: 'CLEAN',
          lastReportedAt: null
        },
        source: 'ONLINE_FAILOVER',
        provider: 'MaxMind GeoLite2',
        responseTimeMs: 12.5,
        timestamp: Date.now()
      };

      Assert.schemaConforms(schema, validPayload, 'Valid IP trace payload should pass schema validation');

      // Negative test: missing required fields or bad type
      const invalidPayload = {
        ip: 12345, // bad type
        version: 'IPv99'
      };
      const negRes = SchemaValidator.validatePayload(schema, invalidPayload);
      Assert.equal(negRes.valid, false, 'Invalid IP trace payload must fail schema validation');
      Assert.ok(negRes.errors.length > 0, 'Should return descriptive error messages');
    }

    // 2. Traceroute Schema Validation
    const traceroutePath = path.join(schemasDir, 'traceroute_schema.json');
    if (fs.existsSync(traceroutePath)) {
      const schema = JSON.parse(fs.readFileSync(traceroutePath, 'utf8'));
      
      const validPayload = {
        target: '8.8.8.8',
        resolvedIp: '8.8.8.8',
        protocol: 'ICMP',
        mode: 'TRACEROUTE',
        maxHops: 30,
        startTime: Date.now(),
        endTime: Date.now() + 500,
        status: 'COMPLETED',
        hops: [
          {
            ttl: 1,
            ip: '192.168.1.1',
            hostname: 'router.local',
            asn: null,
            asnOrg: null,
            country: null,
            countryCode: null,
            city: null,
            latitude: null,
            longitude: null,
            lossPercent: 0,
            sent: 3,
            received: 3,
            rttLast: 0.8,
            rttAvg: 0.8,
            rttBest: 0.7,
            rttWorst: 0.9,
            rttStDev: 0.1
          }
        ]
      };

      Assert.schemaConforms(schema, validPayload, 'Valid Traceroute payload should pass schema validation');

      const invalidPayload = {
        target: '8.8.8.8',
        hops: 'not an array'
      };
      const negRes = SchemaValidator.validatePayload(schema, invalidPayload);
      Assert.equal(negRes.valid, false, 'Invalid Traceroute payload must fail validation');
    }

    // 3. Subnet Calculator Schema Validation
    const subnetPath = path.join(schemasDir, 'subnet_calculator_schema.json');
    if (fs.existsSync(subnetPath)) {
      const schema = JSON.parse(fs.readFileSync(subnetPath, 'utf8'));

      const validPayload = {
        inputIp: '192.168.1.0',
        prefixLength: 24,
        ipVersion: 'IPv4',
        networkAddress: '192.168.1.0',
        broadcastAddress: '192.168.1.255',
        netmask: '255.255.255.0',
        wildcardMask: '0.0.0.255',
        netmaskBinary: '11111111.11111111.11111111.00000000',
        usableRange: {
          firstUsable: '192.168.1.1',
          lastUsable: '192.168.1.254'
        },
        totalHosts: '256',
        usableHosts: '254',
        ipClass: 'C',
        isPrivate: true,
        isLinkLocal: false,
        isMulticast: false
      };

      Assert.schemaConforms(schema, validPayload, 'Valid Subnet calculation payload should pass schema validation');
    }
  });

  // --------------------------------------------------------------------------
  // 2.3 HTML Markup & Structural Integrity
  // --------------------------------------------------------------------------
  registerTest('Tier 2: Mockups HTML - Structural Integrity & Required Elements', () => {
    const htmlPath = path.join(docsRoot, 'mockups/index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    // DOCTYPE and HTML structure
    Assert.match(html, /<!DOCTYPE\s+html>/i, 'Must have valid HTML5 DOCTYPE');
    Assert.match(html, /<html[^>]*lang=["']en["'][^>]*>/i, 'Must specify lang="en"');
    Assert.match(html, /<head>[\s\S]*<\/head>/i, 'Must contain <head>');
    Assert.match(html, /<body>[\s\S]*<\/body>/i, 'Must contain <body>');

    // Required interactive UI components
    const requiredIds = [
      'globalSearchInput',
      'themeToggleBtn',
      'view-dashboard',
      'view-trace',
      'view-utilities',
      'view-settings',
      'worldMapCanvas',
      'activeAdapterLabel'
    ];

    for (const id of requiredIds) {
      Assert.includes(html, `id="${id}"`, `index.html must contain element with id="${id}"`);
    }

    // Check all 7 companion utilities across views (View 2: Trace, View 3: Utilities)
    const utilKeywords = [
      { name: 'Visual Traceroute / MTR', check: html.includes('view-trace') && html.includes('Hop-by-Hop') },
      { name: 'Continuous Ping', check: html.includes('Continuous Ping') },
      { name: 'Port Scanner', check: html.includes('Port Scanner') },
      { name: 'DNS Inspector', check: html.includes('DNS Inspector') },
      { name: 'WHOIS / RDAP', check: html.includes('WHOIS') },
      { name: 'Subnet Calculator', check: html.includes('Subnet Calculator') },
      { name: 'LAN Discovery', check: html.includes('LAN Discovery') }
    ];

    for (const util of utilKeywords) {
      Assert.ok(util.check, `index.html must include utility section/tab for "${util.name}"`);
    }
  });

  // --------------------------------------------------------------------------
  // 2.4 CSS Syntax & Token Integrity
  // --------------------------------------------------------------------------
  registerTest('Tier 2: Mockups CSS - Cyber-Glassmorphic Tokens & Dual Themes', () => {
    const cssPath = path.join(docsRoot, 'mockups/styles.css');
    const css = fs.readFileSync(cssPath, 'utf8');

    // :root CSS variables
    Assert.match(css, /:root\s*\{[\s\S]*\}/, 'styles.css must declare :root variable block');
    Assert.match(css, /--accent-cyan|--color-accent/i, 'Must declare cyan accent variable');
    Assert.match(css, /--status-success|--color-success/i, 'Must declare semantic success variable');
    Assert.match(css, /--status-danger|--color-danger/i, 'Must declare semantic danger variable');
    Assert.match(css, /backdrop-filter/i, 'Must utilize glassmorphism backdrop-filter');

    // Theme rules (dark by default, light toggle)
    Assert.match(css, /\[data-theme=["']light["']\]|\.light-theme/i, 'styles.css must declare light theme overrides');
    Assert.match(css, /@media\s*\([^)]*max-width/i, 'styles.css must declare responsive media query breakpoints');
  });

  // --------------------------------------------------------------------------
  // 2.5 Markdown & Mermaid Diagram Integrity
  // --------------------------------------------------------------------------
  registerTest('Tier 2: Documentation - Markdown Syntax & Mermaid Diagram Validation', () => {
    const docFiles = [
      'feasibility_study.md',
      'ui_specification.md',
      'hld.md',
      'lld.md',
      'implementation_roadmap.md'
    ];

    let totalDiagramsChecked = 0;

    for (const file of docFiles) {
      const filePath = path.join(docsRoot, file);
      if (!fs.existsSync(filePath)) continue;

      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = MarkdownParser.parse(content);

      // Verify code fence balance
      Assert.equal(
        parsed.fencesBalanced,
        true,
        `Markdown file "${file}" has unclosed code fence at line ${parsed.unclosedFenceLine}`
      );

      // Verify Mermaid diagram syntax
      for (const diag of parsed.mermaidDiagrams) {
        totalDiagramsChecked++;
        Assert.equal(
          diag.valid,
          true,
          `In ${file} (line ${diag.startLine}): Mermaid diagram error: ${diag.errors.join(', ')}`
        );
      }
    }

    Assert.ok(totalDiagramsChecked >= 5, `Expected at least 5 Mermaid diagrams across docs, found ${totalDiagramsChecked}`);
  });
}
