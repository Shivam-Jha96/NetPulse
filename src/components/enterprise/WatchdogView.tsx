import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  Clock,
  Layers,
  Play,
  RefreshCw,
  Sliders,
  Square,
  Trash2,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useWatchdogStore } from '../../stores/useWatchdogStore';

export const WatchdogView: React.FC = () => {
  const {
    status,
    config,
    isLoading,
    fetchStatus,
    startWatchdog,
    stopWatchdog,
    updateConfig,
    subscribeEvents,
    clearAlerts,
  } = useWatchdogStore();

  const [showConfig, setShowConfig] = useState(false);

  useEffect(() => {
    fetchStatus();
    const cleanup = subscribeEvents();
    return () => cleanup();
  }, [fetchStatus, subscribeEvents]);

  const isRunning = status.running;
  const isHealthy = status.interfaceState === 'UP';

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] text-[#f8fafc] overflow-y-auto p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-[#00f0ff]" />
              Sentinel Background Watchdog
            </h1>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isRunning
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 animate-pulse'
                  : 'bg-slate-500/10 text-slate-400 border-slate-500/20'
              }`}
            >
              {isRunning ? 'MONITORING ACTIVE' : 'IDLE / STOPPED'}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                isHealthy
                  ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
              }`}
            >
              {status.interfaceState}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Continuous OS background health sentinel auditing latency spikes, BGP shift, and adapter transitions.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowConfig(!showConfig)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1.5 transition-all ${
              showConfig
                ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30'
                : 'bg-white/[0.03] text-slate-300 border-white/10 hover:bg-white/5'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Thresholds</span>
          </button>

          {isRunning ? (
            <button
              onClick={stopWatchdog}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-medium bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 flex items-center gap-1.5 transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop Sentinel</span>
            </button>
          ) : (
            <button
              onClick={startWatchdog}
              disabled={isLoading}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center gap-1.5 transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Start Sentinel</span>
            </button>
          )}

          <button
            onClick={fetchStatus}
            className="p-1.5 rounded-lg bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all"
            title="Refresh Status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Threshold Configuration Drawer */}
      {showConfig && (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-4 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#00f0ff]" />
              Watchdog Diagnostic Thresholds
            </h2>
            <span className="text-[10px] text-slate-500 font-mono">Auto-saved to Vault</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-slate-400">Probe Interval</span>
                <span className="text-[#00f0ff]">{config.intervalSecs}s</span>
              </div>
              <input
                type="range"
                min="1"
                max="60"
                value={config.intervalSecs}
                onChange={(e) => updateConfig({ intervalSecs: parseInt(e.target.value) || 5 })}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Frequency of unprivileged ping sweeps</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-slate-400">Latency Alert Threshold</span>
                <span className="text-[#00f0ff]">{config.latencyThresholdMs} ms</span>
              </div>
              <input
                type="range"
                min="10"
                max="500"
                step="5"
                value={config.latencyThresholdMs}
                onChange={(e) => updateConfig({ latencyThresholdMs: parseFloat(e.target.value) || 100 })}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Trigger alert if target latency exceeds</span>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1 font-mono">
                <span className="text-slate-400">Packet Loss Tolerance</span>
                <span className="text-[#00f0ff]">{config.lossThresholdPercent}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                value={config.lossThresholdPercent}
                onChange={(e) => updateConfig({ lossThresholdPercent: parseFloat(e.target.value) || 5 })}
                className="w-full accent-[#00f0ff] cursor-pointer"
              />
              <span className="text-[10px] text-slate-500">Max acceptable loss before warning</span>
            </div>
          </div>
        </div>
      )}

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>UPTIME</span>
            <Clock className="w-4 h-4 text-slate-500" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {isRunning ? `${status.uptimeSecs}s` : '0s'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Continuous daemon cycle</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>ACTIVE ADAPTER</span>
            {isHealthy ? <Wifi className="w-4 h-4 text-emerald-400" /> : <WifiOff className="w-4 h-4 text-rose-400" />}
          </div>
          <div className="text-base font-bold font-mono text-white truncate">
            {status.activeInterface || 'Default Interface'}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Kernel state: {status.interfaceState}</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>MONITORED ANCHORS</span>
            <Layers className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {status.targetStatuses.length} Targets
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Gateway, Primary DNS & Public IP</p>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="flex items-center justify-between text-xs text-slate-400 font-mono mb-2">
            <span>ANOMALY ALERTS</span>
            <Bell className={`w-4 h-4 ${status.totalAlertsEmitted > 0 ? 'text-rose-400' : 'text-slate-500'}`} />
          </div>
          <div className={`text-2xl font-bold font-mono ${status.totalAlertsEmitted > 0 ? 'text-rose-400' : 'text-white'}`}>
            {status.totalAlertsEmitted}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Spikes & unreachable events</p>
        </div>
      </div>

      {/* Target Status Grid */}
      <div className="space-y-3">
        <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400">
          Monitored Endpoints & Health Matrix
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {status.targetStatuses.length === 0 ? (
            <div className="col-span-3 p-8 rounded-xl bg-white/[0.02] border border-white/5 text-center text-slate-500 text-xs font-mono">
              Sentinel is stopped or waiting for initial probe tick. Click "Start Sentinel" to begin live monitoring.
            </div>
          ) : (
            status.targetStatuses.map((t) => (
              <div
                key={t.endpoint}
                className="p-4 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-white truncate">{t.name}</div>
                  {t.isHealthy ? (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                      <CheckCircle2 className="w-3 h-3" />
                      HEALTHY
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 text-[10px] font-mono text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/30">
                      <AlertTriangle className="w-3 h-3" />
                      DEGRADED
                    </span>
                  )}
                </div>
                <div className="text-xs font-mono text-slate-400 mb-3">{t.endpoint}</div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono pt-2 border-t border-white/5">
                  <div>
                    <span className="text-[10px] text-slate-500 block">LATENCY</span>
                    <span className={`font-bold ${t.latencyMs && t.latencyMs > config.latencyThresholdMs ? 'text-rose-400' : 'text-[#00f0ff]'}`}>
                      {t.latencyMs !== null ? `${t.latencyMs.toFixed(1)} ms` : 'Timeout'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">PACKET LOSS</span>
                    <span className={`font-bold ${t.lossPercent > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                      {t.lossPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Real-time Alert Log */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Bell className="w-4 h-4 text-amber-400" />
            Watchdog Alert Audit Stream ({status.recentAlerts.length})
          </h2>
          {status.recentAlerts.length > 0 && (
            <button
              onClick={clearAlerts}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 font-mono"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Log
            </button>
          )}
        </div>

        <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
          {status.recentAlerts.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-xs font-mono">
              No anomaly alerts recorded. All endpoints conform to latency and packet loss thresholds.
            </div>
          ) : (
            <div className="divide-y divide-white/5 max-h-80 overflow-y-auto">
              {status.recentAlerts.map((alert) => (
                <div key={alert.id} className="p-3.5 flex items-start gap-3 hover:bg-white/[0.02] transition-colors">
                  <div className="pt-0.5">
                    {alert.severity === 'CRITICAL' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                    ) : alert.severity === 'WARNING' ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-blue-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-white truncate">{alert.target}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/5 text-slate-400 border border-white/10">
                        {alert.alertType}
                      </span>
                      <span className="text-[10px] font-mono text-slate-500">
                        Value: {alert.value.toFixed(1)} / Threshold: {alert.threshold.toFixed(1)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
