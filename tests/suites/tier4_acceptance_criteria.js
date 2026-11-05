import fs from 'node:fs';
import path from 'node:path';
import { Assert } from '../lib/assertions.js';
import { MarkdownParser } from '../lib/markdown-parser.js';

export async function runTier4Suite(context) {
  const { projectRoot, docsRoot, registerTest } = context;

  // --------------------------------------------------------------------------
  // AC 1: Feasibility Study Framework Evaluation & Trade-off Matrix
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - Feasibility Multi-Framework Trade-Off Matrix', () => {
    const fsPath = path.join(docsRoot, 'feasibility_study.md');
    Assert.fileExists(fsPath, 'Feasibility study must be present');
    const content = fs.readFileSync(fsPath, 'utf8');

    // Concrete criteria evaluation from ORIGINAL_REQUEST.md
    const criteriaMatchers = [
      { name: 'binary size / footprint', regex: /binary.*(size|footprint)|installer.*size/i },
      { name: 'OS integration / networking', regex: /OS.*(integration|networking|sockets)/i },
      { name: 'performance / memory', regex: /performance|latency|memory consumption/i },
      { name: 'developer velocity', regex: /developer velocity/i }
    ];

    for (const c of criteriaMatchers) {
      Assert.match(content, c.regex, `Feasibility study must evaluate concrete criterion: "${c.name}"`);
    }

    Assert.match(content, /trade-off/i, 'Must have trade-off matrix');
    Assert.match(content, /Tauri v2/i, 'Must present a clear recommendation');
  });

  // --------------------------------------------------------------------------
  // AC 2: Feasibility Study Evaluates >= 4 Network Utilities
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - Research Evaluates >= 4 Companion Utilities', () => {
    const fsPath = path.join(docsRoot, 'feasibility_study.md');
    const content = fs.readFileSync(fsPath, 'utf8');

    const utilities = [
      'Traceroute',
      'Ping',
      'Port Scan',
      'DNS',
      'WHOIS',
      'Subnet',
      'LAN'
    ];

    let foundCount = 0;
    for (const u of utilities) {
      if (new RegExp(u, 'i').test(content)) {
        foundCount++;
      }
    }

    Assert.ok(foundCount >= 4, `Expected at least 4 network utilities evaluated, found ${foundCount}`);
  });

  // --------------------------------------------------------------------------
  // AC 3: Phased Implementation Plan with Dependencies & Risks
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - Implementation Plan MVP to Production with Risks', () => {
    const roadmapPath = path.join(docsRoot, 'implementation_roadmap.md');
    Assert.fileExists(roadmapPath, 'Implementation roadmap must be present');
    const content = fs.readFileSync(roadmapPath, 'utf8');

    Assert.match(content, /milestone|phase/i, 'Must define phased milestones');
    Assert.match(content, /MVP/i, 'Must define MVP milestone');
    Assert.match(content, /production|release|GA/i, 'Must define production release milestone');
    Assert.match(content, /dependency|dependencies/i, 'Must define explicit task dependencies');
    Assert.match(content, /risk.*mitigation|mitigations/i, 'Must provide risk mitigations');
  });

  // --------------------------------------------------------------------------
  // AC 4: Interactive Web-Based Mockup / Prototype Views
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - Interactive Mockup Views (Dashboard, Trace, Utilities, Config)', () => {
    const indexPath = path.join(docsRoot, 'mockups/index.html');
    Assert.fileExists(indexPath, 'mockups/index.html must exist');
    const html = fs.readFileSync(indexPath, 'utf8');

    Assert.includes(html, 'id="view-dashboard"', 'Must implement Dashboard view');
    Assert.includes(html, 'id="view-trace"', 'Must implement IP Trace detail view');
    Assert.includes(html, 'id="view-utilities"', 'Must implement Network Utilities view');
    Assert.includes(html, 'id="view-settings"', 'Must implement Configuration/Settings view');
  });

  // --------------------------------------------------------------------------
  // AC 5: UI Specification Tokens, Hierarchy, Responsive Layout
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - UI Specs (Tokens, Typography, Colors, Spacing, Hierarchy)', () => {
    const uiPath = path.join(docsRoot, 'ui_specification.md');
    Assert.fileExists(uiPath, 'ui_specification.md must exist');
    const content = fs.readFileSync(uiPath, 'utf8');

    Assert.match(content, /token/i, 'Must document design tokens');
    Assert.match(content, /typography/i, 'Must document typography tokens');
    Assert.match(content, /color/i, 'Must document color tokens');
    Assert.match(content, /spacing|grid/i, 'Must document spacing system');
    Assert.match(content, /responsive/i, 'Must document responsive layout behavior');
  });

  // --------------------------------------------------------------------------
  // AC 6: HLD Architecture Diagrams, Interactions, Data Flows, Security
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - HLD End-to-End Diagrams, Flows & Security', () => {
    const hldPath = path.join(docsRoot, 'hld.md');
    Assert.fileExists(hldPath, 'hld.md must exist');
    const content = fs.readFileSync(hldPath, 'utf8');

    const parsed = MarkdownParser.parse(content);
    Assert.ok(parsed.mermaidDiagrams.length >= 3, `HLD must include at least 3 Mermaid architecture/sequence diagrams, found ${parsed.mermaidDiagrams.length}`);

    Assert.match(content, /security/i, 'HLD must detail security considerations');
    Assert.match(content, /privacy/i, 'HLD must detail privacy considerations');
    Assert.match(content, /data flow/i, 'HLD must detail data flows');
  });

  // --------------------------------------------------------------------------
  // AC 7: LLD Class Structures, Schemas, API Specs, Error Handling
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - LLD Module Structures, Schemas, API Specs & Error Flows', () => {
    const lldPath = path.join(docsRoot, 'lld.md');
    Assert.fileExists(lldPath, 'lld.md must exist');
    const content = fs.readFileSync(lldPath, 'utf8');

    Assert.match(content, /struct|class|module/i, 'LLD must specify module structures');
    Assert.match(content, /schema/i, 'LLD must reference data schemas');
    Assert.match(content, /IPC|API interface/i, 'LLD must document API interface specifications');
    Assert.match(content, /error.*flow|error handling|taxonomy/i, 'LLD must document concrete error handling flows');
  });

  // --------------------------------------------------------------------------
  // AC 8: All Documents Formatted in Markdown with Standard Mermaid Diagrams in docs/standalone_app/
  // --------------------------------------------------------------------------
  registerTest('Tier 4: Acceptance Criteria - Markdown & Mermaid Formatting in docs/standalone_app/', () => {
    const allExpectedDocs = [
      'feasibility_study.md',
      'ui_specification.md',
      'hld.md',
      'lld.md',
      'implementation_roadmap.md'
    ];

    let totalDiagrams = 0;
    for (const doc of allExpectedDocs) {
      const fullPath = path.join(docsRoot, doc);
      Assert.fileExists(fullPath, `Document ${doc} must exist under docs/standalone_app/`);

      const content = fs.readFileSync(fullPath, 'utf8');
      const parsed = MarkdownParser.parse(content);
      Assert.equal(parsed.fencesBalanced, true, `All code fences in ${doc} must be balanced`);
      totalDiagrams += parsed.mermaidDiagrams.length;
    }

    Assert.ok(totalDiagrams >= 10, `Expected at least 10 Mermaid diagrams across all architectural documents, found ${totalDiagrams}`);
  });
}
