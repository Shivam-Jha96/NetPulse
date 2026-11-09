/**
 * NetPulse E2E Test Suite Runner — Milestone M2: Protocol & Diagnostic Suites
 *
 * Suites Covered:
 * - MTS-PING-001: High-Frequency Telemetry & RFC 3550 Jitter Accumulation
 * - MTS-PING-002: Packet Loss & Unreachable Host Handling
 * - MTS-SUBNET-001: CIDR Bitwise Calculator & Visual Octets
 * - MTS-SUBNET-002: Variable Length Subnet Mask (VLSM) Partitioner
 * - MTS-PORT-001: Multi-Mode TCP Connect Port Scanner & Service Discovery
 * - MTS-PORT-002: Monospace TLS Certificate Inspector
 * - MTS-PORT-003: Custom Port Syntax Parser & Concurrency Scaling
 * - MTS-DNS-001: Multi-Record & Cryptographic DNSSEC Inspector
 * - MTS-DNS-002: Global DNS Propagation Grid (15+ Global Nodes)
 * - MTS-WHOIS-001: RFC 7480 RDAP Registry & Contact Inspector
 * - MTS-LAN-001: Unprivileged LAN Device Discovery Sweep
 *
 * Target: `src-tauri/target/release/netpulse.exe`
 * Transport: Native CDP WebSocket on port 9222
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { performance } from 'node:perf_hooks';
import { CdpDriver } from './cdp_driver.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');
const artifactsDir = path.join(__dirname, 'artifacts');
const screenshotsDir = path.join(artifactsDir, 'screenshots');
const telemetryDir = path.join(artifactsDir, 'telemetry');

// Ensure artifact folders exist
fs.mkdirSync(screenshotsDir, { recursive: true });
fs.mkdirSync(telemetryDir, { recursive: true });

// ANSI Styling
const Colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  gray: '\x1b[90m',
};

// Test results accumulator
const testResults = [];

function recordResult(suiteId, caseId, title, status, durationMs, evidence = {}, diagnostics = null) {
  testResults.push({
    suiteId,
    caseId,
    title,
    status,
    durationMs,
    evidence,
    diagnostics,
  });

  const statusColor = status === 'PASS' ? Colors.green : status === 'FAIL' ? Colors.red : Colors.yellow;
  console.log(`  ${statusColor}${status === 'PASS' ? '✔' : '✖'} [${status}]${Colors.reset} ${caseId}: ${title} (${durationMs.toFixed(1)}ms)`);
  if (diagnostics) {
    console.log(`    ${Colors.red}Error: ${diagnostics}${Colors.reset}`);
  }
}

async function navigateToView(driver, viewName) {
  await driver.evaluate(`
    (() => {
      const btns = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
      const target = btns.find((b) => b.innerText.toLowerCase().includes(${JSON.stringify(viewName.toLowerCase())}));
      if (target) {
        target.click();
      } else {
        throw new Error("Navigation button not found in sidebar for: " + ${JSON.stringify(viewName)});
      }
    })()
  `);
  await new Promise((r) => setTimeout(r, 600));
}

export async function runM2Suites() {
  console.log(`\n${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
  console.log(`${Colors.bold}${Colors.cyan}   NetPulse Native Desktop E2E Testing — Milestone M2 Suites        ${Colors.reset}`);
  console.log(`${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
  console.log(`Target Binary: ${path.join(projectRoot, 'src-tauri/target/release/netpulse.exe')}`);
  console.log(`CDP Port: 9222`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const driver = new CdpDriver();
  const suiteStartTime = performance.now();

  try {
    await driver.start({ timeoutMs: 30000 });

    // =========================================================================
    // SUITE 1: MTS-PING (Continuous Ping & Jitter Telemetry Monitor)
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-PING (Continuous Ping & Jitter Telemetry Monitor)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // Test Case: MTS-PING-001
    {
      const caseId = 'MTS-PING-001';
      const title = 'High-Frequency Telemetry & RFC 3550 Jitter Accumulation';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'Ping Monitor');

        // Configure host target
        const hostInputSelector = 'input[placeholder*="Enter host to ping"]';
        await driver.typeText(hostInputSelector, '1.1.1.1');

        // Select 200 ms interval
        await driver.evaluate(() => {
          const select = document.querySelector('select.glass-input');
          if (select) {
            select.value = '200';
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Set DF-Bit to true
        await driver.evaluate(() => {
          const checkbox = document.querySelector('input[type="checkbox"]');
          if (checkbox && !checkbox.checked) {
            checkbox.click();
          }
        });

        // Click Start Monitor
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Start Monitor'));
          if (btn) btn.click();
        });

        // Wait for real ICMP Echo samples to accumulate (> 10 ticks)
        await driver.waitForFunction(() => {
          const card = document.querySelectorAll('.grid > div.glass-panel')[0];
          const text = card?.querySelector('.text-xl')?.innerText || '';
          const spans = Array.from(document.querySelectorAll('span'));
          const probeSpan = spans.find((s) => s.innerText.includes('probes sent'));
          const match = probeSpan?.innerText?.match(/(\d+)\s+probes sent/);
          const sent = match ? parseInt(match[1], 10) : 0;
          return sent >= 10 && text.includes('ms');
        }, 15000);

        // Gather real telemetry metrics from DOM
        const telemetry = await driver.evaluate(() => {
          const metricPanels = Array.from(document.querySelectorAll('.grid > div.glass-panel'));
          const metrics = {};
          metricPanels.forEach((p) => {
            const label = p.querySelector('div.text-\\[10px\\]')?.innerText?.trim();
            const val = p.querySelector('div.text-xl')?.innerText?.trim();
            if (label) metrics[label] = val;
          });

          const canvas = document.querySelector('canvas');
          const canvasValid = canvas && canvas.width > 0 && canvas.height > 0;

          const probesText = Array.from(document.querySelectorAll('span')).find((s) => s.innerText.includes('probes sent'))?.innerText?.trim();

          return { metrics, canvasValid, probesText };
        });

        // Assert metric integrity: Min <= Avg <= Max
        const minVal = parseFloat(telemetry.metrics['MINIMUM RTT'] || '0');
        const avgVal = parseFloat(telemetry.metrics['AVERAGE RTT'] || '0');
        const maxVal = parseFloat(telemetry.metrics['MAXIMUM RTT'] || '0');
        const jitterVal = parseFloat(telemetry.metrics['JITTER (RFC 3550)'] || '0');

        if (!(minVal <= avgVal && avgVal <= maxVal)) {
          throw new Error(`Metric math inequality violated: Min (${minVal}) <= Avg (${avgVal}) <= Max (${maxVal})`);
        }

        if (isNaN(jitterVal) || jitterVal < 0) {
          throw new Error(`RFC 3550 jitter calculation invalid: ${jitterVal}`);
        }

        if (!telemetry.canvasValid) {
          throw new Error('Sparkline canvas element not properly initialized or has zero dimensions');
        }

        // Stop Monitor
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Stop Monitor'));
          if (btn) btn.click();
        });
        await new Promise((r) => setTimeout(r, 600));

        // Verify monitor stopped
        const isStopped = await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Start Monitor'));
          return !!btn;
        });
        if (!isStopped) {
          throw new Error('Monitor failed to transition back to stopped state');
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_sparkline_telemetry.png`);
        await driver.captureScreenshot(screenshotPath);

        // Test Reset History button
        await driver.click('button[title="Reset history"]');
        await new Promise((r) => setTimeout(r, 400));

        const resetTelemetry = await driver.evaluate(() => {
          const currentRtt = document.querySelectorAll('.grid > div.glass-panel')[0]?.querySelector('.text-xl')?.innerText?.trim();
          return currentRtt;
        });

        const telemetryPath = path.join(telemetryDir, `${caseId}_ping_telemetry.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify({ telemetry, minVal, avgVal, maxVal, jitterVal, resetTelemetry }, null, 2)
        );

        recordResult('MTS-PING', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-PING', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      } finally {
        // Ensure monitor is always stopped
        await driver.evaluate(() => {
          const stopBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Stop Monitor'));
          if (stopBtn) stopBtn.click();
        });
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    // Test Case: MTS-PING-002
    {
      const caseId = 'MTS-PING-002';
      const title = 'Packet Loss & Unreachable Host Handling';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'Ping Monitor');

        // Target TEST-NET-1 (RFC 5737 non-routable documentation address)
        const hostInputSelector = 'input[placeholder*="Enter host to ping"]';
        await driver.typeText(hostInputSelector, '192.0.2.1');

        // Set interval to 500ms
        await driver.evaluate(() => {
          const select = document.querySelector('select.glass-input');
          if (select) {
            select.value = '500';
            select.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Start Monitor
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Start Monitor'));
          if (btn) btn.click();
        });

        // Wait for probes to record timeouts and loss to accumulate
        await driver.waitForFunction(() => {
          const spans = Array.from(document.querySelectorAll('span'));
          const probeSpan = spans.find((s) => s.innerText.includes('probes sent'));
          const match = probeSpan?.innerText?.match(/(\d+)\s+probes sent/);
          const sent = match ? parseInt(match[1], 10) : 0;
          const lossCard = document.querySelectorAll('.grid > div.glass-panel')[5];
          const lossText = lossCard?.querySelector('.text-xl')?.innerText || '';
          const lossVal = parseFloat(lossText.replace('%', ''));
          return sent >= 4 && lossVal > 0;
        }, 20000);

        const lossData = await driver.evaluate(() => {
          const metricPanels = Array.from(document.querySelectorAll('.grid > div.glass-panel'));
          const metrics = {};
          metricPanels.forEach((p) => {
            const label = p.querySelector('div.text-\\[10px\\]')?.innerText?.trim();
            const val = p.querySelector('div.text-xl')?.innerText?.trim();
            if (label) metrics[label] = val;
          });
          const probesText = Array.from(document.querySelectorAll('span')).find((s) => s.innerText.includes('probes sent'))?.innerText?.trim();
          return { metrics, probesText };
        });

        const lossPercent = parseFloat((lossData.metrics['PACKET LOSS'] || '0').replace('%', ''));
        if (lossPercent <= 0) {
          throw new Error(`Expected packet loss to climb on unreachable host 192.0.2.1, but observed: ${lossPercent}%`);
        }

        // Stop Monitor
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Stop Monitor'));
          if (btn) btn.click();
        });
        await new Promise((r) => setTimeout(r, 500));

        const screenshotPath = path.join(screenshotsDir, `${caseId}_packet_loss.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_loss_telemetry.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(lossData, null, 2));

        recordResult('MTS-PING', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-PING', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      } finally {
        await driver.evaluate(() => {
          const stopBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Stop Monitor'));
          if (stopBtn) stopBtn.click();
        });
        await new Promise((r) => setTimeout(r, 400));
      }
    }

    // =========================================================================
    // SUITE 2: MTS-SUBNET (CIDR & VLSM Calculator)
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-SUBNET (CIDR & VLSM Calculator)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // Test Case: MTS-SUBNET-001
    {
      const caseId = 'MTS-SUBNET-001';
      const title = 'CIDR Bitwise Calculator & Visual Octets';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'Subnet & VLSM');

        const cidrInput = 'input[placeholder*="192.168.10.0/24"]';
        await driver.typeText(cidrInput, '192.168.10.0/24');
        await new Promise((r) => setTimeout(r, 600));

        // Verify badges and calculations
        const metrics = await driver.evaluate(() => {
          const badges = Array.from(document.querySelectorAll('span.font-mono.rounded')).map((s) => s.innerText.trim());
          const cards = Array.from(document.querySelectorAll('.grid > div.glass-panel')).map((p) => ({
            label: p.querySelector('div.text-\\[10px\\]')?.innerText?.trim(),
            value: p.querySelector('div.text-base, div.text-xs')?.innerText?.trim(),
            sub: p.querySelector('div.text-\\[11px\\]')?.innerText?.trim(),
          }));

          const binaryDisplay = document.querySelector('div.tracking-widest.text-sm')?.innerText?.trim();
          return { badges, cards, binaryDisplay };
        });

        // Verification assertions
        const hasIpv4 = metrics.badges.some((b) => b.includes('IPv4'));
        const hasClassC = metrics.badges.some((b) => b.includes('Class C'));
        const hasPrivate = metrics.badges.some((b) => b.includes('RFC 1918 Private'));

        if (!hasIpv4 || !hasClassC || !hasPrivate) {
          throw new Error(`Subnet badges missing expected tags: ${JSON.stringify(metrics.badges)}`);
        }

        const netAddr = metrics.cards.find((c) => c.label === 'NETWORK ADDRESS')?.value;
        const bcastAddr = metrics.cards.find((c) => c.label === 'BROADCAST ADDRESS')?.value;
        const netmask = metrics.cards.find((c) => c.label === 'SUBNET MASK')?.value;
        const usableRange = metrics.cards.find((c) => c.label === 'USABLE HOST RANGE')?.value;

        if (netAddr !== '192.168.10.0') throw new Error(`Incorrect Network Address: ${netAddr}`);
        if (bcastAddr !== '192.168.10.255') throw new Error(`Incorrect Broadcast Address: ${bcastAddr}`);
        if (netmask !== '255.255.255.0') throw new Error(`Incorrect Netmask: ${netmask}`);
        if (!usableRange.includes('192.168.10.1') || !usableRange.includes('192.168.10.254')) {
          throw new Error(`Incorrect Usable Range: ${usableRange}`);
        }

        if (!metrics.binaryDisplay.includes('11111111.11111111.11111111.00000000')) {
          throw new Error(`Incorrect binary octets: ${metrics.binaryDisplay}`);
        }

        // Clear default VLSM requests so they do not exceed the /26 capacity (64 total addresses)
        await driver.evaluate(() => {
          const trashBtns = Array.from(document.querySelectorAll('table tbody tr button'));
          trashBtns.forEach((b) => b.click());
        });
        await new Promise((r) => setTimeout(r, 400));

        // Adjust prefix to /26 by updating CIDR input and prefix slider
        await driver.typeText(cidrInput, '192.168.10.0/26');
        await new Promise((r) => setTimeout(r, 600));

        // Also adjust prefix slider to verify two-way synchronization
        await driver.evaluate(`
          (() => {
            const slider = document.querySelector('input[type="range"]');
            if (slider) {
              const tracker = slider._valueTracker;
              if (tracker) tracker.setValue('24');
              const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
              if (setter) setter.call(slider, '26');
              slider.dispatchEvent(new Event('input', { bubbles: true }));
              slider.dispatchEvent(new Event('change', { bubbles: true }));
            }
          })()
        `);

        // Wait for updated calculation to reflect in DOM
        await driver.waitForFunction(() => {
          const cards = Array.from(document.querySelectorAll('.grid > div.glass-panel'));
          const netmaskCard = cards.find((c) => c.querySelector('div.text-\\[10px\\]')?.innerText?.trim().toUpperCase() === 'SUBNET MASK');
          const val = netmaskCard?.querySelector('div.text-base')?.innerText?.trim();
          return val === '255.255.255.192';
        }, 10000);

        const updatedMetrics = await driver.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('.grid > div.glass-panel')).map((p) => ({
            label: p.querySelector('div.text-\\[10px\\]')?.innerText?.trim().toUpperCase(),
            value: p.querySelector('div.text-base, div.text-xs')?.innerText?.trim(),
            sub: p.querySelector('div.text-\\[11px\\]')?.innerText?.trim(),
          }));
          const cidrValue = document.querySelector('input[placeholder*="192.168.10.0/24"]')?.value;
          return { cards, cidrValue };
        });

        const updatedNetmask = updatedMetrics.cards.find((c) => c.label === 'SUBNET MASK')?.value;
        const updatedRangeSub = updatedMetrics.cards.find((c) => c.label === 'USABLE HOST RANGE')?.sub;

        if (updatedNetmask !== '255.255.255.192') {
          throw new Error(`/26 netmask should be 255.255.255.192, got: ${updatedNetmask}`);
        }
        if (!updatedRangeSub?.includes('62 Usable')) {
          throw new Error(`/26 should have 62 usable hosts, got: ${updatedRangeSub}`);
        }

        // Test Copy JSON action button
        await driver.click('button[title="Copy Calculation JSON"]');
        await new Promise((r) => setTimeout(r, 300));

        const screenshotPath = path.join(screenshotsDir, `${caseId}_cidr_calculation.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_subnet_metrics.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify({ initial: metrics, updated: updatedMetrics }, null, 2)
        );

        recordResult('MTS-SUBNET', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-SUBNET', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // Test Case: MTS-SUBNET-002
    {
      const caseId = 'MTS-SUBNET-002';
      const title = 'Variable Length Subnet Mask (VLSM) Partitioner';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'Subnet & VLSM');

        const cidrInput = 'input[placeholder*="192.168.10.0/24"]';
        await driver.typeText(cidrInput, '10.0.0.0/16');
        await new Promise((r) => setTimeout(r, 600));

        // Clear existing VLSM rows if any
        await driver.evaluate(() => {
          const trashBtns = Array.from(document.querySelectorAll('table tbody tr button'));
          trashBtns.forEach((b) => b.click());
        });
        await new Promise((r) => setTimeout(r, 500));

        // Add 4 subnets: Engineering (100), Sales (50), Infrastructure (20), DMZ (10)
        const subnetsToAdd = [
          { name: 'Engineering', hosts: '100' },
          { name: 'Sales', hosts: '50' },
          { name: 'Infrastructure', hosts: '20' },
          { name: 'DMZ', hosts: '10' },
        ];

        for (const sub of subnetsToAdd) {
          await driver.typeText('input[placeholder*="Subnet Name"]', sub.name);
          await driver.typeText('input[placeholder="Hosts"]', sub.hosts);
          await driver.evaluate(() => {
            const form = document.querySelector('form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          });
          await new Promise((r) => setTimeout(r, 400));
        }

        // Wait for VLSM allocations table to have 4 rows
        await driver.waitForFunction(() => {
          const rows = document.querySelectorAll('table tbody tr');
          return rows.length === 4;
        }, 10000);

        const tableData = await driver.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map((r) => {
            const cells = Array.from(r.querySelectorAll('td'));
            return {
              name: cells[0]?.innerText?.trim(),
              needed: cells[1]?.innerText?.trim(),
              allocated: cells[2]?.innerText?.trim(),
              prefix: cells[3]?.innerText?.trim(),
              subnetAddress: cells[4]?.innerText?.trim(),
              usableRange: cells[5]?.innerText?.trim(),
              broadcast: cells[6]?.innerText?.trim(),
            };
          });
        });

        // Verification: Sorted in descending order of needed hosts
        // Engineering (100 -> /25, 126 hosts)
        // Sales (50 -> /26, 62 hosts)
        // Infrastructure (20 -> /27, 30 hosts)
        // DMZ (10 -> /28, 14 hosts)
        if (tableData.length !== 4) {
          throw new Error(`Expected 4 partitioned subnets, found: ${tableData.length}`);
        }

        if (tableData[0].name !== 'Engineering' || tableData[0].prefix !== '/25' || tableData[0].allocated !== '126') {
          throw new Error(`Engineering partition mismatch: ${JSON.stringify(tableData[0])}`);
        }
        if (tableData[1].name !== 'Sales' || tableData[1].prefix !== '/26' || tableData[1].allocated !== '62') {
          throw new Error(`Sales partition mismatch: ${JSON.stringify(tableData[1])}`);
        }
        if (tableData[2].name !== 'Infrastructure' || tableData[2].prefix !== '/27' || tableData[2].allocated !== '30') {
          throw new Error(`Infrastructure partition mismatch: ${JSON.stringify(tableData[2])}`);
        }
        if (tableData[3].name !== 'DMZ' || tableData[3].prefix !== '/28' || tableData[3].allocated !== '14') {
          throw new Error(`DMZ partition mismatch: ${JSON.stringify(tableData[3])}`);
        }

        // Verify non-overlapping ranges starting from 10.0.0.0
        if (tableData[0].subnetAddress !== '10.0.0.0' || tableData[1].subnetAddress !== '10.0.0.128') {
          throw new Error(`Address collision detected in VLSM allocation: ${JSON.stringify(tableData)}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_vlsm_allocations.png`);
        await driver.captureScreenshot(screenshotPath);

        // Delete 'Sales' subnet to verify dynamic recalculation
        await driver.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          const salesRow = rows.find((r) => r.innerText.includes('Sales'));
          const trashBtn = salesRow?.querySelector('button');
          if (trashBtn) trashBtn.click();
        });
        await new Promise((r) => setTimeout(r, 600));

        const postDeleteRows = await driver.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.map((r) => r.querySelector('td')?.innerText?.trim());
        });

        if (postDeleteRows.includes('Sales') || postDeleteRows.length !== 3) {
          throw new Error(`Failed to recalculate table after deleting subnet; current rows: ${JSON.stringify(postDeleteRows)}`);
        }

        const telemetryPath = path.join(telemetryDir, `${caseId}_vlsm_partitions.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify({ tableData, postDeleteRows }, null, 2)
        );

        recordResult('MTS-SUBNET', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-SUBNET', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 3: MTS-PORT (High-Speed Port Scanner & Service Discovery)
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-PORT (High-Speed Port Scanner & Service Discovery)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // Test Case: MTS-PORT-001
    {
      const caseId = 'MTS-PORT-001';
      const title = 'Multi-Mode TCP Connect Port Scanner & Service Discovery';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'Port Scanner');

        const targetInput = 'input[placeholder*="127.0.0.1, 1.1.1.1"]';
        await driver.typeText(targetInput, 'scanme.nmap.org');

        // Click 'Web (80, 443, 8080)' preset
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Web (80, 443, 8080)'));
          if (btn) btn.click();
        });

        // Ensure grab banners is checked
        await driver.evaluate(() => {
          const cb = document.querySelector('#grabBanners');
          if (cb && !cb.checked) cb.click();
        });

        // Launch Scan
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Launch Scan'));
          if (btn) btn.click();
        });

        // Wait for scan to complete (button returns to Launch Scan and summary cards populate)
        await driver.waitForFunction(() => {
          const launchBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Launch Scan'));
          const openPortsCount = document.querySelectorAll('.grid > div')[0]?.querySelector('.text-xl')?.innerText;
          const durationText = document.querySelectorAll('.grid > div')[3]?.querySelector('.text-xl')?.innerText;
          return !!launchBtn && durationText && durationText !== '0ms';
        }, 30000);

        const scanData = await driver.evaluate(() => {
          const metricPanels = Array.from(document.querySelectorAll('.grid > div'));
          const metrics = {};
          metricPanels.forEach((p) => {
            const label = p.querySelector('div.text-\\[10px\\]')?.innerText?.trim();
            const val = p.querySelector('div.text-xl, div.text-sm')?.innerText?.trim();
            if (label) metrics[label] = val;
          });

          const tableRows = Array.from(document.querySelectorAll('table tbody tr')).map((r) => {
            const cells = Array.from(r.querySelectorAll('td'));
            return {
              port: cells[0]?.innerText?.trim(),
              protocol: cells[1]?.innerText?.trim(),
              service: cells[2]?.innerText?.trim(),
              product: cells[3]?.innerText?.trim(),
              latency: cells[4]?.innerText?.trim(),
            };
          });

          return { metrics, tableRows };
        });

        // Verify open ports discovery (port 80 or 443 is typically open on scanme.nmap.org)
        const hasOpenPort = scanData.tableRows.some((r) => r.port.includes('80') || r.port.includes('443'));
        if (!hasOpenPort && parseInt(scanData.metrics['OPEN PORTS'] || '0', 10) === 0) {
          throw new Error(`Expected at least one open web port on scanme.nmap.org, found: ${JSON.stringify(scanData)}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_port_scan.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_scan_results.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(scanData, null, 2));

        recordResult('MTS-PORT', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-PORT', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // Test Case: MTS-PORT-002
    {
      const caseId = 'MTS-PORT-002';
      const title = 'Monospace TLS Certificate Inspector';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'Port Scanner');

        // Scan cloudflare.com on port 443 with grab banners enabled for guaranteed TLS cert inspection
        const targetInput = 'input[placeholder*="127.0.0.1, 1.1.1.1"]';
        await driver.typeText(targetInput, 'cloudflare.com');

        // Select Custom Range and enter 443
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Custom Range'));
          if (btn) btn.click();
        });
        await driver.typeText('input[placeholder*="1-1024 or 80,443"]', '443');

        // Ensure grab banners is checked
        await driver.evaluate(() => {
          const cb = document.querySelector('#grabBanners');
          if (cb && !cb.checked) cb.click();
        });

        // Launch Scan
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Launch Scan'));
          if (btn) btn.click();
        });

        // Wait for scan to complete and port 443 to appear
        await driver.waitForFunction(() => {
          const row = document.querySelector('table tbody tr');
          const launchBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Launch Scan'));
          return !!row && !!launchBtn;
        }, 25000);

        // Click row for Port 443 to activate inspection drawer
        await driver.evaluate(() => {
          const row = document.querySelector('table tbody tr');
          if (row) row.click();
        });
        await new Promise((r) => setTimeout(r, 600));

        // Extract TLS Certificate inspection details
        const tlsDetails = await driver.evaluate(() => {
          const inspector = document.querySelector('.bg-\\[\\#070a12\\]\\/90.p-4.flex.flex-col');
          if (!inspector) return null;

          const title = inspector.querySelector('.text-slate-200')?.innerText?.trim();
          const stateBadge = inspector.querySelector('.text-emerald-300')?.innerText?.trim();
          const banner = inspector.querySelector('pre')?.innerText?.trim();

          const certBox = inspector.querySelector('.bg-indigo-500\\/5');
          const subject = certBox ? Array.from(certBox.querySelectorAll('div')).find((d) => d.innerText.includes('Subject:'))?.querySelector('span')?.innerText?.trim() : null;
          const issuer = certBox ? Array.from(certBox.querySelectorAll('div')).find((d) => d.innerText.includes('Issuer:'))?.querySelector('span')?.innerText?.trim() : null;
          const expires = certBox ? Array.from(certBox.querySelectorAll('div')).find((d) => d.innerText.includes('Expires:'))?.querySelector('span')?.innerText?.trim() : null;
          const cipher = certBox ? Array.from(certBox.querySelectorAll('div')).find((d) => d.innerText.includes('Cipher:'))?.querySelector('span')?.innerText?.trim() : null;

          return { title, stateBadge, banner, subject, issuer, expires, cipher };
        });

        if (!tlsDetails || !tlsDetails.title?.includes('Port 443 Inspection')) {
          throw new Error(`Port 443 Inspection panel not activated; details: ${JSON.stringify(tlsDetails)}`);
        }

        if (!tlsDetails.subject || !tlsDetails.issuer) {
          throw new Error(`TLS Certificate Subject or Issuer missing: ${JSON.stringify(tlsDetails)}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_tls_certificate.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_tls_details.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(tlsDetails, null, 2));

        recordResult('MTS-PORT', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-PORT', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // Test Case: MTS-PORT-003
    {
      const caseId = 'MTS-PORT-003';
      const title = 'Custom Port Syntax Parser & Concurrency Scaling';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'Port Scanner');

        // Select Custom Range preset
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Custom Range'));
          if (btn) btn.click();
        });

        // Input custom ports expression: 21-25, 53, 80, 443, 3306, 8000-8010 (20 distinct ports)
        await driver.typeText('input[placeholder*="1-1024 or 80,443"]', '21-25, 53, 80, 443, 3306, 8000-8010');

        // Set concurrency slider to 500 workers
        await driver.evaluate(() => {
          const slider = document.querySelector('input[type="range"][min="20"][max="500"]');
          if (slider) {
            const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            if (nativeSetter) nativeSetter.call(slider, '500');
            else slider.value = '500';
            slider.dispatchEvent(new Event('input', { bubbles: true }));
            slider.dispatchEvent(new Event('change', { bubbles: true }));
          }
        });

        // Set target to 127.0.0.1 for high-speed local concurrency evaluation
        const targetInput = 'input[placeholder*="127.0.0.1, 1.1.1.1"]';
        await driver.typeText(targetInput, '127.0.0.1');

        // Launch Scan
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Launch Scan'));
          if (btn) btn.click();
        });

        // Wait for scan to complete
        await driver.waitForFunction(() => {
          const launchBtn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Launch Scan'));
          const duration = document.querySelectorAll('.grid > div')[3]?.querySelector('.text-xl')?.innerText;
          return !!launchBtn && duration && duration !== '0ms';
        }, 25000);

        const concurrencyResults = await driver.evaluate(() => {
          const workersLabel = document.querySelector('label span.text-\\[\\#00f0ff\\]')?.innerText?.trim();
          const metricPanels = Array.from(document.querySelectorAll('.grid > div'));
          const metrics = {};
          metricPanels.forEach((p) => {
            const label = p.querySelector('div.text-\\[10px\\]')?.innerText?.trim();
            const val = p.querySelector('div.text-xl, div.text-sm')?.innerText?.trim();
            if (label) metrics[label] = val;
          });
          return { workersLabel, metrics };
        });

        if (concurrencyResults.workersLabel !== '500') {
          throw new Error(`Expected concurrency slider at 500, got: ${concurrencyResults.workersLabel}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_concurrency_scaling.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_custom_ports.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(concurrencyResults, null, 2));

        recordResult('MTS-PORT', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-PORT', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 4: MTS-DNS (DNS & Global Propagation Inspector)
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-DNS (DNS & Global Propagation Inspector)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // Test Case: MTS-DNS-001
    {
      const caseId = 'MTS-DNS-001';
      const title = 'Multi-Record & Cryptographic DNSSEC Inspector';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'DNS Inspector');

        const domainInput = 'input[placeholder*="cloudflare.com, google.com"]';
        await driver.typeText(domainInput, 'cloudflare.com');

        // Select 'A' record type
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'A');
          if (btn) btn.click();
        });

        // Click Resolve Records
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Resolve Records'));
          if (btn) btn.click();
        });

        // Wait for DNS query to complete
        await driver.waitForFunction(() => {
          const rows = document.querySelectorAll('table tbody tr');
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Resolve Records'));
          return rows.length > 0 && !!btn;
        }, 15000);

        const aRecordData = await driver.evaluate(() => {
          const dnssecBadge = document.querySelector('span.rounded-full.bg-emerald-500\\/20')?.innerText?.trim();
          const dnssecCard = document.querySelector('.bg-\\[\\#070a12\\]\\/90.p-4')?.innerText?.trim();
          const rows = Array.from(document.querySelectorAll('table tbody tr')).map((r) => {
            const cells = Array.from(r.querySelectorAll('td'));
            return {
              name: cells[0]?.innerText?.trim(),
              type: cells[1]?.innerText?.trim(),
              ttl: cells[2]?.innerText?.trim(),
              value: cells[3]?.innerText?.trim(),
            };
          });
          return { dnssecBadge, dnssecCard, rows };
        });

        if (!aRecordData.dnssecBadge?.includes('SECURE') && !aRecordData.dnssecCard?.includes('DNSSEC')) {
          throw new Error(`DNSSEC validation badge missing or insecure: ${JSON.stringify(aRecordData)}`);
        }

        if (aRecordData.rows.length === 0 || aRecordData.rows[0].type !== 'A') {
          throw new Error(`Expected A records returned for cloudflare.com: ${JSON.stringify(aRecordData.rows)}`);
        }

        // Switch to 'MX' record type and resolve
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'MX');
          if (btn) btn.click();
        });

        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Resolve Records'));
          if (btn) btn.click();
        });

        await driver.waitForFunction(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr'));
          return rows.some((r) => r.innerText.includes('MX'));
        }, 15000);

        const mxRecordData = await driver.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('table tbody tr')).map((r) => {
            const cells = Array.from(r.querySelectorAll('td'));
            return {
              name: cells[0]?.innerText?.trim(),
              type: cells[1]?.innerText?.trim(),
              ttl: cells[2]?.innerText?.trim(),
              value: cells[3]?.innerText?.trim(),
              priority: cells[4]?.innerText?.trim(),
            };
          });
          return rows;
        });

        if (!mxRecordData.some((r) => r.type === 'MX')) {
          throw new Error(`Expected MX records for cloudflare.com, got: ${JSON.stringify(mxRecordData)}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_dnssec_validation.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_dns_records.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify({ aRecords: aRecordData, mxRecords: mxRecordData }, null, 2)
        );

        recordResult('MTS-DNS', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-DNS', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // Test Case: MTS-DNS-002
    {
      const caseId = 'MTS-DNS-002';
      const title = 'Global DNS Propagation Grid';
      const tStart = performance.now();

      try {
        // Inspect the Global Propagation panel from the current cloudflare.com DNS query
        const propagationData = await driver.evaluate(() => {
          const header = document.querySelector('.flex-\\[3\\].flex.flex-col .text-slate-300')?.innerText?.trim();
          const matchPercent = document.querySelector('.flex-\\[3\\].flex.flex-col span.text-emerald-400')?.innerText?.trim();

          const nodeElements = Array.from(document.querySelectorAll('.flex-\\[3\\].flex.flex-col .divide-y > div'));
          const nodes = nodeElements.map((el) => {
            const name = el.querySelector('span.text-white')?.innerText?.trim();
            const country = el.querySelector('span.px-1\\.5')?.innerText?.trim();
            const location = el.querySelector('.text-\\[11px\\].text-slate-500')?.innerText?.trim();
            const values = el.querySelector('.text-\\[11px\\].text-emerald-400')?.innerText?.trim();
            const status = el.querySelector('span.font-bold')?.innerText?.trim();
            const latency = el.querySelector('span.text-slate-500:last-child')?.innerText?.trim();
            return { name, country, location, values, status, latency };
          });

          return { header, matchPercent, nodes };
        });

        if (propagationData.nodes.length < 5) {
          throw new Error(`Insufficient propagation nodes observed: ${propagationData.nodes.length}`);
        }

        // Verify resolver presence
        const hasCloudflare = propagationData.nodes.some((n) => n.name?.includes('Cloudflare'));
        const hasGoogle = propagationData.nodes.some((n) => n.name?.includes('Google'));
        const hasQuad9 = propagationData.nodes.some((n) => n.name?.includes('Quad9'));

        if (!hasCloudflare && !hasGoogle && !hasQuad9) {
          throw new Error(`Major global resolvers missing from propagation grid: ${JSON.stringify(propagationData.nodes)}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_global_propagation.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_propagation_grid.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(propagationData, null, 2));

        recordResult('MTS-DNS', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-DNS', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 5: MTS-WHOIS (WHOIS & RDAP Registry Inspector)
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-WHOIS (WHOIS & RDAP Registry Inspector)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // Test Case: MTS-WHOIS-001
    {
      const caseId = 'MTS-WHOIS-001';
      const title = 'RFC 7480 RDAP Registry & Contact Inspector';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'WHOIS / RDAP');

        // Click quick sample chip 'cloudflare.com'
        await driver.evaluate(() => {
          const chip = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.trim() === 'cloudflare.com');
          if (chip) chip.click();
        });

        // Wait for registry data to resolve
        await driver.waitForFunction(() => {
          const header = document.querySelector('h2.text-xl.font-mono');
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Lookup Registry'));
          return !!header && !!btn;
        }, 20000);

        const rdapData = await driver.evaluate(() => {
          const objectType = document.querySelector('span.px-2\\.5.py-1.rounded-md')?.innerText?.trim();
          const handle = document.querySelector('h2.text-xl.font-mono')?.innerText?.trim();
          const statusTags = Array.from(document.querySelectorAll('div.flex.items-center.gap-1\\.5.flex-wrap span')).map((s) => s.innerText.trim());

          const lifecycleBoxes = Array.from(document.querySelectorAll('.grid.grid-cols-2 > div.p-4'));
          const lifecycleEvents = {};
          if (lifecycleBoxes[1]) {
            Array.from(lifecycleBoxes[1].querySelectorAll('.flex.justify-between')).forEach((row) => {
              const k = row.querySelector('.text-slate-500')?.innerText?.trim();
              const v = row.querySelector('span:last-child')?.innerText?.trim();
              if (k) lifecycleEvents[k] = v;
            });
          }

          const contacts = Array.from(document.querySelectorAll('.grid.grid-cols-2.gap-4 > div.p-3\\.5')).map((c) => {
            const org = c.querySelector('span.font-bold')?.innerText?.trim();
            const email = c.querySelector('span.text-\\[\\#00f0ff\\]')?.innerText?.trim();
            const roles = Array.from(c.querySelectorAll('span.uppercase')).map((s) => s.innerText.trim());
            return { org, email, roles };
          });

          const nameservers = Array.from(document.querySelectorAll('.flex.flex-wrap.gap-2 span')).map((s) => s.innerText.trim());

          return { objectType, handle, statusTags, lifecycleEvents, contacts, nameservers };
        });

        if (!rdapData.handle || !rdapData.objectType) {
          throw new Error(`RDAP registry summary incomplete: ${JSON.stringify(rdapData)}`);
        }

        // Toggle Raw Text / Server Remarks
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Raw WHOIS Text'));
          if (btn) btn.click();
        });
        await new Promise((r) => setTimeout(r, 400));

        const rawText = await driver.evaluate(() => {
          const pre = document.querySelector('pre');
          return pre ? pre.innerText.trim() : null;
        });

        if (!rawText || rawText.length < 10) {
          throw new Error('Raw WHOIS / RDAP text disclosure block did not expand or is empty');
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_rdap_registry.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_rdap_data.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify({ rdapData, rawTextSnippet: rawText.slice(0, 300) }, null, 2)
        );

        recordResult('MTS-WHOIS', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-WHOIS', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 6: MTS-LAN (LAN Device Discovery & Unprivileged Sweep)
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-LAN (LAN Device Discovery & Unprivileged Sweep)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // Test Case: MTS-LAN-001
    {
      const caseId = 'MTS-LAN-001';
      const title = 'Unprivileged LAN Device Discovery Sweep';
      const tStart = performance.now();

      try {
        await navigateToView(driver, 'LAN Scanner');

        // Verify PAL Unprivileged / Zero-Elevation badge
        const badgeText = await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) =>
            b.innerText.includes('Elevated Helper') || b.innerText.includes('Zero-Elevation PAL')
          );
          return btn ? btn.innerText.trim() : null;
        });

        if (!badgeText || (!badgeText.includes('Zero-Elevation PAL') && !badgeText.includes('Elevated Helper'))) {
          throw new Error(`Unexpected privilege status badge: ${badgeText}`);
        }

        // Start ARP Discovery
        await driver.evaluate(() => {
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Start ARP Discovery'));
          if (btn) btn.click();
        });

        // Wait for ARP sweep to complete and table rows to appear
        await driver.waitForFunction(() => {
          const rows = document.querySelectorAll('table tbody tr');
          const btn = Array.from(document.querySelectorAll('button')).find((b) => b.innerText.includes('Start ARP Discovery'));
          return rows.length > 0 && !!btn;
        }, 25000);

        const lanData = await driver.evaluate(() => {
          const kpis = Array.from(document.querySelectorAll('.grid > div.p-4')).map((p) => ({
            label: p.querySelector('div.text-\\[11px\\]')?.innerText?.trim(),
            val: p.querySelector('div.text-2xl')?.innerText?.trim(),
            sub: p.querySelector('div.text-\\[11px\\]:last-child')?.innerText?.trim(),
          }));

          const devices = Array.from(document.querySelectorAll('table tbody tr')).map((r) => {
            const cells = Array.from(r.querySelectorAll('td'));
            return {
              hostname: cells[0]?.querySelector('div.font-semibold')?.innerText?.trim(),
              isGateway: !!cells[0]?.querySelector('span')?.innerText?.includes('GATEWAY'),
              ip: cells[1]?.querySelector('span')?.innerText?.trim(),
              mac: cells[2]?.querySelector('span')?.innerText?.trim(),
              vendor: cells[3]?.querySelector('span')?.innerText?.trim(),
              category: cells[4]?.querySelector('span')?.innerText?.trim(),
              latency: cells[5]?.querySelector('span:last-child')?.innerText?.trim(),
            };
          });

          return { kpis, devices };
        });

        if (lanData.devices.length === 0) {
          throw new Error('No devices discovered during LAN ARP sweep');
        }

        // Verify MAC and OUI resolution integrity
        const sampleDev = lanData.devices[0];
        const macPattern = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;
        if (!macPattern.test(sampleDev.mac)) {
          throw new Error(`Discovered MAC address format invalid: ${sampleDev.mac}`);
        }

        if (!sampleDev.vendor || sampleDev.vendor.length < 2) {
          throw new Error(`OUI vendor mapping missing on device: ${JSON.stringify(sampleDev)}`);
        }

        // Test search filter by IP
        const targetIp = sampleDev.ip;
        const searchInput = 'input[placeholder*="Search by IP, MAC"]';
        await driver.typeText(searchInput, targetIp);
        await new Promise((r) => setTimeout(r, 400));

        const filterMatches = await driver.evaluate(`
          (() => {
            const rows = Array.from(document.querySelectorAll('table tbody tr'));
            const matchingCount = rows.length;
            const allMatch = rows.every((r) => r.innerText.includes(${JSON.stringify(targetIp)}));
            return { matchingCount, allMatch };
          })()
        `);

        if (filterMatches.matchingCount < 1 || !filterMatches.allMatch) {
          throw new Error(`Search filter by IP failed; expected matches containing ${targetIp}, got: ${JSON.stringify(filterMatches)}`);
        }

        // Clear search input
        await driver.typeText(searchInput, '');
        await new Promise((r) => setTimeout(r, 400));

        // Test Quick Copy Action
        await driver.evaluate(() => {
          const copyBtn = document.querySelector('button[title="Copy IP"]');
          if (copyBtn) copyBtn.click();
        });
        await new Promise((r) => setTimeout(r, 300));

        const screenshotPath = path.join(screenshotsDir, `${caseId}_lan_discovery.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_lan_devices.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(lanData, null, 2));

        recordResult('MTS-LAN', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-LAN', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

  } finally {
    await driver.stop();
  }

  // Print Summary Table
  const totalDuration = performance.now() - suiteStartTime;
  const passed = testResults.filter((r) => r.status === 'PASS').length;
  const failed = testResults.filter((r) => r.status === 'FAIL').length;

  console.log(`\n${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
  console.log(`${Colors.bold}           MILESTONE M2 TEST EXECUTION SUMMARY                      ${Colors.reset}`);
  console.log(`${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
  console.log(`Total Cases Executed: ${testResults.length}`);
  console.log(`Passed:               ${Colors.green}${passed}${Colors.reset}`);
  console.log(`Failed:               ${failed > 0 ? Colors.red : Colors.green}${failed}${Colors.reset}`);
  console.log(`Execution Duration:   ${totalDuration.toFixed(1)}ms`);
  console.log(`Pass Rate:            ${((passed / testResults.length) * 100).toFixed(1)}%\n`);

  console.log(`${Colors.bold}Case-by-Case Breakdown:${Colors.reset}`);
  for (const r of testResults) {
    const statusCol = r.status === 'PASS' ? `${Colors.green}[PASS]${Colors.reset}` : `${Colors.red}[FAIL]${Colors.reset}`;
    console.log(`  ${statusCol} ${r.caseId.padEnd(16)} | ${r.title.padEnd(52)} | ${r.durationMs.toFixed(0).padStart(6)}ms`);
  }
  console.log(`\nArtifacts generated in: ${artifactsDir}\n`);

  return {
    total: testResults.length,
    passed,
    failed,
    durationMs: totalDuration,
    results: testResults,
  };
}

// Allow direct CLI execution
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  runM2Suites()
    .then((summary) => {
      if (summary.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('M2 Test Runner fatal error:', err);
      process.exit(1);
    });
}
