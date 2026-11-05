import React from 'react';
import {
  Globe2,
  Search,
  ShieldCheck,
  ShieldAlert,
  ShieldX,
  Clock,
  Server,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { useDnsStore } from '../../stores/useDnsStore';
import { useAppStore } from '../../stores/useAppStore';
import { api } from '../../api/ipc';

const RECORD_TYPES = ['A', 'AAAA', 'CNAME', 'MX', 'TXT', 'NS', 'SOA', 'CAA', 'PTR', 'SRV'];

export const DnsView: React.FC = () => {
  const {
    domain,
    recordType,
    transport,
    isLoading,
    records,
    dnssec,
    propagation,
    propagationPercent,
    responseTimeMs,
    setDomain,
    setRecordType,
    setTransport,
    setResults,
    setLoading,
    setError,
  } = useDnsStore();

  const { pushToast } = useAppStore();

  const handleQuery = async () => {
    if (!domain.trim()) {
      pushToast({ type: 'warning', title: 'Domain Required', message: 'Enter a valid domain name to inspect.' });
      return;
    }

    setLoading(true);
    try {
      const res = await api.queryDns(domain.trim(), recordType, transport);
      if (res.success && res.data) {
        setResults(res.data);
        pushToast({
          type: 'success',
          title: 'DNS Inspection Complete',
          message: `Resolved ${res.data.records.length} records in ${res.data.responseTimeMs.toFixed(1)}ms.`,
        });
      } else {
        setError(res.error?.message || 'DNS query failed');
        pushToast({
          type: 'error',
          title: 'DNS Resolution Error',
          message: res.error?.message || 'Failed to query DNS records',
        });
      }
    } catch (err: any) {
      setError(err.message || 'DNS query dispatch failed');
      pushToast({
        type: 'error',
        title: 'Query Error',
        message: err.message || 'Error communicating with DNS resolver',
      });
    }
  };

  const getDnssecBadge = () => {
    if (!dnssec) return null;
    switch (dnssec.state) {
      case 'SECURE':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>SECURE (Validated)</span>
          </span>
        );
      case 'BOGUS':
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
            <ShieldX className="w-4 h-4 text-rose-400" />
            <span>BOGUS (Validation Failed)</span>
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>INSECURE (Unsigned)</span>
          </span>
        );
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0e1322]/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Globe2 className="w-5 h-5 text-[#00f0ff]" />
            <h1 className="text-lg font-bold tracking-wide">DNS Inspector & Global Propagation</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              RFC 1035 / DNSSEC
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Query RRsets, cryptographically verify DNSSEC chains-of-trust, and check multi-vantage propagation
          </p>
        </div>

        {/* Action Button */}
        <div>
          <button
            onClick={handleQuery}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00f0ff] text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-xs transition disabled:opacity-50"
          >
            <Search className="w-4 h-4 text-slate-950" />
            <span>{isLoading ? 'Querying...' : 'Resolve Records'}</span>
          </button>
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-4 border-b border-white/5 bg-white/[0.01] flex flex-wrap items-center gap-4 text-xs">
        {/* Domain Input */}
        <div className="flex-1 min-w-[240px]">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Target FQDN / Domain</label>
          <input
            type="text"
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="e.g. cloudflare.com, google.com"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white font-mono focus:border-[#00f0ff] outline-none"
          />
        </div>

        {/* Record Type Tabs */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Record Type</label>
          <div className="flex items-center gap-1 flex-wrap">
            {RECORD_TYPES.map((type) => (
              <button
                key={type}
                onClick={() => setRecordType(type)}
                className={`px-2.5 py-1.5 rounded text-[11px] font-mono transition ${
                  recordType === type
                    ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]/40 font-bold'
                    : 'bg-white/5 text-slate-400 border border-white/5 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Transport Selector */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Transport Channel</label>
          <select
            value={transport}
            onChange={(e) => setTransport(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-white font-mono outline-none text-xs"
          >
            <option value="UDP_TCP">UDP / TCP (Port 53)</option>
            <option value="DOH">DNS-over-HTTPS (DoH)</option>
            <option value="DOT">DNS-over-TLS (DoT)</option>
          </select>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 overflow-auto flex flex-col gap-4">
        {/* Summary Metric Strip */}
        <div className="grid grid-cols-4 gap-3">
          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Query Status</div>
              <div className="text-base font-bold font-mono text-white mt-0.5">
                {records.length > 0 ? 'NOERROR (Resolved)' : isLoading ? 'Querying...' : 'Ready'}
              </div>
            </div>
            <Server className="w-5 h-5 text-indigo-400/50" />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Response Latency</div>
              <div className="text-base font-bold font-mono text-[#00f0ff] mt-0.5">
                {responseTimeMs ? `${responseTimeMs.toFixed(1)} ms` : '-'}
              </div>
            </div>
            <Clock className="w-5 h-5 text-[#00f0ff]/50" />
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">DNSSEC Security</div>
              <div className="mt-1">{getDnssecBadge() || <span className="text-xs text-slate-500">Unchecked</span>}</div>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono uppercase text-slate-500">Global Propagation</div>
              <div className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                {propagationPercent ? `${propagationPercent.toFixed(0)}% Consensus` : '-'}
              </div>
            </div>
            <Globe2 className="w-5 h-5 text-emerald-400/50" />
          </div>
        </div>

        {/* DNSSEC Trust Chain Card */}
        {dnssec && (
          <div className="p-4 rounded-xl bg-[#070a12]/90 border border-white/5 text-xs">
            <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-2">
              <span className="font-semibold text-slate-200">DNSSEC Cryptographic Verification Status</span>
              {dnssec.keyAlgorithm && (
                <span className="text-[11px] font-mono text-slate-400">
                  Algorithm: <span className="text-[#00f0ff]">{dnssec.keyAlgorithm}</span>
                </span>
              )}
            </div>
            <p className="text-slate-300 font-mono text-[11px] leading-relaxed">{dnssec.details}</p>
          </div>
        )}

        {/* Middle Split: Records Table & Global Propagation Grid */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* Resolved Records Table */}
          <div className="flex-[3] flex flex-col rounded-xl bg-[#070a12]/90 border border-white/5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Resource Records ({records.length})</span>
              <span className="text-[11px] font-mono text-slate-500">Direct Recursive Resolver</span>
            </div>

            <div className="flex-1 overflow-auto">
              {records.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
                  <Layers className="w-8 h-8 opacity-40" />
                  <p>{isLoading ? 'Resolving DNS records...' : 'Enter a domain name and click Resolve Records.'}</p>
                </div>
              ) : (
                <table className="w-full text-left text-xs font-mono">
                  <thead className="sticky top-0 bg-[#0e1322] border-b border-white/5 text-[10px] uppercase text-slate-400">
                    <tr>
                      <th className="px-4 py-2">Name</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">TTL</th>
                      <th className="px-4 py-2">RDATA Value</th>
                      <th className="px-3 py-2">Priority/Tag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {records.map((r, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition">
                        <td className="px-4 py-2 text-slate-300 truncate max-w-[180px]">{r.name}</td>
                        <td className="px-3 py-2">
                          <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px]">
                            {r.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-slate-400">{r.ttl}s</td>
                        <td className="px-4 py-2 text-emerald-400 font-semibold break-all">{r.value}</td>
                        <td className="px-3 py-2 text-slate-400">{r.priority || r.tag || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Global Multi-Node Propagation Grid */}
          <div className="flex-[3] flex flex-col rounded-xl bg-[#070a12]/90 border border-white/5 overflow-hidden">
            <div className="px-4 py-2.5 border-b border-white/5 flex items-center justify-between text-xs font-semibold text-slate-300">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-[#00f0ff]" />
                <span>Global Propagation Vantage Points ({propagation.length} Nodes)</span>
              </div>
              <span className="text-[11px] font-mono text-emerald-400">
                {propagationPercent.toFixed(0)}% Match
              </span>
            </div>

            <div className="flex-1 overflow-auto divide-y divide-white/5">
              {propagation.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p>Global multi-resolver propagation checks will appear here after querying.</p>
                </div>
              ) : (
                propagation.map((node, i) => (
                  <div key={i} className="p-3 flex items-center justify-between text-xs font-mono hover:bg-white/[0.02]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-white font-medium">{node.resolverName}</span>
                        {node.countryCode && (
                          <span className="px-1.5 py-0.2 rounded bg-white/5 text-[10px] text-slate-400">
                            {node.countryCode}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{node.resolverLocation}</div>
                      <div className="text-[11px] text-emerald-400 truncate max-w-[260px]">
                        {node.values.join(', ') || 'No response'}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          node.status === 'MATCH'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : node.status === 'TIMEOUT'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        }`}
                      >
                        {node.status}
                      </span>
                      <span className="text-[10px] text-slate-500">{node.latencyMs.toFixed(1)} ms</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DnsView;
