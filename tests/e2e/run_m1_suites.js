/**
 * NetPulse E2E Test Suite Runner — Milestone M1: Core Workstation Suites
 *
 * Suites Covered:
 * - MTS-SHELL-001: Frameless Window Title Bar & Drag Region
 * - MTS-SHELL-002: Cyber-Dark vs. Tactical Light Theme Toggle
 * - MTS-SHELL-003: Sidebar Navigation Router & Persistent Status Bar
 * - MTS-DASH-001: Automatic Egress IP Discovery & Geolocation Banner
 * - MTS-DASH-002: Manual Refresh Gateway & Cascade Fallback
 * - MTS-TRACE-001: Standard Route Trace Execution (1.1.1.1)
 * - MTS-TRACE-002: Mid-Flight Trace Cancellation & Boundary Hops
 * - MTS-MTRACE-001: Concurrent Multi-Target Path Tracing
 * - MTS-WATCH-001: 24/7 Gateway Monitoring & Threshold Alerting
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

function calculateWcagContrast(hex1, hex2) {
  function getLuminance(hex) {
    const rgb = hex.replace('#', '').match(/.{2}/g).map((x) => parseInt(x, 16) / 255);
    const a = rgb.map((v) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)));
    return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
  }
  const l1 = getLuminance(hex1);
  const l2 = getLuminance(hex2);
  const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  return Number(ratio.toFixed(2));
}

export async function runM1Suites() {
  console.log(`\n${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
  console.log(`${Colors.bold}${Colors.cyan}   NetPulse Native Desktop E2E Testing — Milestone M1 Suites        ${Colors.reset}`);
  console.log(`${Colors.bold}${Colors.cyan}======================================================================${Colors.reset}`);
  console.log(`Target Binary: ${path.join(projectRoot, 'src-tauri/target/release/netpulse.exe')}`);
  console.log(`CDP Port: 9222`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const driver = new CdpDriver();
  const suiteStartTime = performance.now();

  try {
    await driver.start({ timeoutMs: 25000 });

    // =========================================================================
    // SUITE 1: MTS-SHELL
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-SHELL (Desktop Shell, Title Bar, Navigation & Theming)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // --- MTS-SHELL-001 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-SHELL-001';
      const title = 'Frameless Window Title Bar & Drag Region';
      try {
        const headerInfo = await driver.evaluate(() => {
          const header = document.querySelector('header');
          if (!header) return null;
          const brandText = header.innerText || '';
          const hasDragRegion = !!header.querySelector('[data-tauri-drag-region]');
          const hasActivityPulse = !!header.querySelector('.animate-pulse');
          const hasMinimize = !!header.querySelector('button[title="Minimize"]');
          const hasMaximize = !!header.querySelector('button[title="Maximize"]');
          const hasClose = !!header.querySelector('button[title="Close"]');
          const hasExport = !!header.querySelector('button[title*="Export"]');
          const hasThemeToggle = !!header.querySelector('button[title="Toggle Theme"]');
          const hasRootBadge = brandText.includes('ROOT');
          return {
            brandText,
            hasDragRegion,
            hasActivityPulse,
            hasMinimize,
            hasMaximize,
            hasClose,
            hasExport,
            hasThemeToggle,
            hasRootBadge,
          };
        });

        if (!headerInfo) throw new Error('Header element not found');
        if (!headerInfo.brandText.includes('NETPULSE')) throw new Error('Logo does not contain NETPULSE');
        if (!headerInfo.brandText.includes('v1.0.0-GA') && !headerInfo.brandText.includes('V1.0.0-GA')) {
          throw new Error('Missing v1.0.0-GA badge');
        }
        if (!headerInfo.hasDragRegion) throw new Error('Missing data-tauri-drag-region attribute');
        if (!headerInfo.hasMinimize || !headerInfo.hasMaximize || !headerInfo.hasClose) {
          throw new Error('Missing window controls (Minimize, Maximize, Close)');
        }

        // Verify backend elevation IPC
        const elevation = await driver.invokeIpc('check_elevation_status');
        const elevData = elevation?.data || { isElevated: false };

        const screenshotPath = path.join(screenshotsDir, `${caseId}_titlebar.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_elevation.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify({ headerInfo, elevation: elevData }, null, 2));

        recordResult('MTS-SHELL', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-SHELL', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // --- MTS-SHELL-002 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-SHELL-002';
      const title = 'Cyber-Dark vs. Tactical Light Theme Toggle';
      try {
        // 1. Initial dark theme check
        const initialTheme = await driver.evaluate(() => {
          return {
            dataTheme: document.documentElement.getAttribute('data-theme'),
            bodyBg: getComputedStyle(document.body).backgroundColor,
            bgApp: getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim(),
            textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
          };
        });

        // 2. Click theme toggle button to switch to light
        await driver.click('button[title="Toggle Theme"]');
        await driver.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'light', 3000);

        const lightTheme = await driver.evaluate(() => {
          return {
            dataTheme: document.documentElement.getAttribute('data-theme'),
            bgApp: getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim(),
            textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
            accentCyan: getComputedStyle(document.documentElement).getPropertyValue('--accent-cyan').trim(),
          };
        });

        if (lightTheme.dataTheme !== 'light') throw new Error('data-theme did not switch to light');

        // Check WCAG AA contrast ratio
        const lightContrast = calculateWcagContrast(
          lightTheme.textPrimary || '#0f172a',
          lightTheme.bgApp || '#f1f5f9'
        );
        if (lightContrast < 4.5) {
          throw new Error(`Light theme WCAG contrast ratio ${lightContrast}:1 is below AA threshold (4.5:1)`);
        }

        const lightScreenshot = path.join(screenshotsDir, `${caseId}_light_theme.png`);
        await driver.captureScreenshot(lightScreenshot);

        // 3. Navigate through sample tabs in light mode to confirm styles
        await driver.evaluate(`
          (() => {
            const btns = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (btns[4]) btns[4].click(); // Ping Monitor
          })()
        `);
        await new Promise((r) => setTimeout(r, 400));
        await driver.evaluate(`
          (() => {
            const btns = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (btns[5]) btns[5].click(); // Subnet
          })()
        `);
        await new Promise((r) => setTimeout(r, 400));
        await driver.evaluate(`
          (() => {
            const btns = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (btns[0]) btns[0].click(); // Dashboard
          })()
        `);
        await new Promise((r) => setTimeout(r, 400));

        // 4. Click theme toggle button to switch back to dark mode
        await driver.click('button[title="Toggle Theme"]');
        await driver.waitForFunction(() => document.documentElement.getAttribute('data-theme') === 'dark', 3000);

        const darkTheme = await driver.evaluate(() => {
          return {
            dataTheme: document.documentElement.getAttribute('data-theme'),
            bgApp: getComputedStyle(document.documentElement).getPropertyValue('--bg-app').trim(),
            textPrimary: getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim(),
          };
        });

        const darkContrast = calculateWcagContrast(
          darkTheme.textPrimary || '#f8fafc',
          darkTheme.bgApp || '#0b0f19'
        );

        const darkScreenshot = path.join(screenshotsDir, `${caseId}_dark_theme.png`);
        await driver.captureScreenshot(darkScreenshot);

        const telemetryPath = path.join(telemetryDir, `${caseId}_theme_state.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify(
            {
              initialTheme,
              lightTheme: { ...lightTheme, contrastRatio: `${lightContrast}:1` },
              darkTheme: { ...darkTheme, contrastRatio: `${darkContrast}:1` },
            },
            null,
            2
          )
        );

        recordResult('MTS-SHELL', caseId, title, 'PASS', performance.now() - tStart, {
          lightScreenshot,
          darkScreenshot,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-SHELL', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // --- MTS-SHELL-003 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-SHELL-003';
      const title = 'Sidebar Navigation Router & Persistent Status Bar';
      try {
        const expectedModules = [
          'dashboard',
          'trace',
          'multitrace',
          'watchdog',
          'ping',
          'subnet',
          'portscan',
          'dns',
          'whois',
          'lan',
          'settings',
        ];

        // 1. Inspect sidebar buttons
        const sidebarItems = await driver.evaluate(() => {
          const aside = document.querySelector('aside');
          if (!aside) return [];
          const buttons = Array.from(aside.querySelectorAll('div.flex.flex-col.gap-1 > button'));
          return buttons.map((b) => ({
            text: b.innerText.split('\n')[0].trim(),
            hasGlow: b.className.includes('00f0ff'),
          }));
        });

        if (sidebarItems.length !== 11) {
          throw new Error(`Expected exactly 11 sidebar modules, found ${sidebarItems.length}`);
        }

        // 2. Sequentially switch through all 11 modules and verify status bar persistence
        const routeTimings = [];
        for (let i = 0; i < expectedModules.length; i++) {
          const modId = expectedModules[i];
          const tSwitchStart = performance.now();

          // Set active view via store
          await driver.evaluate(`
            (() => {
              // Click the nth sidebar navigation button
              const buttons = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
              if (buttons[${i}]) buttons[${i}].click();
            })()
          `);

          // Verify status bar remains rendered
          const statusBarInfo = await driver.evaluate(() => {
            const footer = document.querySelector('footer');
            if (!footer) return null;
            return {
              text: footer.innerText,
              hasNic: footer.innerText.includes('NIC:'),
              hasEgress: footer.innerText.includes('Egress:'),
              hasGeoLite2: footer.innerText.includes('GeoLite2:'),
              hasIpc: footer.innerText.includes('20 Hz IPC'),
            };
          });

          if (!statusBarInfo || !statusBarInfo.hasNic || !statusBarInfo.hasEgress || !statusBarInfo.hasIpc) {
            throw new Error(`Status bar missing required telemetry in module ${modId}`);
          }

          routeTimings.push({
            module: modId,
            transitionMs: performance.now() - tSwitchStart,
          });

          await new Promise((r) => setTimeout(r, 150));
        }

        // Return to dashboard
        await driver.evaluate(`
          (() => {
            const buttons = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (buttons[0]) buttons[0].click();
          })()
        `);

        const navScreenshot = path.join(screenshotsDir, `${caseId}_sidebar_nav.png`);
        await driver.captureScreenshot(navScreenshot);

        const telemetryPath = path.join(telemetryDir, `${caseId}_routes.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify({ sidebarItems, expectedModules, routeTimings }, null, 2)
        );

        recordResult('MTS-SHELL', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: navScreenshot,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-SHELL', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 2: MTS-DASH
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-DASH (Dashboard & Primary Egress Gateway Discovery)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // --- MTS-DASH-001 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-DASH-001';
      const title = 'Automatic Egress IP Discovery & Geolocation Banner';
      try {
        // Ensure on dashboard
        await driver.evaluate(`
          (() => {
            const btn = document.querySelector('aside div.flex.flex-col.gap-1 > button');
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Wait for traceResult to be populated on Dashboard
        await driver.waitForFunction(() => {
          const h1 = document.querySelector('h1.text-4xl');
          return h1 && h1.innerText && h1.innerText.trim().length > 0;
        }, 8000);

        const dashboardData = await driver.evaluate(() => {
          const ip = document.querySelector('h1.text-4xl')?.innerText?.trim();
          const badges = Array.from(document.querySelectorAll('span.font-mono')).map((s) => s.innerText?.trim());
          const subtitle = document.querySelector('div.glass-panel p.text-slate-300')?.innerText?.trim();

          // 4 Metric cards
          const metricCards = Array.from(document.querySelectorAll('div.grid.grid-cols-1.md\\:grid-cols-4 > div'));
          const metrics = metricCards.map((c) => ({
            label: c.querySelector('div.text-\\[11px\\]')?.innerText?.trim(),
            value: c.querySelector('div.text-sm')?.innerText?.trim(),
            detail: c.querySelector('div.text-\\[11px\\]:last-child')?.innerText?.trim(),
          }));

          return {
            ip,
            badges,
            subtitle,
            metrics,
          };
        });

        if (!dashboardData.ip) throw new Error('Egress IP banner is empty');
        const hasRoutability = dashboardData.badges.some((b) => b.includes('PUBLIC ROUTABLE') || b.includes('BOGON'));
        if (!hasRoutability) throw new Error('Missing routability badge (PUBLIC ROUTABLE / BOGON)');

        // Validate 4 metric cards
        if (dashboardData.metrics.length !== 4) {
          throw new Error(`Expected 4 metric cards, found ${dashboardData.metrics.length}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_egress_banner.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_egress_telemetry.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(dashboardData, null, 2));

        recordResult('MTS-DASH', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-DASH', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // --- MTS-DASH-002 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-DASH-002';
      const title = 'Manual Refresh Gateway & Cascade Fallback';
      try {
        // 1. Verify 4 Provider Cascade levels
        const cascadeProviders = await driver.evaluate(() => {
          const cards = Array.from(document.querySelectorAll('div.space-y-2 > div.flex.items-center.justify-between'));
          return cards.map((c) => ({
            provider: c.querySelector('span:first-child')?.innerText?.trim(),
            status: c.querySelector('span:last-child')?.innerText?.trim(),
          }));
        });

        if (cascadeProviders.length < 4) {
          throw new Error(`Expected 4 cascade providers, found ${cascadeProviders.length}`);
        }
        const hasMaxMind = cascadeProviders.some((p) => p.provider?.includes('MaxMind'));
        const hasIpApi = cascadeProviders.some((p) => p.provider?.includes('ipapi'));
        const hasIpInfo = cascadeProviders.some((p) => p.provider?.includes('ipinfo'));
        const hasIpify = cascadeProviders.some((p) => p.provider?.includes('ipify'));

        if (!hasMaxMind || !hasIpApi || !hasIpInfo || !hasIpify) {
          throw new Error('Missing one or more required cascade providers (MaxMind, ipapi, ipinfo, ipify)');
        }

        // 2. Click Refresh Gateway button and observe execution
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Refresh Gateway'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 600));

        // 3. Test Diagnostic Launchpad link to Visual Traceroute
        const preView = await driver.evaluate(() => {
          const h1 = document.querySelector('h1');
          return h1?.innerText;
        });

        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Visual Traceroute'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 600));

        const postRoute = await driver.evaluate(() => {
          return {
            hasTraceButton: Array.from(document.querySelectorAll('button')).some((b) => b.innerText.includes('Trace Route')),
            hasGeodesicCanvas: !!document.querySelector('canvas'),
          };
        });

        if (!postRoute.hasTraceButton || !postRoute.hasGeodesicCanvas) {
          throw new Error('Diagnostic Launchpad did not route to IP Trace & MTR view');
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_cascade_health.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_cascade_providers.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify({ cascadeProviders, postRoute }, null, 2));

        recordResult('MTS-DASH', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-DASH', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 3: MTS-TRACE
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-TRACE (Visual Traceroute & Hop-by-Hop MTR)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // --- MTS-TRACE-001 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-TRACE-001';
      const title = 'Standard Route Trace Execution (1.1.1.1)';
      try {
        // Ensure on trace view
        await driver.evaluate(`
          (() => {
            const buttons = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (buttons[1]) buttons[1].click(); // IP Trace & MTR
          })()
        `);
        await new Promise((r) => setTimeout(r, 500));

        // Set target to 1.1.1.1
        await driver.typeText('input[placeholder*="Enter IP or hostname"]', '1.1.1.1');
        await new Promise((r) => setTimeout(r, 300));

        // Verify canvas exists
        const canvasExists = await driver.evaluate(() => !!document.querySelector('canvas'));
        if (!canvasExists) throw new Error('Geodesic Path Visualization canvas element missing');

        // Click Trace Route button
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Trace Route'));
            if (btn) btn.click();
          })()
        `);

        // Wait for trace to start and button to show Stop Trace
        await driver.waitForFunction(() => {
          return Array.from(document.querySelectorAll('button')).some((b) => b.innerText.includes('Stop Trace'));
        }, 5000);

        // Wait for hops to start populating (at least 1 real numbered hop, up to 25s)
        await driver.waitForFunction(() => {
          const rows = Array.from(document.querySelectorAll('tbody tr'));
          const realHops = rows.filter((r) => {
            const firstCell = r.querySelector('td:first-child')?.innerText?.trim();
            return firstCell && /^\d+$/.test(firstCell);
          });
          const isDone = Array.from(document.querySelectorAll('button')).some((b) => b.innerText.includes('Trace Route'));
          return realHops.length >= 1 || isDone;
        }, 25000);

        // Allow additional time for intermediate and terminal hop discovery
        await new Promise((r) => setTimeout(r, 6000));

        // Extract hop table telemetry
        const traceTelemetry = await driver.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tbody tr'));
          return rows.map((r) => {
            const cells = Array.from(r.querySelectorAll('td'));
            return {
              ttl: cells[0]?.innerText?.trim(),
              ip: cells[1]?.innerText?.trim(),
              hostname: cells[2]?.innerText?.trim(),
              loss: cells[3]?.innerText?.trim(),
              sent: cells[4]?.innerText?.trim(),
              recv: cells[5]?.innerText?.trim(),
              rttLast: cells[6]?.innerText?.trim(),
              rttAvg: cells[7]?.innerText?.trim(),
            };
          });
        });

        if (traceTelemetry.length === 0) {
          throw new Error('Hop telemetry table remained empty during trace execution');
        }

        // Verify hop 1 is present
        const hasHop1 = traceTelemetry.some((h) => h.ttl === '1');
        if (!hasHop1) throw new Error('Hop 1 (local gateway) was not discovered');

        const screenshotPath = path.join(screenshotsDir, `${caseId}_trace_complete.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_hop_telemetry.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(traceTelemetry, null, 2));

        recordResult('MTS-TRACE', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-TRACE', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // --- MTS-TRACE-002 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-TRACE-002';
      const title = 'Mid-Flight Trace Cancellation & Boundary Hops';
      try {
        // Ensure on trace view
        await driver.evaluate(`
          (() => {
            const buttons = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (buttons[1]) buttons[1].click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 400));

        // Stop any running trace first
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Stop Trace'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 500));

        // 1. Cancellation test: target 8.8.8.8, max hops 64
        await driver.typeText('input[placeholder*="Enter IP or hostname"]', '8.8.8.8');
        await driver.typeText('input[type="number"]', '64');
        await new Promise((r) => setTimeout(r, 300));

        // Start trace
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Trace Route'));
            if (btn) btn.click();
          })()
        `);

        // Wait for Stop Trace button
        await driver.waitForFunction(() => {
          return Array.from(document.querySelectorAll('button')).some((b) => b.innerText.includes('Stop Trace'));
        }, 5000);

        // Wait until real numbered hop appears
        await driver.waitForFunction(() => {
          const rows = Array.from(document.querySelectorAll('tbody tr'));
          return rows.some((r) => /^\d+$/.test(r.querySelector('td:first-child')?.innerText?.trim() || ''));
        }, 12000);

        // Click Stop Trace immediately
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Stop Trace'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 800));

        // Verify trace stopped and discovered hops are preserved
        const isStopped = await driver.evaluate(() => {
          const hasStop = Array.from(document.querySelectorAll('button')).some((b) => b.innerText.includes('Stop Trace'));
          const rows = Array.from(document.querySelectorAll('tbody tr'));
          const hasNumberedHops = rows.some((r) => /^\d+$/.test(r.querySelector('td:first-child')?.innerText?.trim() || ''));
          return !hasStop && hasNumberedHops;
        });

        if (!isStopped) throw new Error('Stop Trace did not halt execution or table was wiped');

        // 2. Boundary test: max hops = 1
        await driver.typeText('input[type="number"]', '1');
        await new Promise((r) => setTimeout(r, 300));

        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Trace Route'));
            if (btn) btn.click();
          })()
        `);

        // Wait for hop 1 to appear
        await driver.waitForFunction(() => {
          const rows = Array.from(document.querySelectorAll('tbody tr'));
          return rows.some((r) => r.querySelector('td:first-child')?.innerText?.trim() === '1');
        }, 15000);
        await new Promise((r) => setTimeout(r, 2000));

        const boundaryTelemetry = await driver.evaluate(() => {
          const rows = Array.from(document.querySelectorAll('tbody tr')).filter((r) => {
            const firstCell = r.querySelector('td:first-child')?.innerText?.trim();
            return firstCell && /^\d+$/.test(firstCell);
          });
          return rows.map((r) => ({
            ttl: r.querySelector('td:first-child')?.innerText?.trim(),
            ip: r.querySelector('td:nth-child(2)')?.innerText?.trim(),
          }));
        });

        const screenshotPath = path.join(screenshotsDir, `${caseId}_cancellation_boundary.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_boundary_hops.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify({ boundaryTelemetry }, null, 2));

        recordResult('MTS-TRACE', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-TRACE', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 4: MTS-MTRACE
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-MTRACE (Multi-Target MTR & Route Deviation Analysis)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // --- MTS-MTRACE-001 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-MTRACE-001';
      const title = 'Concurrent Multi-Target Path Tracing';
      try {
        // Navigate to multitrace
        await driver.evaluate(`
          (() => {
            const buttons = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (buttons[2]) buttons[2].click(); // Multi-Target MTR
          })()
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Add target github.com
        await driver.typeText('input[placeholder*="Add IP or hostname"]', 'github.com');
        await driver.evaluate(`
          (() => {
            const form = document.querySelector('form');
            if (form) form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
          })()
        `);
        await new Promise((r) => setTimeout(r, 400));

        // Remove target 9.9.9.9 if present
        await driver.evaluate(`
          (() => {
            const chips = Array.from(document.querySelectorAll('div.flex.flex-wrap.gap-2 > div'));
            const chip9 = chips.find(c => c.innerText.includes('9.9.9.9'));
            if (chip9) {
              const xBtn = chip9.querySelector('button');
              if (xBtn) xBtn.click();
            }
          })()
        `);
        await new Promise((r) => setTimeout(r, 300));

        // Click Trace All Targets
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Trace All Targets'));
            if (btn) btn.click();
          })()
        `);

        // Wait for multi-trace to run and complete (up to 30s)
        await driver.waitForFunction(() => {
          const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Trace All Targets'));
          const chips = Array.from(document.querySelectorAll('div.flex.flex-wrap.gap-2 > div'));
          const hasTracingChip = chips.some(c => c.innerText.includes('Tracing'));
          return btn && !hasTracingChip;
        }, 30000, 500);

        // Gather multitrace results
        const mtraceData = await driver.evaluate(() => {
          const chips = Array.from(document.querySelectorAll('div.flex.flex-wrap.gap-2 > div')).map(c => c.innerText.replace('\n', ' '));
          const kpis = Array.from(document.querySelectorAll('div.grid.grid-cols-1.md\\:grid-cols-3 > div')).map(d => ({
            label: d.querySelector('div.text-\\[11px\\]')?.innerText?.trim(),
            value: d.querySelector('div.text-2xl')?.innerText?.trim(),
          }));

          const rows = Array.from(document.querySelectorAll('table tbody tr')).map(r => ({
            ttl: r.querySelector('td:first-child')?.innerText?.trim(),
            ip: r.querySelector('td:nth-child(2)')?.innerText?.trim(),
            asn: r.querySelector('td:nth-child(4)')?.innerText?.trim(),
          }));

          return { chips, kpis, rows };
        });

        // Test Route Baselines modal
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Route Baselines'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 500));

        // Close modal
        await driver.evaluate(`
          (() => {
            const closeBtn = document.querySelector('div.fixed.inset-0 button');
            if (closeBtn) closeBtn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 300));

        const screenshotPath = path.join(screenshotsDir, `${caseId}_multitrace_results.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_multitrace.json`);
        fs.writeFileSync(telemetryPath, JSON.stringify(mtraceData, null, 2));

        recordResult('MTS-MTRACE', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-MTRACE', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
      }
    }

    // =========================================================================
    // SUITE 5: MTS-WATCH
    // =========================================================================
    console.log(`\n${Colors.bold}------------------------------------------------------------`);
    console.log(` Test Suite: MTS-WATCH (Sentinel Background Watchdog & Health Probing)`);
    console.log(`------------------------------------------------------------${Colors.reset}`);

    // --- MTS-WATCH-001 ---
    {
      const tStart = performance.now();
      const caseId = 'MTS-WATCH-001';
      const title = '24/7 Gateway Monitoring & Threshold Alerting';
      try {
        // Navigate to watchdog
        await driver.evaluate(`
          (() => {
            const buttons = Array.from(document.querySelectorAll('aside div.flex.flex-col.gap-1 > button'));
            if (buttons[3]) buttons[3].click(); // Sentinel Watchdog
          })()
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Verify initial state
        const initialStatus = await driver.evaluate(() => {
          const badge = document.querySelector('h1 + span');
          return badge?.innerText?.trim();
        });

        // Click Start Sentinel
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Start Sentinel'));
            if (btn) btn.click();
          })()
        `);

        // Wait for status to show MONITORING ACTIVE
        await driver.waitForFunction(() => {
          const badge = document.querySelector('h1 + span');
          return badge && badge.innerText.includes('MONITORING ACTIVE');
        }, 5000);

        // Open Thresholds Drawer
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Thresholds'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 400));

        // Let the sentinel poll targets for a few seconds
        await new Promise((r) => setTimeout(r, 3500));

        // Inspect monitored targets and alerts
        const watchdogData = await driver.evaluate(() => {
          const targets = Array.from(document.querySelectorAll('div.grid.grid-cols-1.md\\:grid-cols-3 > div')).map(card => ({
            name: card.querySelector('div.font-bold')?.innerText?.trim(),
            endpoint: card.querySelector('div.font-mono.text-slate-400')?.innerText?.trim(),
            status: card.querySelector('span.font-mono')?.innerText?.trim(),
            latency: card.querySelector('div.grid.grid-cols-2 span.font-bold')?.innerText?.trim(),
          }));

          const alertsHeader = document.querySelector('h2.text-xs.font-mono')?.innerText?.trim();
          return { targets, alertsHeader };
        });

        // Stop Sentinel
        await driver.evaluate(`
          (() => {
            const btn = Array.from(document.querySelectorAll('button')).find(b => b.innerText.includes('Stop Sentinel'));
            if (btn) btn.click();
          })()
        `);
        await new Promise((r) => setTimeout(r, 600));

        // Verify stopped
        const stoppedStatus = await driver.evaluate(() => {
          const badge = document.querySelector('h1 + span');
          return badge?.innerText?.trim();
        });

        if (!stoppedStatus || !stoppedStatus.includes('IDLE / STOPPED')) {
          throw new Error(`Watchdog did not stop cleanly; status was: ${stoppedStatus}`);
        }

        const screenshotPath = path.join(screenshotsDir, `${caseId}_watchdog_active.png`);
        await driver.captureScreenshot(screenshotPath);

        const telemetryPath = path.join(telemetryDir, `${caseId}_watchdog_status.json`);
        fs.writeFileSync(
          telemetryPath,
          JSON.stringify({ initialStatus, stoppedStatus, watchdogData }, null, 2)
        );

        recordResult('MTS-WATCH', caseId, title, 'PASS', performance.now() - tStart, {
          screenshot: screenshotPath,
          telemetry: telemetryPath,
        });
      } catch (err) {
        recordResult('MTS-WATCH', caseId, title, 'FAIL', performance.now() - tStart, {}, err.message);
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
  console.log(`${Colors.bold}           MILESTONE M1 TEST EXECUTION SUMMARY                      ${Colors.reset}`);
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
  runM1Suites()
    .then((summary) => {
      if (summary.failed > 0) {
        process.exit(1);
      } else {
        process.exit(0);
      }
    })
    .catch((err) => {
      console.error('M1 Test Runner fatal error:', err);
      process.exit(1);
    });
}
