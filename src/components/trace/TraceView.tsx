import React, { useEffect, useRef } from 'react';
import {
  Play,
  Square,
  Search,
  Globe2,
  Server,
  Layers,
  ArrowRight,
  Sliders,
} from 'lucide-react';
import { useTraceStore } from '../../stores/useTraceStore';
import { api } from '../../api/ipc';

export const TraceView: React.FC = () => {
  const {
    target,
    setTarget,
    maxHops,
    setMaxHops,
    isTracing,
    hops,
    startTraceroute,
    stopTraceroute,
    addHop,
    error,
  } = useTraceStore();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Subscribe to live hop discovery stream
  useEffect(() => {
    const unsubscribe = api.onHopDiscovered((hop) => {
      addHop(hop);
    });
    return () => unsubscribe();
  }, [addHop]);

  // Draw 2D/3D Tactical Route Map on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let offset = 0;

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Cyber grid background
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
      ctx.lineWidth = 1;
      const step = 40;
      for (let x = 0; x < canvas.width; x += step) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += step) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Origin and destination points
      const originX = 80;
      const originY = canvas.height / 2;
      const destX = canvas.width - 80;
      const destY = canvas.height / 2;

      // Draw curved geodesic path
      ctx.beginPath();
      ctx.moveTo(originX, originY);
      const cpX = (originX + destX) / 2;
      const cpY = originY - 120;
      ctx.quadraticCurveTo(cpX, cpY, destX, destY);
      ctx.strokeStyle = 'rgba(0, 240, 255, 0.25)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Draw animated pulse along curve
      offset = (offset + 0.006) % 1;
      const t = offset;
      const pulseX = (1 - t) * (1 - t) * originX + 2 * (1 - t) * t * cpX + t * t * destX;
      const pulseY = (1 - t) * (1 - t) * originY + 2 * (1 - t) * t * cpY + t * t * destY;

      ctx.beginPath();
      ctx.arc(pulseX, pulseY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.shadowColor = '#00f0ff';
      ctx.shadowBlur = 12;
      ctx.fill();
      ctx.shadowBlur = 0;

      // Draw intermediate hops
      const validHops = hops.filter((h) => h.ip);
      const totalPoints = validHops.length;

      validHops.forEach((hop, idx) => {
        const fraction = (idx + 1) / (totalPoints + 1);
        const hx = (1 - fraction) * (1 - fraction) * originX + 2 * (1 - fraction) * fraction * cpX + fraction * fraction * destX;
        const hy = (1 - fraction) * (1 - fraction) * originY + 2 * (1 - fraction) * fraction * cpY + fraction * fraction * destY;

        ctx.beginPath();
        ctx.arc(hx, hy, 4, 0, Math.PI * 2);
        ctx.fillStyle = hop.lossPercent > 0 ? '#f59e0b' : '#10b981';
        ctx.fill();

        // Label
        ctx.font = '10px monospace';
        ctx.fillStyle = '#94a3b8';
        ctx.fillText(`Hop ${hop.ttl}`, hx - 14, hy + 18);
      });

      // Origin Node
      ctx.beginPath();
      ctx.arc(originX, originY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#a855f7';
      ctx.fill();
      ctx.font = '11px monospace';
      ctx.fillStyle = '#a855f7';
      ctx.fillText('Local Origin', originX - 30, originY + 22);

      // Destination Node
      ctx.beginPath();
      ctx.arc(destX, destY, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#00f0ff';
      ctx.fill();
      ctx.fillStyle = '#00f0ff';
      ctx.fillText(target, destX - 25, destY + 22);

      animId = requestAnimationFrame(render);
    };

    render();
    return () => cancelAnimationFrame(animId);
  }, [hops, target]);

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Control Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[280px] flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={target}
              onChange={(e) => setTarget(e.target.value)}
              placeholder="Enter IP or hostname (e.g. 1.1.1.1, cloudflare.com)..."
              disabled={isTracing}
              className="w-full pl-9 pr-3 py-2 rounded-lg glass-input text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-slate-400 px-2">
            <Sliders className="w-3.5 h-3.5" />
            <span>Hops:</span>
            <input
              type="number"
              min={1}
              max={64}
              value={maxHops}
              onChange={(e) => setMaxHops(parseInt(e.target.value, 10) || 30)}
              disabled={isTracing}
              className="w-14 px-2 py-1.5 rounded glass-input text-xs font-mono text-center"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isTracing ? (
            <button
              onClick={startTraceroute}
              className="px-5 py-2 rounded-lg bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all"
            >
              <Play className="w-3.5 h-3.5 fill-black" />
              <span>Trace Route</span>
            </button>
          ) : (
            <button
              onClick={stopTraceroute}
              className="px-5 py-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white font-mono text-xs font-bold flex items-center gap-2 shadow-[0_0_15px_rgba(244,63,94,0.4)] transition-all"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Stop Trace</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Interactive Geodesic Map */}
      <div className="glass-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold flex items-center gap-2">
            <Globe2 className="w-4 h-4 text-[#00f0ff]" /> Geodesic Path Visualization
          </span>
          <span className="text-slate-400">
            {hops.length} Hops Discovered {isTracing && '(Live Probing...)'}
          </span>
        </div>

        <div className="w-full h-48 bg-[#070c18] rounded-lg overflow-hidden border border-white/5 relative">
          <canvas
            ref={canvasRef}
            width={900}
            height={192}
            className="w-full h-full block"
          />
        </div>
      </div>

      {/* Hop Telemetry Table */}
      <div className="glass-panel p-4 rounded-xl space-y-3">
        <div className="flex items-center justify-between text-xs font-mono border-b border-white/5 pb-2">
          <span className="text-slate-300 font-semibold flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#a855f7]" /> Multi-Hop Telemetry Table
          </span>
          <span className="text-[11px] text-slate-500">
            ICMP Echo / Time Exceeded
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-3">IP Address</th>
                <th className="py-2 px-3">Hostname / Node</th>
                <th className="py-2 px-2">Loss %</th>
                <th className="py-2 px-2">Sent</th>
                <th className="py-2 px-2">Recv</th>
                <th className="py-2 px-3">Last RTT</th>
                <th className="py-2 px-3">Avg RTT</th>
                <th className="py-2 px-3">Best / Worst</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {hops.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-slate-500">
                    No active trace. Click "Trace Route" to begin hop discovery.
                  </td>
                </tr>
              ) : (
                hops.map((hop) => {
                  const avg = hop.rttAvg;
                  const latencyColor =
                    avg === null
                      ? 'text-slate-500'
                      : avg < 50
                      ? 'text-emerald-400'
                      : avg < 150
                      ? 'text-amber-400'
                      : 'text-rose-400';

                  return (
                    <tr key={hop.ttl} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-2 px-2 text-[#00f0ff] font-bold">{hop.ttl}</td>
                      <td className="py-2 px-3 text-white">
                        {hop.ip ? (
                          <span>{hop.ip}</span>
                        ) : (
                          <span className="text-slate-500 italic">* * * Request timed out</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-slate-400">
                        {hop.hostname || (hop.ip ? 'Edge Router' : '—')}
                      </td>
                      <td className="py-2 px-2">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] ${
                            hop.lossPercent === 0
                              ? 'bg-emerald-500/10 text-emerald-400'
                              : 'bg-rose-500/10 text-rose-400'
                          }`}
                        >
                          {hop.lossPercent.toFixed(0)}%
                        </span>
                      </td>
                      <td className="py-2 px-2 text-slate-300">{hop.sent}</td>
                      <td className="py-2 px-2 text-slate-300">{hop.received}</td>
                      <td className={`py-2 px-3 font-semibold ${latencyColor}`}>
                        {hop.rttLast !== null ? `${hop.rttLast.toFixed(2)} ms` : '—'}
                      </td>
                      <td className={`py-2 px-3 font-semibold ${latencyColor}`}>
                        {hop.rttAvg !== null ? `${hop.rttAvg.toFixed(2)} ms` : '—'}
                      </td>
                      <td className="py-2 px-3 text-slate-400 text-[11px]">
                        {hop.rttBest !== null ? `${hop.rttBest.toFixed(1)} / ${hop.rttWorst?.toFixed(1)} ms` : '—'}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
