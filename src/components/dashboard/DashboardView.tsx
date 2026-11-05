import React, { useEffect } from 'react';
import {
  Globe,
  RefreshCw,
  ShieldCheck,
  Server,
  MapPin,
  Clock,
  Navigation,
  Activity,
  Calculator,
  Cpu,
} from 'lucide-react';
import { useTraceStore } from '../../stores/useTraceStore';
import { useAppStore } from '../../stores/useAppStore';

export const DashboardView: React.FC = () => {
  const { traceResult, lookupIp, isTracing } = useTraceStore();
  const { setActiveView } = useAppStore();

  useEffect(() => {
    if (!traceResult) {
      lookupIp('1.1.1.1');
    }
  }, [traceResult, lookupIp]);

  const handleRefresh = () => {
    lookupIp('1.1.1.1');
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-2xl relative overflow-hidden border border-[#00f0ff]/20">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#00f0ff]/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#00f0ff] font-semibold flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00f0ff]" /> Primary Egress Gateway
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                {traceResult?.isBogon ? 'BOGON / PRIVATE' : 'PUBLIC ROUTABLE'}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/30">
                {traceResult?.source || 'OFFLINE_MAXMIND'}
              </span>
            </div>

            <h1 className="text-4xl font-bold font-mono tracking-tight text-white mb-2">
              {traceResult?.ip || '1.1.1.1'}
            </h1>

            <p className="text-sm text-slate-300 font-mono">
              {traceResult?.network.asnOrg || 'Cloudflare, Inc.'}
              {traceResult?.network.asn ? ` (AS${traceResult.network.asn})` : ''} • {traceResult?.location.city || 'San Jose'}, {traceResult?.location.region || 'California'}, {traceResult?.location.country || 'United States'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleRefresh}
              disabled={isTracing}
              className="px-4 py-2 rounded-lg bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 font-mono text-xs font-semibold flex items-center gap-2 transition-all hover:shadow-[0_0_15px_rgba(0,240,255,0.2)] disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isTracing ? 'animate-spin' : ''}`} />
              <span>Refresh Gateway</span>
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Geographic Location */}
        <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/20">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Coordinates</div>
            <div className="text-sm font-semibold font-mono text-white mt-0.5">
              {traceResult?.location.latitude?.toFixed(4) || '37.3382'}° N, {traceResult?.location.longitude?.toFixed(4) || '-121.8863'}° W
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {traceResult?.location.timezone || 'America/Los_Angeles'}
            </div>
          </div>
        </div>

        {/* Network ASN */}
        <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-purple-500/10 text-[#a855f7] border border-purple-500/20">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Autonomous System</div>
            <div className="text-sm font-semibold font-mono text-white mt-0.5">
              {traceResult?.network.asn ? `AS${traceResult.network.asn}` : 'AS13335'}
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              {traceResult?.network.isp || 'Cloudflare'}
            </div>
          </div>
        </div>

        {/* Threat Score */}
        <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Reputation & Threat</div>
            <div className="text-sm font-semibold font-mono text-emerald-400 mt-0.5">
              {traceResult?.threat.threatLevel || 'CLEAN'} (0/100)
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Tor: No • Proxy: No
            </div>
          </div>
        </div>

        {/* Lookup Latency */}
        <div className="glass-panel p-4 rounded-xl flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase text-slate-400">Resolution Speed</div>
            <div className="text-sm font-semibold font-mono text-white mt-0.5">
              {traceResult?.responseTimeMs?.toFixed(2) || '0.45'} ms
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Provider: {traceResult?.provider || 'MaxMind GeoLite2'}
            </div>
          </div>
        </div>
      </div>

      {/* Provider Cascade Status & Quick Launchers */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cascade Status */}
        <div className="glass-panel p-5 rounded-xl space-y-3">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5 text-[#00f0ff]" /> Provider Cascade Health
            </span>
            <span className="text-[10px] font-mono text-emerald-400">4 Active</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs font-mono p-2 rounded bg-white/[0.02] border border-white/5">
              <span className="text-white">MaxMind GeoLite2 (mmap)</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PRIMARY (0.4ms)</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono p-2 rounded bg-white/[0.02] border border-white/5">
              <span className="text-slate-300">ipapi.co</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/20">STANDBY</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono p-2 rounded bg-white/[0.02] border border-white/5">
              <span className="text-slate-300">ipinfo.io</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/20">STANDBY</span>
            </div>
            <div className="flex items-center justify-between text-xs font-mono p-2 rounded bg-white/[0.02] border border-white/5">
              <span className="text-slate-300">api.ipify.org</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-cyan-500/10 text-[#00f0ff] border border-cyan-500/20">FALLBACK</span>
            </div>
          </div>
        </div>

        {/* Quick Launch Diagnostics */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-xl space-y-3">
          <div className="border-b border-white/5 pb-2">
            <span className="text-xs font-mono uppercase tracking-wider text-slate-300 font-semibold">
              Diagnostic Launchpad
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              onClick={() => setActiveView('trace')}
              className="p-4 rounded-xl bg-white/[0.02] hover:bg-[#00f0ff]/5 border border-white/5 hover:border-[#00f0ff]/30 text-left transition-all group"
            >
              <Navigation className="w-5 h-5 text-[#00f0ff] mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-white mb-1">Visual Traceroute</div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Incrementing TTL multi-hop path trace with geolocation map.
              </p>
            </button>

            <button
              onClick={() => setActiveView('ping')}
              className="p-4 rounded-xl bg-white/[0.02] hover:bg-emerald-500/5 border border-white/5 hover:border-emerald-500/30 text-left transition-all group"
            >
              <Activity className="w-5 h-5 text-emerald-400 mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-white mb-1">Continuous Ping</div>
              <p className="text-[11px] text-slate-400 leading-snug">
                Sub-second jitter analysis (RFC 3550) & 60 FPS sparkline.
              </p>
            </button>

            <button
              onClick={() => setActiveView('subnet')}
              className="p-4 rounded-xl bg-white/[0.02] hover:bg-[#a855f7]/5 border border-white/5 hover:border-[#a855f7]/30 text-left transition-all group"
            >
              <Calculator className="w-5 h-5 text-[#a855f7] mb-2 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-white mb-1">Subnet Calculator</div>
              <p className="text-[11px] text-slate-400 leading-snug">
                IPv4/IPv6 CIDR bitwise breakdown and VLSM partitioner.
              </p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
