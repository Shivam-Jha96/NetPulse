import React, { useState } from 'react';
import {
  FileSearch,
  Search,
  Building,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Server,
  Globe,
  Terminal,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from 'lucide-react';
import { useWhoisStore } from '../../stores/useWhoisStore';
import { useAppStore } from '../../stores/useAppStore';
import { api } from '../../api/ipc';

const QUICK_CHIPS = ['1.1.1.1', '8.8.8.8', 'cloudflare.com', 'google.com', 'AS13335'];

export const WhoisView: React.FC = () => {
  const { query, isLoading, result, setQuery, setResult, setLoading, setError } = useWhoisStore();
  const { pushToast } = useAppStore();
  const [showRawText, setShowRawText] = useState(false);

  const handleQuery = async (targetQuery?: string) => {
    const q = (targetQuery || query).trim();
    if (!q) {
      pushToast({ type: 'warning', title: 'Query Required', message: 'Enter a domain, IP, or ASN to inspect.' });
      return;
    }

    if (targetQuery) {
      setQuery(targetQuery);
    }

    setLoading(true);
    try {
      const res = await api.queryWhois(q);
      if (res.success && res.data) {
        setResult(res.data);
        pushToast({
          type: 'success',
          title: 'Registry Record Retrieved',
          message: `Obtained RDAP data for '${res.data.handle}' (${res.data.objectType}).`,
        });
      } else {
        setError(res.error?.message || 'Failed to query RDAP/WHOIS');
        pushToast({
          type: 'error',
          title: 'Registry Lookup Error',
          message: res.error?.message || 'Registry query returned no records',
        });
      }
    } catch (err: any) {
      setError(err.message || 'Lookup failed');
      pushToast({
        type: 'error',
        title: 'Communication Error',
        message: err.message || 'Error communicating with RDAP service',
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0b0f19]">
      {/* Top Header */}
      <div className="px-6 py-4 border-b border-white/5 bg-[#0e1322]/80 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileSearch className="w-5 h-5 text-[#00f0ff]" />
            <h1 className="text-lg font-bold tracking-wide">WHOIS & RDAP Registry Inspector</h1>
            <span className="px-2 py-0.5 text-[10px] font-mono rounded-full bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              RFC 7480-7484 RDAP
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Query regional registries (ARIN, RIPE, APNIC, LACNIC, AFRINIC) with offline cache fallback
          </p>
        </div>

        <div>
          <button
            onClick={() => handleQuery()}
            disabled={isLoading}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-[#00f0ff] text-slate-950 font-bold hover:shadow-[0_0_20px_rgba(0,240,255,0.4)] text-xs transition disabled:opacity-50"
          >
            <Search className="w-4 h-4 text-slate-950" />
            <span>{isLoading ? 'Querying...' : 'Lookup Registry'}</span>
          </button>
        </div>
      </div>

      {/* Query Bar */}
      <div className="p-4 border-b border-white/5 bg-white/[0.01] flex flex-wrap items-center gap-4 text-xs">
        <div className="flex-1 min-w-[280px]">
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Query Identifier (Domain, IP, or Autonomous System)
          </label>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleQuery()}
            placeholder="e.g. cloudflare.com, 1.1.1.1, AS13335"
            className="w-full px-3 py-2 rounded-lg bg-slate-900 border border-white/10 text-white font-mono focus:border-[#00f0ff] outline-none"
          />
        </div>

        {/* Quick Sample Chips */}
        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">Quick Samples</label>
          <div className="flex items-center gap-1.5 flex-wrap">
            {QUICK_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={() => handleQuery(chip)}
                className="px-2.5 py-1.5 rounded bg-white/5 border border-white/5 hover:border-[#00f0ff]/40 text-slate-400 hover:text-white font-mono text-[11px] transition"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 overflow-auto">
        {!result ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
            <FileSearch className="w-10 h-10 opacity-30 text-[#00f0ff]" />
            <p className="max-w-md text-center">
              {isLoading
                ? 'Retrieving registration data from regional registry...'
                : 'Enter a domain name, IPv4/IPv6 address, or ASN above to inspect registration, contacts, and allocation hierarchy.'}
            </p>
          </div>
        ) : (
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Top Object Banner Card */}
            <div className="p-5 rounded-2xl bg-[#070a12]/90 border border-white/10 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <span className="px-2.5 py-1 rounded-md bg-[#00f0ff]/15 text-[#00f0ff] border border-[#00f0ff]/30 text-xs font-mono font-bold">
                    {result.objectType}
                  </span>
                  <h2 className="text-xl font-bold font-mono text-white tracking-wide">
                    {result.name || result.handle}
                  </h2>
                  <span className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-slate-400 text-xs font-mono">
                    Channel: {result.source}
                  </span>
                </div>
                <p className="text-xs font-mono text-slate-400 mt-1">Registry Handle: {result.handle}</p>
              </div>

              {/* Status Tags */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {result.status.map((st, i) => (
                  <span
                    key={i}
                    className="px-2 py-0.5 rounded text-[11px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                  >
                    {st}
                  </span>
                ))}
              </div>
            </div>

            {/* Grid: Network / Allocation & Lifecycle Events */}
            <div className="grid grid-cols-2 gap-4">
              {/* Allocation & Registry Details */}
              <div className="p-4 rounded-xl bg-[#070a12]/80 border border-white/5 space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-white/5 pb-2">
                  <Server className="w-4 h-4 text-[#00f0ff]" />
                  <span>Allocation & Registry Identity</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Query Target:</span>
                    <span className="text-white font-bold">{result.query}</span>
                  </div>

                  {result.cidr && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">CIDR Allocation:</span>
                      <span className="text-emerald-400 font-bold">{result.cidr}</span>
                    </div>
                  )}

                  {result.parentHandle && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Parent Allocation:</span>
                      <span className="text-slate-300">{result.parentHandle}</span>
                    </div>
                  )}

                  {result.whoisServer && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">WHOIS Server:</span>
                      <span className="text-slate-300">{result.whoisServer}</span>
                    </div>
                  )}

                  {result.rdapUrl && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">RDAP URL:</span>
                      <a
                        href={result.rdapUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[#00f0ff] hover:underline truncate max-w-[220px]"
                      >
                        {result.rdapUrl}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {/* Lifecycle Events */}
              <div className="p-4 rounded-xl bg-[#070a12]/80 border border-white/5 space-y-3 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-white/5 pb-2">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  <span>Registry Lifecycle Milestones</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Registered:</span>
                    <span className="text-white">{result.events.registration || 'Not reported'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Expires:</span>
                    <span className="text-emerald-400 font-bold">
                      {result.events.expiration || 'Indefinite / Permanent'}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">Last Administrative Change:</span>
                    <span className="text-slate-300">{result.events.lastChanged || 'Not reported'}</span>
                  </div>

                  <div className="flex justify-between">
                    <span className="text-slate-500">RDAP DB Refreshed:</span>
                    <span className="text-slate-400">{result.events.lastUpdateOfRdapDb || 'Current'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Entities & Organizations */}
            <div className="rounded-xl bg-[#070a12]/80 border border-white/5 p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-2">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                  <Building className="w-4 h-4 text-[#00f0ff]" />
                  <span>Associated Registry Entities & Abuse Contacts ({result.entities.length})</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {result.entities.map((entity, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-lg bg-white/[0.02] border border-white/5 space-y-2 text-xs font-mono"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        <span>{entity.name || entity.organization || 'Contact Entity'}</span>
                      </span>
                      <div className="flex gap-1">
                        {entity.roles.map((r) => (
                          <span
                            key={r}
                            className={`px-1.5 py-0.2 rounded text-[10px] uppercase font-bold ${
                              r === 'abuse'
                                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                : 'bg-indigo-500/20 text-indigo-300'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </div>

                    {entity.organization && entity.organization !== entity.name && (
                      <div className="text-slate-400">{entity.organization}</div>
                    )}

                    {entity.email && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Mail className="w-3.5 h-3.5 text-[#00f0ff]" />
                        <span className="text-[#00f0ff] font-semibold">{entity.email}</span>
                      </div>
                    )}

                    {entity.phone && (
                      <div className="flex items-center gap-2 text-slate-300">
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{entity.phone}</span>
                      </div>
                    )}

                    {entity.address && (
                      <div className="flex items-start gap-2 text-slate-400">
                        <MapPin className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                        <span className="truncate">{entity.address}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Delegated Nameservers */}
            {result.nameservers.length > 0 && (
              <div className="p-4 rounded-xl bg-[#070a12]/80 border border-white/5 text-xs font-mono space-y-2">
                <div className="flex items-center gap-2 text-slate-300 font-semibold border-b border-white/5 pb-2">
                  <Globe className="w-4 h-4 text-emerald-400" />
                  <span>Delegated Authoritative Nameservers ({result.nameservers.length})</span>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {result.nameservers.map((ns) => (
                    <span
                      key={ns}
                      className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-emerald-300 font-semibold"
                    >
                      {ns}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Collapsible Raw Text / Remarks */}
            {result.rawText && (
              <div className="rounded-xl bg-[#070a12]/80 border border-white/5 overflow-hidden">
                <button
                  onClick={() => setShowRawText(!showRawText)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-mono text-slate-300 hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-2">
                    <Terminal className="w-4 h-4 text-slate-400" />
                    <span>Raw WHOIS Text & Server Remarks</span>
                  </div>
                  {showRawText ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                {showRawText && (
                  <pre className="p-4 border-t border-white/5 bg-black/60 font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto">
                    {result.rawText}
                  </pre>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default WhoisView;
