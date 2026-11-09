/**
 * Challenger 1: Adversarial Stress & Empirical Verification Harness
 * Directly boots native `src-tauri/target/release/netpulse.exe`
 * Evaluates CDP connectivity on port 9222 and stress tests:
 * 1. Native desktop boot & CDP communication
 * 2. High concurrency / port limits & rapid IPC bombardment
 * 3. Malformed IP / subnet math & VLSM boundaries
 * 4. Active ICMP cancellation (trace & ping) & watchdog rapid toggle
 * 5. On-the-fly report generation & binary PCAP header verification
 */

import { CdpDriver } from './cdp_driver.js';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

const results = {
  bootAndCdp: { status: 'PENDING', details: null },
  highConcurrencyPorts: { status: 'PENDING', details: null },
  rapidIpcBombardment: { status: 'PENDING', details: null },
  malformedIpSubnet: { status: 'PENDING', details: null },
  icmpTraceCancellation: { status: 'PENDING', details: null },
  icmpPingCancellation: { status: 'PENDING', details: null },
  watchdogRapidToggle: { status: 'PENDING', details: null },
  reportAndPcapValidation: { status: 'PENDING', details: null },
  liveEgressDiscovery: { status: 'PENDING', details: null },
};

async function runChallengerHarness() {
  console.log('======================================================================');
  console.log('   CHALLENGER 1: ADVERSARIAL STRESS & EMPIRICAL VERIFICATION HARNESS');
  console.log('======================================================================');
  console.log(`Timestamp: ${new Date().toISOString()}`);

  const driver = new CdpDriver({ port: 9222 });
  const testStartTime = Date.now();

  try {
    // ------------------------------------------------------------------
    // TEST 1: Native Desktop Executable Boot & CDP Port 9222
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 1] Booting native netpulse.exe & establishing CDP session...');
    const bootStart = Date.now();
    await driver.start({ timeoutMs: 25000 });
    const bootDuration = Date.now() - bootStart;

    // Verify webview target
    const targetTitle = await driver.evaluate(() => document.title);
    const documentReady = await driver.evaluate(() => document.readyState);
    const tauriDefined = await driver.evaluate(() => typeof window.__TAURI_INTERNALS__ !== 'undefined');
    const headerExists = await driver.evaluate(() => !!document.querySelector('header'));

    const screenshotPath = path.join(projectRoot, 'tests/e2e/artifacts/screenshots/challenger_boot_verification.png');
    await driver.captureScreenshot(screenshotPath);

    console.log(`[PASS] Executable booted in ${bootDuration}ms`);
    console.log(`       Document title: "${targetTitle}"`);
    console.log(`       Document readyState: "${documentReady}"`);
    console.log(`       Tauri Internals API present: ${tauriDefined}`);
    console.log(`       Header element mounted: ${headerExists}`);

    if (!tauriDefined || !headerExists) {
      throw new Error('Native app booted but runtime environment is invalid or unmounted.');
    }

    results.bootAndCdp = {
      status: 'PASS',
      durationMs: bootDuration,
      targetTitle,
      tauriDefined,
      headerExists,
      screenshot: screenshotPath,
    };

    // ------------------------------------------------------------------
    // TEST 2: High Concurrency Port Limits & Boundary Stress
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 2] High Concurrency Port Scanning & Port Limit Boundaries...');
    const portStressCases = [
      { name: 'Extreme Concurrency (250 workers on 1.1.1.1)', config: { target: '1.1.1.1', ports: '80,443,8080,8443,53', concurrency: 250, timeout_ms: 1000 } },
      { name: 'Invalid Port Values (-1, 0, 65536, 99999)', config: { target: '1.1.1.1', ports: '-1,0,80,65536,99999', concurrency: 100, timeout_ms: 1000 } },
      { name: 'Boundary port range (65530-65535, u16 max)', config: { target: '1.1.1.1', ports: '65530-65535', concurrency: 50, timeout_ms: 1000 } },
      { name: 'Malformed Port String Syntax (abc,,,,,!@#$)', config: { target: '1.1.1.1', ports: 'abc,,,,,!@#$', concurrency: 50, timeout_ms: 1000 } },
      { name: 'Top-20 Port Preset on Gateway 192.168.1.1', config: { target: '192.168.1.1', ports: 'top-20', concurrency: 100, timeout_ms: 1000 } },
    ];

    const portResults = [];
    for (const tc of portStressCases) {
      const t0 = Date.now();
      try {
        const res = await driver.invokeIpc('scan_ports', { config: tc.config });
        const dt = Date.now() - t0;
        console.log(`  ✔ [PASS] ${tc.name} -> handled in ${dt}ms (success: ${res.success}, open: ${res.data?.open_count ?? 0}, closed: ${res.data?.closed_count ?? 0})`);
        portResults.push({ name: tc.name, success: res.success, durationMs: dt, data: res.data ? { open: res.data.open_count, closed: res.data.closed_count } : res.error });
      } catch (err) {
        console.error(`  ✖ [FAIL] ${tc.name} -> crashed/rejected:`, err.message);
        portResults.push({ name: tc.name, error: err.message });
      }
    }

    results.highConcurrencyPorts = {
      status: portResults.every((r) => !r.error) ? 'PASS' : 'FAIL',
      cases: portResults,
    };

    // ------------------------------------------------------------------
    // TEST 3: Rapid Concurrent IPC Bombardment (50 Parallel Invocations)
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 3] Rapid Concurrent IPC Bombardment (50 parallel invocations)...');
    const rapidStart = Date.now();
    const parallelCalls = [];
    for (let i = 0; i < 50; i++) {
      if (i % 3 === 0) {
        parallelCalls.push(driver.invokeIpc('check_elevation_status'));
      } else if (i % 3 === 1) {
        parallelCalls.push(driver.invokeIpc('calculate_subnet', { cidr: '192.168.1.0/24' }));
      } else {
        parallelCalls.push(driver.invokeIpc('get_network_interfaces'));
      }
    }

    const settled = await Promise.allSettled(parallelCalls);
    const rapidDuration = Date.now() - rapidStart;
    const fulfilled = settled.filter((s) => s.status === 'fulfilled');
    const rejected = settled.filter((s) => s.status === 'rejected');
    console.log(`  ✔ Bombardment complete: ${fulfilled.length}/50 succeeded, ${rejected.length} rejected in ${rapidDuration}ms`);

    results.rapidIpcBombardment = {
      status: rejected.length === 0 ? 'PASS' : 'FAIL',
      total: 50,
      fulfilled: fulfilled.length,
      rejected: rejected.length,
      durationMs: rapidDuration,
    };

    // ------------------------------------------------------------------
    // TEST 4: Malformed IP & Subnet Math Boundary Stress
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 4] Malformed IP & Subnet Math Boundaries...');
    const subnetVectors = [
      { cidr: '0.0.0.0/0', desc: 'Default Route /0 (4,294,967,296 total addresses)' },
      { cidr: '10.0.0.1/32', desc: 'Host Route /32 (Single address)' },
      { cidr: '192.168.1.1/31', desc: 'Point-to-Point /31 (RFC 3021, 2 usable)' },
      { cidr: '192.168.1.1/33', desc: 'Prefix /33 (Exceeds IPv4 32 boundary)' },
      { cidr: '192.168.1.1/-1', desc: 'Negative prefix /-1' },
      { cidr: '999.999.999.999/24', desc: 'Octets > 255' },
      { cidr: 'not-an-ip/24', desc: 'Alphabetical characters' },
      { cidr: '10.0.0.0/24', vlsm: [['Huge Demand', 1000000]], desc: 'VLSM Exceeding Parent Subnet Capacity' },
      { cidr: '10.0.0.0/24', vlsm: [['Zero Hosts', 0]], desc: 'VLSM 0 Hosts' },
      { cidr: '10.0.0.0/24', vlsm: [['Subnet A', 50], ['Subnet B', 25], ['Subnet C', 10]], desc: 'Valid Multi-Tier VLSM' },
    ];

    const subnetResults = [];
    for (const sv of subnetVectors) {
      try {
        const res = await driver.invokeIpc('calculate_subnet', {
          cidr: sv.cidr,
          vlsm_requests: sv.vlsm || null,
        });
        console.log(`  Subnet [${sv.desc}]: success=${res.success}, totalHosts=${res.data?.totalHosts ?? 'N/A'}, usable=${res.data?.usableHosts ?? 'N/A'}, err=${res.error?.message ?? 'None'}`);
        subnetResults.push({
          desc: sv.desc,
          cidr: sv.cidr,
          success: res.success,
          totalHosts: res.data?.totalHosts,
          usableHosts: res.data?.usableHosts,
          error: res.error?.message,
        });
      } catch (err) {
        console.log(`  Subnet [${sv.desc}]: IPC Exception -> ${err.message}`);
        subnetResults.push({ desc: sv.desc, cidr: sv.cidr, exception: err.message });
      }
    }

    // Verify /0 didn't overflow
    const zeroTest = subnetResults.find((r) => r.cidr === '0.0.0.0/0');
    const overflowHandled = zeroTest && zeroTest.success && zeroTest.totalHosts === '4294967296';
    const boundaryRejected = subnetResults.some((r) => r.cidr === '192.168.1.1/33' && !r.success);

    results.malformedIpSubnet = {
      status: overflowHandled && boundaryRejected ? 'PASS' : 'FAIL',
      overflowHandled,
      boundaryRejected,
      vectors: subnetResults,
    };

    // ------------------------------------------------------------------
    // TEST 5: Active ICMP Cancellation (Traceroute)
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 5] Active ICMP Traceroute Cancellation...');
    // Start trace to non-routable / slow destination
    const traceStartRes = await driver.invokeIpc('run_traceroute', {
      config: {
        target: '192.0.2.1', // RFC 5737 TEST-NET-1 (blackhole / unrouted)
        maxHops: 30,
        timeout: { secs: 1, nanos: 0 },
        probesPerHop: 3,
        isMtr: false,
      },
    });

    const traceSessionId = traceStartRes.data?.sessionId || traceStartRes.data?.session_id;
    if (!traceStartRes.success || !traceSessionId) {
      throw new Error(`Failed to start traceroute: ${JSON.stringify(traceStartRes)}`);
    }

    console.log(`  Traceroute session created: ${traceSessionId}`);
    // Wait 400ms then cancel mid-flight
    await new Promise((r) => setTimeout(r, 400));
    const cancelTraceRes = await driver.invokeIpc('stop_traceroute', { sessionId: traceSessionId });
    console.log(`  Stop traceroute response: success=${cancelTraceRes.success}, stopped=${cancelTraceRes.data}`);

    results.icmpTraceCancellation = {
      status: cancelTraceRes.success && cancelTraceRes.data === true ? 'PASS' : 'FAIL',
      sessionId: traceSessionId,
      stopped: cancelTraceRes.data,
    };

    // ------------------------------------------------------------------
    // TEST 6: Active ICMP Ping Cancellation & High-Frequency Stream
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 6] Active High-Frequency ICMP Ping & Cancellation...');
    const pingStartRes = await driver.invokeIpc('start_continuous_ping', {
      config: {
        target: '1.1.1.1',
        interval: { secs: 0, nanos: 100000000 }, // High frequency 10 Hz (100ms)
        packetSize: 56,
        dfBit: false,
        timeout: { secs: 1, nanos: 0 },
      },
    });

    const pingSessionId = pingStartRes.data?.sessionId || pingStartRes.data?.session_id;
    if (!pingStartRes.success || !pingSessionId) {
      throw new Error(`Failed to start continuous ping: ${JSON.stringify(pingStartRes)}`);
    }

    console.log(`  Ping session created: ${pingSessionId}`);

    // Wait 600ms (should generate ~6 ticks) then cancel
    await new Promise((r) => setTimeout(r, 600));
    const cancelPingRes = await driver.invokeIpc('stop_continuous_ping', { sessionId: pingSessionId });
    console.log(`  Stop ping response: success=${cancelPingRes.success}, stopped=${cancelPingRes.data}`);

    results.icmpPingCancellation = {
      status: cancelPingRes.success && cancelPingRes.data === true ? 'PASS' : 'FAIL',
      sessionId: pingSessionId,
      stopped: cancelPingRes.data,
    };

    // ------------------------------------------------------------------
    // TEST 7: Watchdog Behavior & State Machine Integrity
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 7] Sentinel Watchdog Lifecycle & State Integrity...');
    const initStatus = await driver.invokeIpc('get_watchdog_status');
    console.log(`  Initial watchdog status: running=${initStatus.data?.running}`);

    const startRes = await driver.invokeIpc('start_watchdog', { config: null });
    await new Promise((r) => setTimeout(r, 1000));
    const activeStatus = await driver.invokeIpc('get_watchdog_status');
    const targetCount = activeStatus.data?.target_statuses?.length ?? activeStatus.data?.targetStatuses?.length ?? 0;
    console.log(`  Active watchdog status: running=${activeStatus.data?.running}, targets=${targetCount}`);

    const stopRes = await driver.invokeIpc('stop_watchdog');
    await new Promise((r) => setTimeout(r, 500));
    const stoppedStatus = await driver.invokeIpc('get_watchdog_status');
    console.log(`  Stopped watchdog status: running=${stoppedStatus.data?.running}`);

    // Cycle 2: Re-entry check
    const startRes2 = await driver.invokeIpc('start_watchdog', { config: null });
    await new Promise((r) => setTimeout(r, 500));
    const stopRes2 = await driver.invokeIpc('stop_watchdog');
    await new Promise((r) => setTimeout(r, 500));
    const stoppedStatus2 = await driver.invokeIpc('get_watchdog_status');
    console.log(`  Cycle 2 completed cleanly: running=${stoppedStatus2.data?.running}`);

    const watchdogOk = startRes.success && activeStatus.data?.running === true &&
                       stopRes.success && stoppedStatus.data?.running === false &&
                       startRes2.success && stoppedStatus2.data?.running === false;

    results.watchdogRapidToggle = {
      status: watchdogOk ? 'PASS' : 'FAIL',
      initialRunning: initStatus.data?.running,
      activeRunning: activeStatus.data?.running,
      stoppedRunning: stoppedStatus.data?.running,
      cycle2Stopped: stoppedStatus2.data?.running,
    };

    // ------------------------------------------------------------------
    // TEST 8: Live Egress Discovery & Real Network Resolution
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 8] Live Egress IP & Network Discovery...');
    const egressRes = await driver.invokeIpc('trace_ip', { target: '', options: { force_refresh: true } });
    console.log(`  Egress query: success=${egressRes.success}, ip=${egressRes.data?.ip}, isp=${egressRes.data?.isp}, city=${egressRes.data?.city}`);

    results.liveEgressDiscovery = {
      status: egressRes.success && !!egressRes.data?.ip ? 'PASS' : 'FAIL',
      data: egressRes.data ? {
        ip: egressRes.data.ip,
        isp: egressRes.data.isp,
        city: egressRes.data.city,
        country: egressRes.data.country,
        provider: egressRes.data.provider,
        responseTimeMs: egressRes.data.response_time_ms,
      } : null,
    };

    // ------------------------------------------------------------------
    // TEST 9: On-the-Fly Report Engine & PCAP Binary Header Inspection
    // ------------------------------------------------------------------
    console.log('\n>>> [TEST 9] Real-Time Report Export & Libpcap Byte Validation...');
    const formats = ['HTML', 'CSV', 'JSON', 'PCAP'];
    const reportArtifacts = {};

    for (const fmt of formats) {
      const isPing = fmt === 'PCAP' || fmt === 'CSV';
      const reqPayload = {
        format: fmt,
        reportType: isPing ? 'PING_SERIES' : 'FULL_AUDIT',
        title: `Challenger Empirical Audit - ${fmt}`,
        target: '1.1.1.1',
      };
      if (isPing) {
        reqPayload.pingSamples = [
          { seq: 1, ttl: 56, rttMs: 12.3, status: 'SUCCESS', timestampMs: Date.now() },
          { seq: 2, ttl: 56, rttMs: 11.9, status: 'SUCCESS', timestampMs: Date.now() + 100 },
          { seq: 3, ttl: 56, rttMs: 13.5, status: 'SUCCESS', timestampMs: Date.now() + 200 },
        ];
      }

      const res = await driver.invokeIpc('export_report', { request: reqPayload });

      if (!res.success || !res.data) {
        throw new Error(`Export ${fmt} failed: ${JSON.stringify(res)}`);
      }

      const content = fmt === 'PCAP' ? res.data.contentBase64 : res.data.contentText;
      reportArtifacts[fmt] = {
        filename: res.data.filename,
        mimeType: res.data.mimeType || res.data.mime_type,
        sizeBytes: res.data.sizeBytes || res.data.size_bytes,
        hasData: !!content,
      };

      if (fmt === 'PCAP') {
        const rawBuf = Buffer.from(res.data.contentBase64, 'base64');
        const pcapMagicLE = rawBuf.readUInt32LE(0);
        const pcapMagicBE = rawBuf.readUInt32BE(0);
        const pcapVerMaj = rawBuf.readUInt16LE(4);
        const pcapVerMin = rawBuf.readUInt16LE(6);
        const pcapLinkType = rawBuf.readUInt32LE(20);

        reportArtifacts.PCAP.magicHex = '0x' + pcapMagicLE.toString(16);
        reportArtifacts.PCAP.version = `${pcapVerMaj}.${pcapVerMin}`;
        reportArtifacts.PCAP.linkType = pcapLinkType;
        reportArtifacts.PCAP.actualByteLength = rawBuf.length;

        const isPcapValid = (pcapMagicLE === 0xa1b2c3d4 || pcapMagicBE === 0xa1b2c3d4) &&
                            pcapVerMaj === 2 && pcapVerMin === 4 &&
                            pcapLinkType === 1;

        if (!isPcapValid) {
          throw new Error(`Corrupt PCAP generated: magic=${reportArtifacts.PCAP.magicHex}, ver=${pcapVerMaj}.${pcapVerMin}, link=${pcapLinkType}`);
        }
        console.log(`  ✔ PCAP Verified: magic=${reportArtifacts.PCAP.magicHex}, ver=${reportArtifacts.PCAP.version}, linkType=${pcapLinkType}, length=${rawBuf.length} bytes`);
      } else {
        console.log(`  ✔ Exported ${fmt}: ${res.data.filename} (${res.data.size_bytes} bytes)`);
      }
    }

    results.reportAndPcapValidation = {
      status: 'PASS',
      formats: reportArtifacts,
    };

    console.log('\n======================================================================');
    console.log('   ALL CHALLENGER 1 STRESS TESTS COMPLETED SUCCESSFULLY');
    console.log('======================================================================');

  } catch (err) {
    console.error('\n❌ CRITICAL CHALLENGER HARNESS FAILURE:', err);
  } finally {
    console.log('\nCleaning up and stopping native desktop executable...');
    await driver.stop();
  }

  const overallDuration = Date.now() - testStartTime;
  results.overallDurationMs = overallDuration;

  // Write telemetry output
  const outPath = path.join(projectRoot, 'tests/e2e/artifacts/telemetry/challenger_stress_results.json');
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`Challenger test results saved: ${outPath}`);

  return results;
}

runChallengerHarness().then((res) => {
  const allPassed = Object.values(res).every((v) => typeof v !== 'object' || v === null || v.status === undefined || v.status === 'PASS');
  console.log(`Challenger Final Status: ${allPassed ? 'ALL PASS' : 'FAILURES DETECTED'}`);
  process.exit(allPassed ? 0 : 1);
});
