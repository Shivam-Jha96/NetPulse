import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CheckCircle2,
  GitBranch,
  GitCommit,
  History,
  Layers,
  Play,
  Plus,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react';
import { useMultiTraceStore } from '../../stores/useMultiTraceStore';

export const MultiTraceView: React.FC = () => {
  const {
    targets,
    maxHops,
    timeoutMs,
    isRunning,
    targetResults,
    selectedTarget,
    totalDeviations,
    historicalPaths,
    addTarget,
    removeTarget,
    setMaxHops,
    setTimeoutMs,
    setSelectedTarget,
    startMultiTrace,
    fetchHistoricalPaths,
    subscribeEvents,
    clearResults,
  } = useMultiTraceStore();

  const [newTargetInput, setNewTargetInput] = useState('');
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  useEffect(() => {
    const cleanup = subscribeEvents();
    return () => cleanup();
  }, [subscribeEvents]);

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTargetInput.trim()) return;
    addTarget(newTargetInput.trim());
    setNewTargetInput('');
  };

  const activeResult = targetResults[selectedTarget];
  const activeHops = activeResult?.hops || [];
  const activeDeviations = activeResult?.deviations || [];
  const targetHistory = historicalPaths[selectedTarget] || [];

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] text-[#f8fafc] overflow-y-auto p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-[#00f0ff]" />
              Multi-Target Concurrent Traceroute & Route Diff
            </h1>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-cyan-500/10 text-cyan-400 border-cyan-500/30">
              PHASE 4
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Simultaneous multi-destination incremental TTL traceroute with SQLite historical route deviation diffing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (selectedTarget) {
                fetchHistoricalPaths(selectedTarget);
                setShowHistoryModal(true);
              }
            }}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white/[0.03] text-slate-300 border border-white/10 hover:bg-white/5 flex items-center gap-1.5 transition-all"
          >
            <History className="w-3.5 h-3.5" />
            <span>Route Baselines</span>
          </button>

          <button
            onClick={startMultiTrace}
            disabled={isRunning || targets.length === 0}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isRunning
                ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 animate-pulse'
                : 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
            }`}
          >
            {isRunning ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Tracing {targets.length} Targets...</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Trace All Targets</span>
              </>
            )}
          </button>

          {Object.keys(targetResults).length > 0 && (
            <button
              onClick={clearResults}
              className="p-1.5 rounded-lg bg-white/[0.03] text-slate-400 border border-white/10 hover:text-white hover:bg-white/5 transition-all"
              title="Clear Results"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Target Management Bar */}
      <div className="p-4 rounded-xl bg-white/[0.02] border border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <Layers className="w-4 h-4 text-[#00f0ff]" />
            <span>Target Endpoints ({targets.length}/8 Max):</span>
          </div>

          {/* Add Target Input */}
          <form onSubmit={handleAddTarget} className="flex items-center gap-2">
            <input
              type="text"
              value={newTargetInput}
              onChange={(e) => setNewTargetInput(e.target.value)}
              placeholder="Add IP or hostname (e.g. 1.1.1.1)..."
              disabled={targets.length >= 8 || isRunning}
              className="px-3 py-1.5 text-xs bg-[#070a12] border border-white/10 rounded-lg text-white font-mono focus:outline-none focus:border-[#00f0ff] w-56 placeholder:text-slate-600"
            />
            <button
              type="submit"
              disabled={targets.length >= 8 || isRunning || !newTargetInput.trim()}
              className="p-1.5 rounded-lg bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 disabled:opacity-50 transition-all"
            >
              <Plus className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Target Chips */}
        <div className="flex flex-wrap gap-2 pt-1">
          {targets.map((tgt) => {
            const isSelected = selectedTarget === tgt;
            const res = targetResults[tgt];
            const hasDeviations = (res?.deviations?.length || 0) > 0;

            return (
              <div
                key={tgt}
                onClick={() => setSelectedTarget(tgt)}
                className={`cursor-pointer px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 border transition-all ${
                  isSelected
                    ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-bold'
                    : 'bg-white/[0.03] text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                <span>{tgt}</span>
                {res && (
                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded-full border ${
                      hasDeviations
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : res.completed
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30'
                    }`}
                  >
                    {hasDeviations ? `${res.deviations.length} Shifts` : res.completed ? 'Matched' : 'Tracing'}
                  </span>
                )}
                {targets.length > 1 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTarget(tgt);
                    }}
                    className="text-slate-500 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Concurrent Progress & KPI Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Concurrent Sessions</div>
          <div className="text-2xl font-bold font-mono text-white">{targets.length} Destinations</div>
          <div className="text-[10px] text-slate-500 mt-1">Parallel incremental TTL sweeps</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Route Path Deviations</div>
          <div className={`text-2xl font-bold font-mono ${totalDeviations > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {totalDeviations} Anomalies
          </div>
          <div className="text-[10px] text-slate-500 mt-1">Compared against SQLite vault baseline</div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
          <div className="text-[11px] font-mono uppercase text-slate-400 mb-1">Engine Latency Budget</div>
          <div className="text-2xl font-bold font-mono text-[#00f0ff]">{timeoutMs} ms / Hop</div>
          <div className="text-[10px] text-slate-500 mt-1">Max hops cap: {maxHops}</div>
        </div>
      </div>

      {/* Route Deviation Banner (if deviations detected for active target) */}
      {activeDeviations.length > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-400 font-mono">
            <AlertCircle className="w-4 h-4" />
            Route Deviations Detected for {selectedTarget} ({activeDeviations.length})
          </div>
          <div className="space-y-1">
            {activeDeviations.map((dev, i) => (
              <div key={i} className="text-xs text-amber-200/90 font-mono flex items-center gap-2">
                <span className="px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 text-[10px]">
                  {dev.deviationType}
                </span>
                <span>{dev.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Hop Table for Selected Target */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <GitCommit className="w-4 h-4 text-[#00f0ff]" />
            Hop Telemetry & Intermediate Nodes: <span className="text-white font-bold">{selectedTarget}</span>
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">
            {activeHops.length} Hops Recorded
          </span>
        </div>

        <div className="rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden">
          {activeHops.length === 0 ? (
            <div className="p-12 text-center text-slate-500 text-xs font-mono">
              {isRunning
                ? `Probing intermediate hops for ${selectedTarget}...`
                : 'No active trace data. Click "Trace All Targets" to initiate concurrent traceroutes.'}
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 text-[10px] font-mono uppercase text-slate-400 bg-white/[0.01]">
                  <th className="py-2.5 px-4">Hop</th>
                  <th className="py-2.5 px-4">IP Address</th>
                  <th className="py-2.5 px-4">Hostname</th>
                  <th className="py-2.5 px-4">BGP ASN</th>
                  <th className="py-2.5 px-4">Loss</th>
                  <th className="py-2.5 px-4">Avg RTT</th>
                  <th className="py-2.5 px-4">Min / Max</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-xs font-mono">
                {activeHops.map((h) => {
                  const hasHopDeviation = activeDeviations.some((d) => d.hopNumber === h.ttl);

                  return (
                    <tr
                      key={h.ttl}
                      className={`hover:bg-white/[0.02] transition-colors ${
                        hasHopDeviation ? 'bg-amber-500/5' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-400">{h.ttl}</td>
                      <td className="py-2.5 px-4 font-bold text-[#00f0ff]">
                        {h.ip || '* * *'}
                        {hasHopDeviation && (
                          <span className="ml-2 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                            SHIFT
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-400 truncate max-w-xs">{h.hostname || '-'}</td>
                      <td className="py-2.5 px-4">
                        {h.asn ? (
                          <span className="px-1.5 py-0.2 rounded bg-purple-500/10 text-purple-300 border border-purple-500/20 text-[10px]">
                            AS{h.asn} {h.asnOrg ? `(${h.asnOrg})` : ''}
                          </span>
                        ) : (
                          <span className="text-slate-600">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={h.lossPercent > 0 ? 'text-amber-400 font-bold' : 'text-slate-400'}>
                          {h.lossPercent.toFixed(1)}%
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-white font-bold">
                        {h.rttAvg !== null ? `${h.rttAvg.toFixed(1)} ms` : '-'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {h.rttBest !== null && h.rttWorst !== null
                          ? `${h.rttBest.toFixed(1)} / ${h.rttWorst.toFixed(1)} ms`
                          : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Historical Baselines Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-2xl bg-[#0e1322] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-white font-mono">
                <History className="w-4 h-4 text-[#00f0ff]" />
                Historical Route Baselines for {selectedTarget}
              </div>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-96 overflow-y-auto space-y-2">
              {targetHistory.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-xs font-mono">
                  No historical baseline recorded yet. Run a multi-target trace to populate route snapshots in SQLite vault.
                </div>
              ) : (
                targetHistory.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/5 space-y-2"
                  >
                    <div className="flex items-center justify-between text-xs font-mono">
                      <span className="text-slate-400">{new Date(rec.recordedAt).toLocaleString()}</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded border ${rec.isBaseline ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' : 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {rec.isBaseline ? 'ACTIVE BASELINE' : 'HISTORICAL RUN'}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-slate-300">
                      Total Hops: {rec.totalHops} | Route Digest: {rec.hops.map((h) => h.ip || '*').join(' → ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
