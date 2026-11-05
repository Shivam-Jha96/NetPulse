import React, { useEffect, useState, useRef } from 'react';
import {
  Scan,
  Play,
  Square,
  Shield,
  Zap,
  Clock,
  Terminal,
  Lock,
  Layers,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { usePortScanStore } from '../../stores/usePortScanStore';
import { useAppStore } from '../../stores/useAppStore';
import { api } from '../../api/ipc';
import { PortResult } from '../../types';
import * as echarts from 'echarts';

const PRESET_OPTIONS = [
  { id: 'top-20', label: 'Top 20' },
  { id: 'top-100', label: 'Top 100' },
  { id: 'web', label: 'Web (80, 443, 8080)' },
  { id: 'database', label: 'Database' },
  { id: 'mail', label: 'Mail' },
  { id: 'remote', label: 'Remote/SSH' },
  { id: 'custom', label: 'Custom Range' },
];

export const PortScanView: React.FC = () => {
  const {
    target,
    scanType,
    portPreset,
    customPorts,
    concurrency,
    timeoutMs,
    grabBanners,
    isRunning,
    progressPercent,
    openPorts,
    closedCount,
    filteredCount,
    selectedPort,
    scanResult,
    setTarget,
    setScanType,
    setPortPreset,
    setCustomPorts,
    setConcurrency,
    setGrabBanners,
    startScan,
    ingestPort,
    ingestPortBatch,
    completeScan,
    stopScan,
    selectPort,
  } = usePortScanStore();

  const { pushToast } = useAppStore();
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'db' | 'remote'>('all');
  const chartRef = useRef<HTMLDivElement | null>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);

  // Subscribe to 20 Hz batch and individual port discovery events
  useEffect(() => {
    const unlistenBatch = api.onPortFoundBatch((batch) => {
      ingestPortBatch(batch);
    });

    const unlistenSingle = api.onPortFound((port) => {
      ingestPort(port);
    });

    return () => {
      unlistenBatch();
      unlistenSingle();
    };
  }, [ingestPort, ingestPortBatch]);

  // ECharts latency sparkline & distribution
  useEffect(() => {
    if (!chartRef.current) return;

    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current, 'dark', {
        renderer: 'canvas',
      });
    }

    const data = openPorts
      .filter((p) => p.latencyMs !== null && p.latencyMs !== undefined)
      .map((p) => [p.port.toString(), p.latencyMs || 0]);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const item = params[0];
          return `Port ${item.name}: ${item.value[1].toFixed(2)} ms`;
        },
      },
      grid: {
        top: 25,
        right: 15,
        bottom: 25,
        left: 45,
      },
      xAxis: {
        type: 'category',
        data: data.map((d) => d[0]),
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        axisLine: { lineStyle: { color: 'rgba(255,255,255,0.1)' } },
      },
      yAxis: {
        type: 'value',
        name: 'ms',
        nameTextStyle: { color: '#94a3b8', fontSize: 10 },
        axisLabel: { color: '#94a3b8', fontSize: 10 },
        splitLine: { lineStyle: { color: 'rgba(255,255,255,0.05)' } },
      },
      series: [
        {
          type: 'bar',
          data: data.map((d) => d[1]),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#00f0ff' },
              { offset: 1, color: '#3b82f6' },
            ]),
            borderRadius: [4, 4, 0, 0],
          },
        },
      ],
    };

    chartInstance.current.setOption(option);

    const handleResize = () => chartInstance.current?.resize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [openPorts]);

  const handleStartScan = async () => {
    if (!target.trim()) {
      pushToast({ type: 'warning', title: 'Target Required', message: 'Enter a valid hostname or IP address.' });
      return;
    }

    startScan();
    const portsToScan = portPreset === 'custom' ? customPorts : portPreset;

    try {
      const res = await api.scanPorts({
        target: target.trim(),
        ports: portsToScan,
        mode: scanType,
        concurrency,
        timeoutMs,
        grabBanners,
      });

      if (res.success && res.data) {
        completeScan(res.data);
        pushToast({
          type: 'success',
          title: 'Port Scan Complete',
          message: `Scanned target in ${res.data.durationMs}ms. Found ${res.data.openCount} open ports.`,
        });
      } else {
        stopScan();
        pushToast({
          type: 'error',
          title: 'Scan Error',
          message: res.error?.message || 'Port scanner encountered an error',
        });
      }
    } catch (err: any) {
      stopScan();
      pushToast({
        type: 'error',
        title: 'Execution Error',
        message: err.message || 'Failed to dispatch port scan command',
      });
    }
  };

  const filteredPorts = openPorts.filter((p) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'web') return [80, 443, 8080, 8443, 3000, 5000].includes(p.port);
    if (activeTab === 'db') return [1433, 1521, 3306, 5432, 6379, 27017].includes(p.port);
    if (activeTab === 'remote') return [22, 23, 3389, 5900, 5901].includes(p.port);
    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0e1322]/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Scan className="w-5 h-5 text-[#00f0ff]" />
            <h1 className="text-lg font-bold tracking-wide">High-Speed Port Scanner</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              Async Semaphore PAL
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Concurrent TCP connect scanner with banner fingerprinting & TLS discovery
          </p>
        </div>

        {/* Global Action Button */}
        <div className="flex items-center gap-3">
          {isRunning ? (
            <button
              onClick={stopScan}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 hover:bg-rose-500/30 text-xs font-semibold transition"
            >
              <Square className="w-4 h-4 fill-rose-400 text-rose-400" />
              <span>Cancel Scan</span>
            </button>
          ) : (
            <button
              onClick={handleStartScan}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00f0ff] text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-xs transition"
            >
              <Play className="w-4 h-4 fill-slate-950 text-slate-950" />
              <span>Launch Scan</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Configuration Bar */}
      <div className="p-4 border-b border-white/5 bg-white/[0.01] flex flex-wrap items-center gap-4 text-xs">
        {/* Target Input */}
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Host or IP</label>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            placeholder="e.g. 127.0.0.1, 1.1.1.1, example.com"
            className="w-full px-3 py-2 rounded-lg bg-slate-900/90 border border-white/10 text-white font-mono focus:border-[#00f0ff] outline-none"
          />
        </div>

        {/* Presets */}
        <div className="flex flex-col gap-1">
          <label className="text-[11px] font-mono text-slate-400">Port Range Preset</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {PRESET_OPTIONS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPortPreset(p.id)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition ${
                  portPreset === p.id
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 font-semibold'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Port Range Input */}
        {portPreset === 'custom' && (
          <div className="w-48">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Custom Port Expression</label>
            <input
              type="text"
              value={customPorts}
              onChange={(e) => setCustomPorts(e.target.value)}
              placeholder="1-1024 or 80,443"
              className="w-full px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono focus:border-[#00f0ff] outline-none text-xs"
            />
          </div>
        )}

        {/* Concurrency Selector */}
        <div className="w-32">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Workers: <span className="text-[#00f0ff] font-bold">{concurrency}</span>
          </label>
          <input
            type="range"
            min={20}
            max={500}
            step={10}
            value={concurrency}
            onChange={(e) => setConcurrency(parseInt(e.target.value, 10))}
            className="w-full accent-[#00f0ff] cursor-pointer"
          />
        </div>

        {/* Mode Selector */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Scan Engine</label>
          <select
            value={scanType}
            onChange={(e) => setScanType(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono outline-none text-xs"
          >
            <option value="TCP_CONNECT">TCP Connect (Unprivileged)</option>
            <option value="SYN_STEALTH">SYN Stealth (Elevated/Sim)</option>
          </select>
        </div>

        {/* Banner Grabbing Checkbox */}
        <div className="flex items-center gap-2 mt-5">
          <input
            type="checkbox"
            id="grabBanners"
            checked={grabBanners}
            onChange={(e) => setGrabBanners(e.target.checked)}
            className="rounded border-slate-700 accent-[#00f0ff] cursor-pointer"
          />
          <label htmlFor="grabBanners" className="text-xs text-slate-300 cursor-pointer select-none">
            Service Banners
          </label>
        </div>
      </div>

      {/* Live Scan Progress Bar */}
      {isRunning && (
        <div className="w-full h-1 bg-slate-800 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#00f0ff] to-indigo-500 transition-all duration-300"
            style={{ width: `${progressPercent || 25}%` }}
          />
        </div>
      )}

      {/* Body Content */}
      <div className="flex-1 flex flex-col p-4 overflow-hidden gap-4">
        {/* Metric Cards Row */}
        <div className="grid grid-cols-5 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Open Ports</div>
              <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
                {openPorts.length}
              </div>
            </div>
            <Zap className="w-5 h-5 text-emerald-400/50" />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Closed Ports</div>
              <div className="text-xl font-bold font-mono text-slate-400 mt-0.5">{closedCount}</div>
            </div>
            <Shield className="w-5 h-5 text-slate-500/50" />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Filtered Ports</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">{filteredCount}</div>
            </div>
            <Filter className="w-5 h-5 text-amber-400/50" />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Scan Duration</div>
              <div className="text-xl font-bold font-mono text-[#00f0ff] mt-0.5">
                {scanResult ? `${scanResult.durationMs}ms` : '0ms'}
              </div>
            </div>
            <Clock className="w-5 h-5 text-[#00f0ff]/50" />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Target IP</div>
              <div className="text-sm font-bold font-mono text-slate-200 mt-1 truncate">
                {scanResult?.targetIp || target || '127.0.0.1'}
              </div>
            </div>
            <Layers className="w-5 h-5 text-indigo-400/50" />
          </div>
        </div>

        {/* Middle Split: ECharts Latency Chart & Port Discovery List */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Left Table Panel */}
          <div className="flex-[3] flex flex-col rounded-xl bg-[#070a12]/90 border border-white/5 overflow-hidden">
            {/* Filter Tabs */}
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-300">Open Services ({filteredPorts.length})</span>
                <div className="flex items-center gap-1 ml-4 bg-white/5 p-0.5 rounded-lg">
                  <button
                    onClick={() => setActiveTab('all')}
                    className={`px-2.5 py-1 rounded text-[11px] ${activeTab === 'all' ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'text-slate-400'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setActiveTab('web')}
                    className={`px-2.5 py-1 rounded text-[11px] ${activeTab === 'web' ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'text-slate-400'}`}
                  >
                    Web
                  </button>
                  <button
                    onClick={() => setActiveTab('db')}
                    className={`px-2.5 py-1 rounded text-[11px] ${activeTab === 'db' ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'text-slate-400'}`}
                  >
                    Database
                  </button>
                  <button
                    onClick={() => setActiveTab('remote')}
                    className={`px-2.5 py-1 rounded text-[11px] ${activeTab === 'remote' ? 'bg-[#00f0ff]/20 text-[#00f0ff]' : 'text-slate-400'}`}
                  >
                    Remote
                  </button>
                </div>
              </div>

              {openPorts.length > 0 && (
                <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Interactive Real-time Feed</span>
                </div>
              )}
            </div>

            {/* Ports Table */}
            <div className="flex-1 overflow-auto">
              {filteredPorts.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2">
                  <Scan className="w-8 h-8 opacity-40" />
                  <p className="text-xs">
                    {isRunning ? 'Scanning ports...' : 'No open ports found. Launch a scan above.'}
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-[#0e1322] border-b border-white/5 text-[10px] font-mono uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Port</th>
                      <th className="px-3 py-2">Protocol</th>
                      <th className="px-3 py-2">Service</th>
                      <th className="px-3 py-2">Product / Version</th>
                      <th className="px-3 py-2">Latency</th>
                      <th className="px-3 py-2 text-right">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono">
                    {filteredPorts.map((p) => (
                      <tr
                        key={p.port}
                        onClick={() => selectPort(p)}
                        className={`hover:bg-white/[0.03] cursor-pointer transition ${selectedPort?.port === p.port ? 'bg-[#00f0ff]/10' : ''}`}
                      >
                        <td className="px-4 py-2 font-bold text-white flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-400" />
                          <span>{p.port}</span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{p.protocol}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">
                            {p.service}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-300 truncate max-w-[200px]">
                          {p.product ? `${p.product} ${p.version || ''}` : 'Unknown'}
                        </td>
                        <td className="px-3 py-2 text-emerald-400">
                          {p.latencyMs ? `${p.latencyMs.toFixed(1)} ms` : '-'}
                        </td>
                        <td className="px-3 py-2 text-right">
                          <button className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white">
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Right Panel: ECharts Latency Chart & Banner Inspector */}
          <div className="flex-[2] flex flex-col gap-4 min-w-[280px]">
            {/* Chart Widget */}
            <div className="h-48 rounded-xl bg-[#070a12]/90 border border-white/5 p-3 flex flex-col">
              <div className="text-[11px] font-mono text-slate-400 mb-1 flex items-center justify-between">
                <span>Port Latency Profile (Apache ECharts)</span>
                <span className="text-[10px] text-[#00f0ff]">Canvas 60 FPS</span>
              </div>
              <div ref={chartRef} className="flex-1 w-full h-full" />
            </div>

            {/* Selected Port Inspector Panel */}
            <div className="flex-1 rounded-xl bg-[#070a12]/90 border border-white/5 p-4 flex flex-col overflow-auto">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-[#00f0ff]" />
                  <span className="text-xs font-semibold text-slate-200">
                    {selectedPort ? `Port ${selectedPort.port} Inspection` : 'Service Inspector'}
                  </span>
                </div>
                {selectedPort && (
                  <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {selectedPort.state}
                  </span>
                )}
              </div>

              {selectedPort ? (
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 text-[10px] font-mono uppercase">Service Fingerprint</span>
                    <p className="font-mono text-white font-semibold mt-0.5">
                      {selectedPort.service} {selectedPort.product ? `(${selectedPort.product})` : ''}
                    </p>
                  </div>

                  {selectedPort.banner && (
                    <div>
                      <span className="text-slate-400 text-[10px] font-mono uppercase">Raw Banner</span>
                      <pre className="mt-1 p-2.5 rounded-lg bg-black/50 border border-white/10 font-mono text-[11px] text-emerald-400 overflow-x-auto whitespace-pre-wrap">
                        {selectedPort.banner}
                      </pre>
                    </div>
                  )}

                  {selectedPort.tlsInfo && (
                    <div className="p-2.5 rounded-lg bg-indigo-500/5 border border-indigo-500/20 space-y-1.5 font-mono text-[11px]">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold mb-1">
                        <Lock className="w-3.5 h-3.5" />
                        <span>TLS / X.509 Certificate</span>
                      </div>
                      <div className="text-slate-400 truncate">
                        Subject: <span className="text-white">{selectedPort.tlsInfo.subject}</span>
                      </div>
                      <div className="text-slate-400 truncate">
                        Issuer: <span className="text-white">{selectedPort.tlsInfo.issuer}</span>
                      </div>
                      <div className="text-slate-400">
                        Expires: <span className="text-white">{selectedPort.tlsInfo.validTo}</span>
                      </div>
                      {selectedPort.tlsInfo.cipher && (
                        <div className="text-slate-400">
                          Cipher: <span className="text-[#00f0ff]">{selectedPort.tlsInfo.cipher}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p>Click on any open port to inspect banners, software versions, and TLS attributes.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PortScanView;
