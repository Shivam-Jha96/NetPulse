import React, { useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Search,
  Activity,
  Sliders,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { usePingStore } from '../../stores/usePingStore';
import { api } from '../../api/ipc';

export const PingView: React.FC = () => {
  const {
    target,
    setTarget,
    intervalMs,
    setIntervalMs,
    packetSize,
    dfBit,
    setDfBit,
    isPinging,
    samples,
    stats,
    startPing,
    stopPing,
    addSample,
    resetSamples,
    error,
  } = usePingStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to live ping ticks
  useEffect(() => {
    const unsubscribe = api.onPingTick((sample) => {
      addSample(sample);
    });
    return () => unsubscribe();
  }, [addSample]);

  // Real-time 60 FPS Sparkline Chart rendering on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Grid Lines
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
      ctx.lineWidth = 1;
      for (let y = 30; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      if (samples.length < 2) {
        ctx.font = '12px monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'center';
        ctx.fillText('Awaiting ICMP Echo telemetry samples...', canvas.width / 2, canvas.height / 2);
        animId = requestAnimationFrame(render);
        return;
      }

      const validSamples = samples.slice(-60); // Show last 60 ticks
      const rtts = validSamples.map((s) => (s.status === 'SUCCESS' && s.rttMs !== null ? s.rttMs : 0));
      const maxRtt = Math.max(...rtts, 60);

      const stepX = canvas.width / (validSamples.length - 1);

      // Draw glowing gradient fill under curve
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0, 240, 255, 0.25)');
      gradient.addColorStop(1, 'rgba(0, 240, 255, 0.0)');

      ctx.beginPath();
      validSamples.forEach((s, idx) => {
        const x = idx * stepX;
        const val = s.status === 'SUCCESS' && s.rttMs !== null ? s.rttMs : 0;
        const y = canvas.height - (val / maxRtt) * (canvas.height - 20) - 10;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.lineTo(canvas.width, canvas.height);
      ctx.lineTo(0, canvas.height);
      ctx.closePath();
      ctx.fillStyle = gradient;
      ctx.fill();

      // Draw sparkline curve
      ctx.beginPath();
      validSamples.forEach((s, idx) => {
        const x = idx * stepX;
        const val = s.status === 'SUCCESS' && s.rttMs !== null ? s.rttMs : 0;
        const y = canvas.height - (val / maxRtt) * (canvas.height - 20) - 10;
        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });

      ctx.strokeStyle = '#00f0ff';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Draw points for timeouts or anomalies
      validSamples.forEach((s, idx) => {
        const x = idx * stepX;
        if (s.status !== 'SUCCESS') {
          ctx.beginPath();
          ctx.arc(x, canvas.height - 10, 4, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [samples]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Controls Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Enter host to ping (e.g. 1.1.1.1, 8.8.8.8)..."
              disabled={isPinging}
              className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Interval:</span>
            <select
              value={intervalMs}
              onChange={(e) => setIntervalMs(parseInt(e.target.value, 10))}
              disabled={isPinging}
              className="px-2 py-1.5 rounded glass-input text-xs font-mono"
            >
              <option value={200}>200 ms (Fast)</option>
              <option value={500}>500 ms (High Freq)</option>
              <option value={1000}>1000 ms (Standard)</option>
              <option value={2000}>2000 ms (Slow)</option>
            </select>
          </div>

          <label className="flex items-center gap-1.5 text-xs font-mono text-slate-400 cursor-pointer">
            <input
              type="checkbox"
              checked={dfBit}
              onChange={(e) => setDfBit(e.target.checked)}
              disabled={isPinging}
              className="rounded border-slate-700 bg-slate-900 text-[#00f0ff] focus:ring-0"
            />
            <span>DF-Bit</span>
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={resetSamples}
            disabled={isPinging}
            title="Reset history"
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {!isPinging ? (
            <button
              onClick={startPing}
              className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-black font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Start Monitor</span>
            </button>
          ) : (
            <button
              onClick={stopPing}
              className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop Monitor</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="glass-panel p-3 rounded-xl text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Current RTT</div>
          <div className="text-xl font-bold font-mono text-[#00f0ff] mt-0.5">
            {samples.length > 0 && samples[samples.length - 1].rttMs !== null
              ? `${samples[samples.length - 1].rttMs?.toFixed(1)} ms`
              : '—'}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Minimum RTT</div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
            {stats.min !== null ? `${stats.min.toFixed(1)} ms` : '—'}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Average RTT</div>
          <div className="text-xl font-bold font-mono text-white mt-0.5">
            {stats.avg !== null ? `${stats.avg.toFixed(1)} ms` : '—'}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Maximum RTT</div>
          <div className="text-xl font-bold font-mono text-rose-400 mt-0.5">
            {stats.max !== null ? `${stats.max.toFixed(1)} ms` : '—'}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Jitter (RFC 3550)</div>
          <div className="text-xl font-bold font-mono text-[#a855f7] mt-0.5">
            {stats.jitterMs !== null ? `${stats.jitterMs.toFixed(2)} ms` : '0.00 ms'}
          </div>
        </div>

        <div className="glass-panel p-3 rounded-xl text-center">
          <div className="text-[10px] font-mono uppercase text-slate-400">Packet Loss</div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
            {stats.packetLossPercent.toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Sparkline Canvas Chart */}
      <div className="glass-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-[#00f0ff]" /> Real-Time Latency Sparkline (60 FPS Canvas)
          </span>
          <span className="text-slate-400">
            {stats.packetsSent} probes sent • {stats.packetsReceived} received
          </span>
        </div>

        <div className="w-full h-44 bg-[#070c18] rounded-lg overflow-hidden border border-white/5 relative">
          <canvas
            ref={canvasRef}
            width={900}
            height={176}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* Live Sample Feed Table */}
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-2">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-emerald-400" /> Recent Probe Sample Stream
          </span>
          <span className="text-[11px] text-slate-500">
            Last {samples.length} Samples
          </span>
        </div>

        <div className="overflow-x-auto max-h-56">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 sticky top-0 bg-[#0b0f19]">
                <th className="py-1.5 px-3">Seq #</th>
                <th className="py-1.5 px-3">Timestamp</th>
                <th className="py-1.5 px-3">TTL</th>
                <th className="py-1.5 px-3">Latency RTT</th>
                <th className="py-1.5 px-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {samples.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-6 text-slate-500">
                    No probe samples yet. Click "Start Monitor" to begin telemetry stream.
                  </td>
                </tr>
              ) : (
                [...samples].reverse().slice(0, 30).map((sample) => (
                  <tr key={sample.seq} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-1.5 px-3 text-[#00f0ff]">#{sample.seq}</td>
                    <td className="py-1.5 px-3 text-slate-400">
                      {new Date(sample.timestampMs).toLocaleTimeString()}
                    </td>
                    <td className="py-1.5 px-3 text-slate-300">{sample.ttl || '—'}</td>
                    <td className="py-1.5 px-3 font-semibold text-white">
                      {sample.rttMs !== null ? `${sample.rttMs.toFixed(2)} ms` : '—'}
                    </td>
                    <td className="py-1.5 px-3">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] ${
                          sample.status === 'SUCCESS'
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {sample.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
