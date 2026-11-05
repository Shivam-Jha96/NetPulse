/**
 * IPTracer Workstation — Interactive Prototype Engine
 * Pure ES6+, zero external runtime dependencies.
 * Provides live telemetry, canvas route mapping, RFC 3550 jitter calculation,
 * real bitwise subnet math, and responsive view management.
 */

(function () {
  'use strict';

  // =========================================================================
  // State Management
  // =========================================================================
  const state = {
    theme: 'dark',
    activeView: 'dashboard',
    activeUtilTab: 'ping',
    clientEgress: {
      ip: '104.28.19.42',
      country: 'US',
      countryFlag: '🇺🇸',
      city: 'San Francisco',
      region: 'CA',
      asn: 'AS13335',
      org: 'Cloudflare, Inc.',
      latency: 11.8,
      coords: [37.7749, -122.4194]
    },
    traceTarget: '8.8.8.8',
    mapZoom: 1.0,
    mapPan: { x: 0, y: 0 },
    pingRunning: true,
    pingIntervalId: null,
    pingIntervalMs: 500,
    pingData: [],
    pingStats: {
      sent: 0,
      received: 0,
      lost: 0,
      min: Infinity,
      max: -Infinity,
      avg: 0,
      jitter: 0,
      lastRtt: 0
    },
    portScanActive: false
  };

  // Mock Target Route Database for Realistic Traces
  const mockTargets = {
    '8.8.8.8': {
      resolvedIp: '8.8.8.8',
      hostname: 'dns.google',
      asn: 'AS15169',
      org: 'Google LLC',
      cidr: '8.8.8.0/24',
      threatScore: 0,
      threatLabel: '0% Clean',
      threatVerdict: 'No malicious reports found in AbuseIPDB / VT databases.',
      abuseReports: 0,
      vtEngines: '0 / 89 Flagged',
      torExit: 'No (Clean)',
      datacenter: 'Anycast Datacenter',
      destCoords: [37.4220, -122.0841],
      hops: [
        { hop: 1, ip: '192.168.1.1', ptr: 'gateway.local', carrier: 'Private Gateway', loss: '0.0%', rtt: 1.2, status: 'OPEN' },
        { hop: 2, ip: '10.120.0.1', ptr: 'gw-isp.sf.comcast.net', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 6.4, status: 'OPEN' },
        { hop: 3, ip: '68.86.90.14', ptr: 'be-201-ar01.hayward.ca', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 9.1, status: 'OPEN' },
        { hop: 4, ip: '142.250.238.16', ptr: 'peer-as15169.sfo.google.com', carrier: 'Google (AS15169)', loss: '0.0%', rtt: 11.3, status: 'OPEN' },
        { hop: 5, ip: '8.8.8.8', ptr: 'dns.google', carrier: 'Google (AS15169)', loss: '0.0%', rtt: 12.1, status: 'DESTINATION' }
      ]
    },
    '1.1.1.1': {
      resolvedIp: '1.1.1.1',
      hostname: 'one.one.one.one',
      asn: 'AS13335',
      org: 'Cloudflare, Inc.',
      cidr: '1.1.1.0/24',
      threatScore: 0,
      threatLabel: '0% Clean',
      threatVerdict: 'Legitimate Anycast recursive resolver. Clean threat profile.',
      abuseReports: 0,
      vtEngines: '0 / 89 Flagged',
      torExit: 'No (Clean)',
      datacenter: 'Cloudflare Anycast Edge',
      destCoords: [34.0522, -118.2437],
      hops: [
        { hop: 1, ip: '192.168.1.1', ptr: 'gateway.local', carrier: 'Private Gateway', loss: '0.0%', rtt: 1.1, status: 'OPEN' },
        { hop: 2, ip: '10.120.0.1', ptr: 'gw-isp.sf.comcast.net', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 5.8, status: 'OPEN' },
        { hop: 3, ip: '162.158.84.1', ptr: 'cf-transit.sfo.cloudflare.com', carrier: 'Cloudflare (AS13335)', loss: '0.0%', rtt: 8.2, status: 'OPEN' },
        { hop: 4, ip: '1.1.1.1', ptr: 'one.one.one.one', carrier: 'Cloudflare (AS13335)', loss: '0.0%', rtt: 8.4, status: 'DESTINATION' }
      ]
    },
    'github.com': {
      resolvedIp: '140.82.121.4',
      hostname: 'lb-140-82-121-4-iad.github.com',
      asn: 'AS36459',
      org: 'GitHub, Inc. (Microsoft)',
      cidr: '140.82.112.0/20',
      threatScore: 0,
      threatLabel: '0% Clean',
      threatVerdict: 'Reputable developer platform hosting infrastructure.',
      abuseReports: 0,
      vtEngines: '0 / 89 Flagged',
      torExit: 'No (Clean)',
      datacenter: 'Microsoft Azure Anycast',
      destCoords: [39.0438, -77.4874],
      hops: [
        { hop: 1, ip: '192.168.1.1', ptr: 'gateway.local', carrier: 'Private Gateway', loss: '0.0%', rtt: 1.3, status: 'OPEN' },
        { hop: 2, ip: '10.120.0.1', ptr: 'gw-isp.sf.comcast.net', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 6.2, status: 'OPEN' },
        { hop: 3, ip: '68.86.84.2', ptr: 'be-300-ar01.denver.co', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 28.5, status: 'OPEN' },
        { hop: 4, ip: '68.86.85.1', ptr: 'be-500-ar01.chicago.il', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 48.1, status: 'OPEN' },
        { hop: 5, ip: '140.82.121.4', ptr: 'github.com', carrier: 'GitHub (AS36459)', loss: '0.0%', rtt: 71.4, status: 'DESTINATION' }
      ]
    },
    '185.220.101.5': {
      resolvedIp: '185.220.101.5',
      hostname: 'tor-exit-node-05.torservers.net',
      asn: 'AS208294',
      org: 'Zwiebelfreunde e.V.',
      cidr: '185.220.101.0/24',
      threatScore: 88,
      threatLabel: '88% Malicious',
      threatVerdict: 'Confirmed Tor Exit Relay with high volume of automated brute-force reports.',
      abuseReports: 142,
      vtEngines: '18 / 89 Flagged',
      torExit: 'YES (Confirmed Relay)',
      datacenter: 'Hosting / Anonymizer',
      destCoords: [50.1109, 8.6821], // Frankfurt
      hops: [
        { hop: 1, ip: '192.168.1.1', ptr: 'gateway.local', carrier: 'Private Gateway', loss: '0.0%', rtt: 1.2, status: 'OPEN' },
        { hop: 2, ip: '10.120.0.1', ptr: 'gw-isp.sf.comcast.net', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 6.1, status: 'OPEN' },
        { hop: 3, ip: '68.86.90.14', ptr: 'be-201-ar01.newyork.ny', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 72.4, status: 'OPEN' },
        { hop: 4, ip: '213.248.83.1', ptr: 'tatane-transit.lon.telia.net', carrier: 'Telia Carrier (AS1299)', loss: '0.0%', rtt: 118.2, status: 'OPEN' },
        { hop: 5, ip: '62.115.112.5', ptr: 'ffm-b1-link.ip.twelve99.net', carrier: 'Arelion (AS1299)', loss: '0.0%', rtt: 134.5, status: 'OPEN' },
        { hop: 6, ip: '185.220.101.5', ptr: 'tor-exit-node-05.torservers.net', carrier: 'Zwiebelfreunde (AS208294)', loss: '0.0%', rtt: 141.2, status: 'DESTINATION' }
      ]
    }
  };

  // =========================================================================
  // Initialization & Event Wiring
  // =========================================================================
  document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initTheme();
    initQuickTrace();
    initWorldMapCanvas();
    initRouteMapCanvas();
    initPingMonitor();
    initPortScanner();
    initSubnetCalculator();
    initDnsInspector();
    initWhoisInspector();
    initLanDiscovery();
    initSettingsVault();
    initKeyboardShortcuts();

    // Default trace run
    executeTrace('8.8.8.8');
  });

  // =========================================================================
  // View Navigation
  // =========================================================================
  function initNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
      item.addEventListener('click', () => {
        const viewId = item.getAttribute('data-view');
        switchView(viewId);
      });
    });

    // Utilities Sub-tabs
    const utilTabs = document.querySelectorAll('.util-tab-btn');
    utilTabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.getAttribute('data-tab');
        switchUtilTab(targetTab);
      });
    });

    // Sidebar Egress Card click to copy
    const egressCard = document.getElementById('sidebarEgressCard');
    if (egressCard) {
      egressCard.addEventListener('click', () => {
        navigator.clipboard.writeText(state.clientEgress.ip).then(() => {
          showToast(`Copied egress IP ${state.clientEgress.ip} to clipboard`);
        });
      });
    }

    // Recent activity trace buttons
    document.querySelectorAll('.table-trace-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const target = e.target.getAttribute('data-target');
        switchView('trace');
        executeTrace(target);
      });
    });
  }

  function switchView(viewId) {
    state.activeView = viewId;
    document.querySelectorAll('.nav-item').forEach(item => {
      item.classList.toggle('active', item.getAttribute('data-view') === viewId);
    });
    document.querySelectorAll('.view-section').forEach(section => {
      section.classList.toggle('active', section.id === `view-${viewId}`);
    });

    // Trigger canvas redraws on visible view
    if (viewId === 'dashboard') {
      drawWorldMap();
    } else if (viewId === 'trace') {
      drawRouteMap();
    } else if (viewId === 'utilities' && state.activeUtilTab === 'ping') {
      drawPingSparkline();
    }
  }

  function switchUtilTab(tabId) {
    state.activeUtilTab = tabId;
    document.querySelectorAll('.util-tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.util-content-pane').forEach(pane => {
      pane.classList.toggle('active', pane.id === `tab-${tabId}`);
    });

    if (tabId === 'ping') {
      drawPingSparkline();
    }
  }

  // =========================================================================
  // Theme Management
  // =========================================================================
  function initTheme() {
    const themeBtn = document.getElementById('themeToggleBtn');
    const savedTheme = localStorage.getItem('iptracer_theme') || 'dark';
    applyTheme(savedTheme);

    themeBtn.addEventListener('click', () => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      applyTheme(nextTheme);
      showToast(`Switched to ${nextTheme === 'dark' ? 'Dark Cyber' : 'Modern Light'} theme`);
    });
  }

  function applyTheme(theme) {
    state.theme = theme;
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('iptracer_theme', theme);

    // Redraw canvases with new theme colors
    drawWorldMap();
    drawRouteMap();
    drawPingSparkline();
  }

  // =========================================================================
  // Quick Trace & Search Bar
  // =========================================================================
  function initQuickTrace() {
    const globalInput = document.getElementById('globalSearchInput');
    const dashInput = document.getElementById('dashboardTraceInput');
    const dashBtn = document.getElementById('dashboardTraceBtn');
    const traceDetailInput = document.getElementById('traceDetailInput');
    const runTraceBtn = document.getElementById('runTraceBtn');

    function triggerTrace(val) {
      if (!val || !val.trim()) return;
      const target = val.trim();
      switchView('trace');
      executeTrace(target);
    }

    if (globalInput) {
      globalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerTrace(globalInput.value);
      });
    }

    if (dashInput && dashBtn) {
      dashBtn.addEventListener('click', () => triggerTrace(dashInput.value));
      dashInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerTrace(dashInput.value);
      });
    }

    if (traceDetailInput && runTraceBtn) {
      runTraceBtn.addEventListener('click', () => triggerTrace(traceDetailInput.value));
      traceDetailInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') triggerTrace(traceDetailInput.value);
      });
    }

    // Preset pills on Dashboard
    document.querySelectorAll('.preset-pill').forEach(pill => {
      pill.addEventListener('click', () => {
        const preset = pill.getAttribute('data-preset');
        if (dashInput) dashInput.value = preset;
        triggerTrace(preset);
      });
    });
  }

  // =========================================================================
  // Core IP Trace & Route Logic
  // =========================================================================
  function executeTrace(target) {
    state.traceTarget = target;
    const input = document.getElementById('traceDetailInput');
    if (input) input.value = target;

    const data = mockTargets[target] || generateDynamicTarget(target);

    // Update Threat Dossier
    const threatScoreDisplay = document.getElementById('threatScoreDisplay');
    const threatGaugeArc = document.getElementById('threatGaugeArc');
    const threatVerdict = document.getElementById('threatScoreVerdict');
    const threatAbuseReports = document.getElementById('threatAbuseReports');
    const threatVtScore = document.getElementById('threatVtScore');
    const threatTorFlag = document.getElementById('threatTorFlag');
    const threatProxyFlag = document.getElementById('threatProxyFlag');

    if (threatScoreDisplay) {
      threatScoreDisplay.textContent = data.threatLabel;
      threatScoreDisplay.style.color = data.threatScore > 50 ? 'var(--status-danger)' : 'var(--status-success)';
    }

    if (threatGaugeArc) {
      threatGaugeArc.setAttribute('stroke-dasharray', `${data.threatScore}, 100`);
      threatGaugeArc.setAttribute('stroke', data.threatScore > 50 ? 'var(--status-danger)' : 'var(--status-success)');
    }

    if (threatVerdict) threatVerdict.textContent = data.threatVerdict;
    if (threatAbuseReports) threatAbuseReports.textContent = `${data.abuseReports} Verified`;
    if (threatVtScore) threatVtScore.textContent = data.vtEngines;
    if (threatTorFlag) threatTorFlag.textContent = data.torExit;
    if (threatProxyFlag) threatProxyFlag.textContent = data.datacenter;

    // Update Authority & ASN Card
    const asnValue = document.getElementById('asnValue');
    const orgValue = document.getElementById('orgValue');
    const cidrValue = document.getElementById('cidrValue');
    if (asnValue) asnValue.textContent = data.asn;
    if (orgValue) orgValue.textContent = data.org;
    if (cidrValue) cidrValue.textContent = data.cidr;

    // Render Hop Table
    const tbody = document.getElementById('hopTableTbody');
    if (tbody) {
      tbody.innerHTML = '';
      data.hops.forEach(hop => {
        const tr = document.createElement('tr');
        const badgeClass = hop.rtt < 20 ? 'success' : (hop.rtt < 100 ? 'warning' : 'danger');
        tr.innerHTML = `
          <td class="mono-cell" style="font-weight: 700; color: var(--accent-cyan);">${hop.hop}</td>
          <td class="mono-cell" style="font-weight: 600;">${hop.ip}</td>
          <td class="mono-cell" style="color: var(--text-secondary);">${hop.ptr}</td>
          <td>${hop.carrier}</td>
          <td class="mono-cell">${hop.loss}</td>
          <td class="mono-cell">${hop.rtt.toFixed(1)} ms</td>
          <td class="mono-cell" style="font-weight: 700;">${(hop.rtt * 0.98).toFixed(1)} ms</td>
          <td><span class="stat-badge ${badgeClass}">● ${hop.rtt < 30 ? 'Fast' : (hop.rtt < 100 ? 'Moderate' : 'High Latency')}</span></td>
        `;
        tbody.appendChild(tr);
      });
    }

    const hopCountBadge = document.getElementById('hopCountBadge');
    if (hopCountBadge) {
      hopCountBadge.textContent = `${data.hops.length} Hops Discovered • Route Complete (${data.hops[data.hops.length - 1].rtt}ms RTT)`;
    }

    const summaryLabel = document.getElementById('routeSummaryLabel');
    if (summaryLabel) {
      summaryLabel.textContent = `Route: Local Host (San Francisco) → ${data.org} (${data.resolvedIp})`;
    }

    // Trigger Route Map Canvas Animation
    drawRouteMap(data);
    showToast(`Trace complete for ${target} (${data.hops.length} hops)`);
  }

  function generateDynamicTarget(target) {
    const isIp = /^(\d{1,3}\.){3}\d{1,3}$/.test(target);
    const resolvedIp = isIp ? target : '104.21.45.12';
    return {
      resolvedIp: resolvedIp,
      hostname: target,
      asn: 'AS13335',
      org: 'Cloudflare / Akamai Transit',
      cidr: `${resolvedIp}/24`,
      threatScore: 0,
      threatLabel: '0% Clean',
      threatVerdict: 'Dynamically resolved target with standard route metrics.',
      abuseReports: 0,
      vtEngines: '0 / 89 Flagged',
      torExit: 'No (Clean)',
      datacenter: 'Anycast CDN Edge',
      destCoords: [40.7128, -74.0060],
      hops: [
        { hop: 1, ip: '192.168.1.1', ptr: 'gateway.local', carrier: 'Private Gateway', loss: '0.0%', rtt: 1.2, status: 'OPEN' },
        { hop: 2, ip: '10.120.0.1', ptr: 'gw-isp.sf.comcast.net', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 6.4, status: 'OPEN' },
        { hop: 3, ip: '68.86.90.14', ptr: 'be-201-ar01.chicago.il', carrier: 'Comcast (AS7922)', loss: '0.0%', rtt: 34.2, status: 'OPEN' },
        { hop: 4, ip: resolvedIp, ptr: target, carrier: 'Carrier Edge', loss: '0.0%', rtt: 48.6, status: 'DESTINATION' }
      ]
    };
  }

  // =========================================================================
  // Global Topology World Map Canvas (Dashboard)
  // =========================================================================
  function initWorldMapCanvas() {
    const canvas = document.getElementById('worldMapCanvas');
    if (!canvas) return;

    window.addEventListener('resize', () => drawWorldMap());
    const refreshBtn = document.getElementById('refreshMapBtn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        drawWorldMap();
        showToast('Active OS sockets synchronized');
      });
    }
    drawWorldMap();
  }

  function drawWorldMap() {
    const canvas = document.getElementById('worldMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;

    // Clear background
    ctx.fillStyle = state.theme === 'dark' ? '#060a14' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Subtle Grid Lines
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // World Map Node Coordinates (Normalized to Canvas Dimensions)
    const hostNode = { x: w * 0.18, y: h * 0.38, name: 'San Francisco (Host)' };
    const remoteNodes = [
      { x: w * 0.28, y: h * 0.36, name: 'New York (14 IPs)' },
      { x: w * 0.48, y: h * 0.32, name: 'London (8 IPs)' },
      { x: w * 0.54, y: h * 0.34, name: 'Frankfurt (6 IPs)' },
      { x: w * 0.78, y: h * 0.42, name: 'Tokyo (5 IPs)' },
      { x: w * 0.85, y: h * 0.75, name: 'Sydney (3 IPs)' },
      { x: w * 0.34, y: h * 0.72, name: 'São Paulo (2 IPs)' }
    ];

    // Draw Curved Connection Arcs
    remoteNodes.forEach((node, idx) => {
      ctx.beginPath();
      ctx.moveTo(hostNode.x, hostNode.y);
      const cpX = (hostNode.x + node.x) / 2;
      const cpY = Math.min(hostNode.y, node.y) - 30 - (idx * 5);
      ctx.quadraticCurveTo(cpX, cpY, node.x, node.y);

      ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 240, 255, 0.35)' : 'rgba(2, 132, 199, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 4]);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Remote Pin
      ctx.beginPath();
      ctx.arc(node.x, node.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = state.theme === 'dark' ? '#a855f7' : '#7c3aed';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Node label
      ctx.font = '9px var(--font-mono)';
      ctx.fillStyle = state.theme === 'dark' ? '#94a3b8' : '#475569';
      ctx.fillText(node.name, node.x + 8, node.y + 3);
    });

    // Draw Host Node with Pulsing Beacon
    ctx.beginPath();
    ctx.arc(hostNode.x, hostNode.y, 10, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(hostNode.x, hostNode.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--status-success)';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = '10px var(--font-mono)';
    ctx.fillStyle = state.theme === 'dark' ? '#00f0ff' : '#0284c7';
    ctx.fillText('HOST ORIGIN (SF)', hostNode.x - 45, hostNode.y - 12);
  }

  // =========================================================================
  // Interactive Route Map Canvas (View 2)
  // =========================================================================
  let routeAnimationId = null;
  let photonProgress = 0;

  function initRouteMapCanvas() {
    const canvas = document.getElementById('routeMapCanvas');
    if (!canvas) return;

    window.addEventListener('resize', () => drawRouteMap());

    const zoomIn = document.getElementById('mapZoomInBtn');
    const zoomOut = document.getElementById('mapZoomOutBtn');
    const resetBtn = document.getElementById('mapResetBtn');

    if (zoomIn) zoomIn.addEventListener('click', () => { state.mapZoom = Math.min(2.0, state.mapZoom + 0.2); drawRouteMap(); });
    if (zoomOut) zoomOut.addEventListener('click', () => { state.mapZoom = Math.max(0.6, state.mapZoom - 0.2); drawRouteMap(); });
    if (resetBtn) resetBtn.addEventListener('click', () => { state.mapZoom = 1.0; state.mapPan = { x: 0, y: 0 }; drawRouteMap(); });

    // Export Buttons
    const exportJson = document.getElementById('exportJsonBtn');
    const exportCsv = document.getElementById('exportCsvBtn');
    const exportPcap = document.getElementById('exportPcapBtn');

    if (exportJson) exportJson.addEventListener('click', () => downloadTraceJson());
    if (exportCsv) exportCsv.addEventListener('click', () => downloadTraceCsv());
    if (exportPcap) exportPcap.addEventListener('click', () => showToast('PCAP generation simulation: Saved trace capture'));
  }

  function drawRouteMap(data) {
    const canvas = document.getElementById('routeMapCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;

    const targetData = data || mockTargets[state.traceTarget] || mockTargets['8.8.8.8'];
    const hops = targetData.hops;

    ctx.save();
    ctx.translate(w / 2 + state.mapPan.x, h / 2 + state.mapPan.y);
    ctx.scale(state.mapZoom, state.mapZoom);
    ctx.translate(-w / 2, -h / 2);

    // Background
    ctx.fillStyle = state.theme === 'dark' ? '#040711' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    // Compute Hop Node Positions spread across horizontal route
    const hopPoints = hops.map((hop, idx) => {
      const step = (w * 0.75) / (hops.length - 1 || 1);
      const x = (w * 0.12) + (step * idx);
      const y = (h * 0.5) + (Math.sin(idx * 0.8) * 40);
      return { x, y, hop };
    });

    // Draw Smooth Curved Route Path
    ctx.beginPath();
    ctx.moveTo(hopPoints[0].x, hopPoints[0].y);
    for (let i = 1; i < hopPoints.length; i++) {
      const prev = hopPoints[i - 1];
      const curr = hopPoints[i];
      const midX = (prev.x + curr.x) / 2;
      const midY = (prev.y + curr.y) / 2 - 20;
      ctx.quadraticCurveTo(midX, midY, curr.x, curr.y);
    }
    ctx.strokeStyle = state.theme === 'dark' ? 'rgba(0, 240, 255, 0.45)' : 'rgba(2, 132, 199, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Draw Hop Pins & Text
    hopPoints.forEach((pt, idx) => {
      const isOrigin = idx === 0;
      const isDest = idx === hopPoints.length - 1;

      // Outer glow circle
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isDest ? 9 : 6, 0, Math.PI * 2);
      ctx.fillStyle = isOrigin ? 'rgba(16, 185, 129, 0.3)' : (isDest ? 'rgba(0, 240, 255, 0.35)' : 'rgba(168, 85, 247, 0.25)');
      ctx.fill();

      // Core Pin
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, isDest ? 6 : 4, 0, Math.PI * 2);
      ctx.fillStyle = isOrigin ? '#10b981' : (isDest ? '#00f0ff' : '#a855f7');
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Hop Label
      ctx.font = '10px var(--font-mono)';
      ctx.fillStyle = state.theme === 'dark' ? '#f8fafc' : '#0f172a';
      ctx.fillText(`Hop ${pt.hop.hop}`, pt.x - 14, pt.y - 12);

      // Latency Subtitle
      ctx.font = '9px var(--font-mono)';
      ctx.fillStyle = state.theme === 'dark' ? '#94a3b8' : '#64748b';
      ctx.fillText(`${pt.hop.rtt}ms`, pt.x - 10, pt.y + 18);
    });

    ctx.restore();
  }

  function downloadTraceJson() {
    const data = mockTargets[state.traceTarget] || mockTargets['8.8.8.8'];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${state.traceTarget}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported trace telemetry as JSON');
  }

  function downloadTraceCsv() {
    const data = mockTargets[state.traceTarget] || mockTargets['8.8.8.8'];
    let csv = 'Hop,IP,PTR,Carrier,Loss,RTT\n';
    data.hops.forEach(h => {
      csv += `${h.hop},"${h.ip}","${h.ptr}","${h.carrier}",${h.loss},${h.rtt}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `trace-${state.traceTarget}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Exported trace telemetry as CSV');
  }

  // =========================================================================
  // Continuous Ping Monitor (Canvas Sparkline & RFC 3550 Jitter)
  // =========================================================================
  function initPingMonitor() {
    const startBtn = document.getElementById('startPingBtn');
    const pauseBtn = document.getElementById('pausePingBtn');
    const resetBtn = document.getElementById('resetPingBtn');
    const targetInput = document.getElementById('pingTargetInput');
    const intervalSelect = document.getElementById('pingIntervalSelect');

    if (startBtn) startBtn.addEventListener('click', startPing);
    if (pauseBtn) pauseBtn.addEventListener('click', pausePing);
    if (resetBtn) resetBtn.addEventListener('click', resetPing);

    if (intervalSelect) {
      intervalSelect.addEventListener('change', () => {
        state.pingIntervalMs = parseInt(intervalSelect.value, 10);
        if (state.pingRunning) {
          pausePing();
          startPing();
        }
      });
    }

    // Seed initial ping samples
    resetPing();
    startPing();
  }

  function startPing() {
    if (state.pingIntervalId) clearInterval(state.pingIntervalId);
    state.pingRunning = true;
    state.pingIntervalId = setInterval(pingTick, state.pingIntervalMs);
    const label = document.getElementById('pingCanvasLabel');
    if (label) {
      const target = document.getElementById('pingTargetInput')?.value || '1.1.1.1';
      label.textContent = `Target: ${target} • Continuous Active ICMP Probes`;
    }
    showToast('Ping session started');
  }

  function pausePing() {
    state.pingRunning = false;
    if (state.pingIntervalId) clearInterval(state.pingIntervalId);
    state.pingIntervalId = null;
    showToast('Ping session paused');
  }

  function resetPing() {
    pausePing();
    state.pingData = [];
    state.pingStats = {
      sent: 0,
      received: 0,
      lost: 0,
      min: Infinity,
      max: -Infinity,
      avg: 0,
      jitter: 0,
      lastRtt: 0
    };
    for (let i = 0; i < 20; i++) {
      pingTick(false);
    }
    updatePingUi();
    drawPingSparkline();
  }

  function pingTick(recordSent = true) {
    if (recordSent) state.pingStats.sent++;

    // Generate realistic latency centered around ~9ms with slight jitter
    const baseLatency = 9.0;
    const noise = (Math.random() - 0.48) * 3.5;
    const rtt = Math.max(5.0, Number((baseLatency + noise).toFixed(2)));

    state.pingStats.received++;
    state.pingData.push(rtt);
    if (state.pingData.length > 50) state.pingData.shift();

    // RFC 3550 Jitter Calculation: J = J + (|D(i-1, i)| - J) / 16
    if (state.pingStats.lastRtt > 0) {
      const diff = Math.abs(rtt - state.pingStats.lastRtt);
      state.pingStats.jitter = state.pingStats.jitter + (diff - state.pingStats.jitter) / 16;
    }
    state.pingStats.lastRtt = rtt;

    // Min / Max / Avg
    state.pingStats.min = Math.min(state.pingStats.min, rtt);
    state.pingStats.max = Math.max(state.pingStats.max, rtt);
    const sum = state.pingData.reduce((a, b) => a + b, 0);
    state.pingStats.avg = sum / state.pingData.length;

    updatePingUi();
    drawPingSparkline();
  }

  function updatePingUi() {
    const minVal = document.getElementById('pingMinVal');
    const avgVal = document.getElementById('pingAvgVal');
    const maxVal = document.getElementById('pingMaxVal');
    const jitterVal = document.getElementById('pingJitterVal');
    const sentVal = document.getElementById('pingSentVal');
    const lossVal = document.getElementById('pingLossVal');

    if (minVal) minVal.textContent = `${state.pingStats.min === Infinity ? '0.0' : state.pingStats.min.toFixed(1)} ms`;
    if (avgVal) avgVal.textContent = `${state.pingStats.avg.toFixed(1)} ms`;
    if (maxVal) maxVal.textContent = `${state.pingStats.max === -Infinity ? '0.0' : state.pingStats.max.toFixed(1)} ms`;
    if (jitterVal) jitterVal.textContent = `${state.pingStats.jitter.toFixed(2)} ms`;
    if (sentVal) sentVal.textContent = state.pingStats.sent;
    if (lossVal) lossVal.textContent = '0.0%';
  }

  function drawPingSparkline() {
    const canvas = document.getElementById('pingSparklineCanvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const w = rect.width;
    const h = rect.height;
    const data = state.pingData;
    if (data.length < 2) return;

    // Background
    ctx.fillStyle = state.theme === 'dark' ? '#050811' : '#f8fafc';
    ctx.fillRect(0, 0, w, h);

    const maxVal = Math.max(...data, 18);
    const minVal = Math.min(...data, 4);
    const range = maxVal - minVal || 1;

    const step = w / (data.length - 1);

    // Build Path
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - 20 - (((val - minVal) / range) * (h - 40));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });

    // Area Gradient Fill
    ctx.lineTo(w, h);
    ctx.lineTo(0, h);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, state.theme === 'dark' ? 'rgba(0, 240, 255, 0.25)' : 'rgba(2, 132, 199, 0.2)');
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.fill();

    // Sparkline Stroke
    ctx.beginPath();
    data.forEach((val, i) => {
      const x = i * step;
      const y = h - 20 - (((val - minVal) / range) * (h - 40));
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = state.theme === 'dark' ? '#00f0ff' : '#0284c7';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw Latest Sample Pulse Dot
    const lastX = w;
    const lastY = h - 20 - (((data[data.length - 1] - minVal) / range) * (h - 40));
    ctx.beginPath();
    ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
    ctx.fillStyle = state.theme === 'dark' ? '#00f0ff' : '#0284c7';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // =========================================================================
  // High-Speed Port Scanner Simulation
  // =========================================================================
  function initPortScanner() {
    const scanBtn = document.getElementById('startPortScanBtn');
    if (!scanBtn) return;

    scanBtn.addEventListener('click', () => {
      if (state.portScanActive) return;
      state.portScanActive = true;
      scanBtn.disabled = true;

      const target = document.getElementById('portScanTargetInput')?.value || '1.1.1.1';
      const statusLabel = document.getElementById('portScanStatusLabel');
      const progressPercent = document.getElementById('portScanProgressPercent');
      const progressBar = document.getElementById('portScanProgressBar');
      const tbody = document.getElementById('portScanTbody');

      if (tbody) tbody.innerHTML = '';
      let progress = 0;

      const discovered = [
        { port: 53, proto: 'TCP', state: 'OPEN', svc: 'domain', banner: 'Cloudflare Ultra-DNS Resolver', rtt: 8.2 },
        { port: 80, proto: 'TCP', state: 'OPEN', svc: 'http', banner: 'cloudflare-nginx • 301 Redirect to HTTPS', rtt: 9.1 },
        { port: 443, proto: 'TCP', state: 'OPEN', svc: 'https', banner: 'TLS 1.3 • X.509: one.one.one.one (Valid to 2027)', rtt: 8.9 },
        { port: 853, proto: 'TCP', state: 'OPEN', svc: 'domain-s', banner: 'DNS-over-TLS (DoT) Listener', rtt: 8.6 },
        { port: 22, proto: 'TCP', state: 'FILTERED', svc: 'ssh', banner: 'Connection Dropped / Admin Prohibited', rtt: 150.0 }
      ];

      const interval = setInterval(() => {
        progress += 10;
        if (progressBar) progressBar.style.width = `${progress}%`;
        if (progressPercent) progressPercent.textContent = `${progress}%`;
        if (statusLabel) statusLabel.textContent = `Scanning ${target} • Concurrency: 250 threads (${progress}%)...`;

        if (progress === 40 && tbody) {
          appendPortRow(tbody, discovered[0]);
          appendPortRow(tbody, discovered[1]);
        } else if (progress === 70 && tbody) {
          appendPortRow(tbody, discovered[2]);
          appendPortRow(tbody, discovered[3]);
        } else if (progress >= 100) {
          clearInterval(interval);
          if (tbody) appendPortRow(tbody, discovered[4]);
          if (statusLabel) statusLabel.textContent = `Scan complete for ${target} • 4 Open Ports Discovered`;
          state.portScanActive = false;
          scanBtn.disabled = false;
          showToast(`Port scan complete for ${target}`);
        }
      }, 200);
    });
  }

  function appendPortRow(tbody, p) {
    const tr = document.createElement('tr');
    const badge = p.state === 'OPEN' ? 'success' : 'warning';
    tr.innerHTML = `
      <td class="mono-cell" style="font-weight: 700; color: var(--accent-cyan);">${p.port}</td>
      <td class="mono-cell">${p.proto}</td>
      <td><span class="stat-badge ${badge}">● ${p.state}</span></td>
      <td>${p.svc}</td>
      <td>${p.banner}</td>
      <td class="mono-cell">${p.rtt.toFixed(1)} ms</td>
    `;
    tbody.appendChild(tr);
  }

  // =========================================================================
  // Interactive Subnet / CIDR Calculator (Real Bitwise Arithmetic)
  // =========================================================================
  function initSubnetCalculator() {
    const ipInput = document.getElementById('subnetIpInput');
    const prefixInput = document.getElementById('subnetPrefixInput');
    const slider = document.getElementById('subnetPrefixSlider');

    if (!ipInput || !prefixInput || !slider) return;

    function handleUpdate(source) {
      if (source === 'slider') prefixInput.value = slider.value;
      if (source === 'input') slider.value = prefixInput.value;
      calculateSubnet(ipInput.value, parseInt(prefixInput.value, 10));
    }

    ipInput.addEventListener('input', () => handleUpdate('none'));
    prefixInput.addEventListener('input', () => handleUpdate('input'));
    slider.addEventListener('input', () => handleUpdate('slider'));

    calculateSubnet(ipInput.value, parseInt(prefixInput.value, 10));
  }

  function calculateSubnet(ipStr, prefix) {
    if (isNaN(prefix) || prefix < 0 || prefix > 32) return;

    const parts = ipStr.trim().split('.');
    if (parts.length !== 4) return;
    const octets = parts.map(p => parseInt(p, 10));
    if (octets.some(o => isNaN(o) || o < 0 || o > 255)) return;

    // Convert IP to 32-bit unsigned integer
    const ipInt = ((octets[0] << 24) >>> 0) + ((octets[1] << 16) >>> 0) + ((octets[2] << 8) >>> 0) + (octets[3] >>> 0);

    // Netmask int
    const maskInt = prefix === 0 ? 0 : (((0xFFFFFFFF << (32 - prefix)) >>> 0));
    const wildcardInt = (~maskInt) >>> 0;

    // Network & Broadcast int
    const netInt = (ipInt & maskInt) >>> 0;
    const bcastInt = (netInt | wildcardInt) >>> 0;

    // Usable hosts
    let firstUsableInt, lastUsableInt, usableHosts, totalHosts;
    totalHosts = Math.pow(2, 32 - prefix);

    if (prefix <= 30) {
      firstUsableInt = netInt + 1;
      lastUsableInt = bcastInt - 1;
      usableHosts = totalHosts - 2;
    } else if (prefix === 31) {
      firstUsableInt = netInt;
      lastUsableInt = bcastInt;
      usableHosts = 2; // RFC 3021 Point-to-point
    } else {
      firstUsableInt = netInt;
      lastUsableInt = netInt;
      usableHosts = 1; // Single host route
    }

    // IP Scope & Class
    const firstOctet = octets[0];
    let ipClass = 'Class A';
    if (firstOctet >= 128 && firstOctet <= 191) ipClass = 'Class B';
    else if (firstOctet >= 192 && firstOctet <= 223) ipClass = 'Class C';
    else if (firstOctet >= 224 && firstOctet <= 239) ipClass = 'Class D (Multicast)';
    else if (firstOctet >= 240) ipClass = 'Class E (Experimental)';

    const isPrivate = (firstOctet === 10) ||
      (firstOctet === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (firstOctet === 192 && octets[1] === 168);

    // Update DOM
    document.getElementById('subNetAddr').textContent = intToIp(netInt);
    document.getElementById('subBcastAddr').textContent = intToIp(bcastInt);
    document.getElementById('subMask').textContent = intToIp(maskInt);
    document.getElementById('subWildcard').textContent = intToIp(wildcardInt);
    document.getElementById('subUsableRange').textContent = `${intToIp(firstUsableInt)} - ${intToIp(lastUsableInt)}`;
    document.getElementById('subHostCount').textContent = `${usableHosts.toLocaleString()} Usable (${totalHosts.toLocaleString()} Total)`;
    document.getElementById('subMaskBinary').textContent = intToBinary(maskInt);
    document.getElementById('subScopeClass').textContent = `${ipClass} • ${isPrivate ? 'RFC 1918 Private' : 'Public Internet'}`;
    document.getElementById('subShortCidr').textContent = `${intToIp(netInt)}/${prefix}`;
  }

  function intToIp(intVal) {
    return [
      (intVal >>> 24) & 255,
      (intVal >>> 16) & 255,
      (intVal >>> 8) & 255,
      intVal & 255
    ].join('.');
  }

  function intToBinary(intVal) {
    const raw = (intVal >>> 0).toString(2).padStart(32, '0');
    return `${raw.slice(0, 8)}.${raw.slice(8, 16)}.${raw.slice(16, 24)}.${raw.slice(24, 32)}`;
  }

  // =========================================================================
  // DNS Inspector & WHOIS RDAP Lookups
  // =========================================================================
  function initDnsInspector() {
    const btn = document.getElementById('runDnsBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const domain = document.getElementById('dnsDomainInput')?.value || 'github.com';
      const type = document.getElementById('dnsTypeSelect')?.value || 'A';
      const tbody = document.getElementById('dnsRecordsTbody');
      if (tbody) {
        tbody.innerHTML = `
          <tr>
            <td class="mono-cell">${domain}.</td>
            <td class="mono-cell" style="color: var(--accent-cyan); font-weight: 700;">${type}</td>
            <td class="mono-cell">60</td>
            <td class="mono-cell">—</td>
            <td class="mono-cell" style="font-weight: 600;">140.82.121.4</td>
          </tr>
          <tr>
            <td class="mono-cell">${domain}.</td>
            <td class="mono-cell" style="color: var(--accent-cyan); font-weight: 700;">${type}</td>
            <td class="mono-cell">60</td>
            <td class="mono-cell">—</td>
            <td class="mono-cell" style="font-weight: 600;">140.82.121.3</td>
          </tr>
        `;
      }
      showToast(`DNS queried for ${domain} (${type} Record)`);
    });
  }

  function initWhoisInspector() {
    const btn = document.getElementById('queryWhoisBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      const target = document.getElementById('whoisTargetInput')?.value || 'github.com';
      showToast(`RDAP lookup complete for ${target}`);
    });
  }

  function initLanDiscovery() {
    const btn = document.getElementById('startLanScanBtn');
    if (!btn) return;
    btn.addEventListener('click', () => {
      showToast('ARP sweep complete: 6 local devices discovered on Ethernet0');
    });
  }

  // =========================================================================
  // Settings & Secrets Vault
  // =========================================================================
  function initSettingsVault() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        showToast('Configuration securely saved to encrypted local vault');
      });
    }

    const checkDbBtn = document.getElementById('checkDbUpdateBtn');
    if (checkDbBtn) {
      checkDbBtn.addEventListener('click', () => {
        showToast('MaxMind GeoLite2 database is up to date (v2026.11.02)');
      });
    }

    // Toggle Eye Buttons
    const abuseEye = document.getElementById('toggleAbuseEye');
    const abuseInput = document.getElementById('abuseApiKeyInput');
    if (abuseEye && abuseInput) {
      abuseEye.addEventListener('click', () => {
        abuseInput.type = abuseInput.type === 'password' ? 'text' : 'password';
      });
    }

    const vtEye = document.getElementById('toggleVtEye');
    const vtInput = document.getElementById('vtApiKeyInput');
    if (vtEye && vtInput) {
      vtEye.addEventListener('click', () => {
        vtInput.type = vtInput.type === 'password' ? 'text' : 'password';
      });
    }
  }

  // =========================================================================
  // Keyboard Navigation Shortcuts
  // =========================================================================
  function initKeyboardShortcuts() {
    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('globalSearchInput');
        if (searchInput) searchInput.focus();
      } else if ((e.ctrlKey || e.metaKey) && e.key === '1') {
        e.preventDefault();
        switchView('dashboard');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '2') {
        e.preventDefault();
        switchView('trace');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '3') {
        e.preventDefault();
        switchView('utilities');
      } else if ((e.ctrlKey || e.metaKey) && e.key === '4') {
        e.preventDefault();
        switchView('settings');
      }
    });
  }

  // =========================================================================
  // Toast Notification System
  // =========================================================================
  function showToast(message) {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--accent-cyan)" stroke-width="2">
        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
        <polyline points="22 4 12 14.01 9 11.01"/>
      </svg>
      <span>${message}</span>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'opacity 250ms, transform 250ms';
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      setTimeout(() => toast.remove(), 250);
    }, 3200);
  }

})();
