import React, { useEffect, useState } from 'react';
import {
  Calculator,
  Sliders,
  Plus,
  Trash2,
  Copy,
  Check,
  Binary,
  Layers,
  Network,
} from 'lucide-react';
import { useSubnetStore } from '../../stores/useSubnetStore';

export const SubnetView: React.FC = () => {
  const {
    cidr,
    setCidr,
    details,
    calculate,
    vlsmRequests,
    vlsmAllocations,
    addVlsmRequest,
    removeVlsmRequest,
    error,
  } = useSubnetStore();

  const [copied, setCopied] = useState(false);
  const [newSubnetName, setNewSubnetName] = useState('');
  const [newSubnetHosts, setNewSubnetHosts] = useState('20');

  useEffect(() => {
    calculate();
  }, [calculate]);

  const handleSliderChange = (newPrefix: number) => {
    const baseIp = cidr.split('/')[0] || '192.168.1.0';
    const nextCidr = `${baseIp}/${newPrefix}`;
    setCidr(nextCidr);
    calculate(nextCidr);
  };

  const handleCopy = () => {
    if (details) {
      navigator.clipboard.writeText(JSON.stringify(details, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddVlsm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubnetName.trim()) return;
    const hosts = parseInt(newSubnetHosts, 10) || 10;
    addVlsmRequest(newSubnetName.trim(), hosts);
    setNewSubnetName('');
  };

  const prefix = details?.prefixLength || 24;

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {/* Top CIDR Input & Slider Bar */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex-1 min-w-[280px]">
            <label className="text-[11px] font-mono uppercase text-slate-400 block mb-1">
              CIDR Address / Prefix Length
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={cidr}
                onChange={(e) => {
                  setCidr(e.target.value);
                  calculate(e.target.value);
                }}
                placeholder="192.168.10.0/24 or 10.0.0.0/16"
                className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono font-bold"
              />
              <button
                onClick={handleCopy}
                title="Copy Calculation JSON"
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
              {details?.ipVersion || 'IPv4'}
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-purple-500/10 text-[#a855f7] border border-purple-500/30">
              Class {details?.ipClass || 'C'}
            </span>
            <span className="text-[10px] font-mono px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
              {details?.isPrivate ? 'RFC 1918 Private' : 'Public Routable'}
            </span>
          </div>
        </div>

        {/* Interactive Prefix Slider */}
        <div className="space-y-1.5 pt-2">
          <div className="flex justify-between text-xs font-mono text-slate-400">
            <span>Subnet Mask Prefix: /{prefix}</span>
            <span>Total Usable: {details?.usableHosts || '254'} Hosts</span>
          </div>
          <input
            type="range"
            min={0}
            max={32}
            value={prefix}
            onChange={(e) => handleSliderChange(parseInt(e.target.value, 10))}
            className="w-full accent-[#00f0ff] cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-600">
            <span>/0 (Internet)</span>
            <span>/8 (Class A)</span>
            <span>/16 (Class B)</span>
            <span>/24 (Class C)</span>
            <span>/32 (Host)</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Bitwise Binary Netmask Visualizer */}
      <div className="glass-panel p-4 rounded-xl space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-semibold flex items-center gap-1.5">
            <Binary className="w-4 h-4 text-[#00f0ff]" /> 32-Bit Binary Mask Representation
          </span>
          <span className="text-[11px] text-slate-500">
            Network Bits (Cyan) vs Host Bits (Purple)
          </span>
        </div>

        <div className="p-3 bg-[#070c18] rounded-lg border border-white/5 font-mono text-center tracking-widest text-sm">
          {details?.netmaskBinary ? (
            <span>
              <span className="text-[#00f0ff] font-bold">
                {details.netmaskBinary.slice(0, prefix + Math.floor(prefix / 8))}
              </span>
              <span className="text-[#a855f7]">
                {details.netmaskBinary.slice(prefix + Math.floor(prefix / 8))}
              </span>
            </span>
          ) : (
            <span className="text-slate-500">11111111.11111111.11111111.00000000</span>
          )}
        </div>
      </div>

      {/* Subnet Specification Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-slate-400">Network Address</div>
          <div className="text-base font-bold font-mono text-[#00f0ff] mt-1">
            {details?.networkAddress || '192.168.10.0'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">Wire ID (Lowest)</div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-slate-400">Broadcast Address</div>
          <div className="text-base font-bold font-mono text-[#a855f7] mt-1">
            {details?.broadcastAddress || '192.168.10.255'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">All Hosts Broadcast</div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-slate-400">Subnet Mask</div>
          <div className="text-base font-bold font-mono text-white mt-1">
            {details?.netmask || '255.255.255.0'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Wildcard: {details?.wildcardMask || '0.0.0.255'}
          </div>
        </div>

        <div className="glass-panel p-4 rounded-xl">
          <div className="text-[10px] font-mono uppercase text-slate-400">Usable Host Range</div>
          <div className="text-xs font-bold font-mono text-emerald-400 mt-1">
            {details?.usableRange.firstUsable || '192.168.10.1'} – {details?.usableRange.lastUsable || '192.168.10.254'}
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            {details?.usableHosts || '254'} Usable ({details?.totalHosts || '256'} Total)
          </div>
        </div>
      </div>

      {/* VLSM Variable Length Subnet Masking Section */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/5 pb-3">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00f0ff]" /> VLSM Subnet Allocation Planner
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Partitions parent network into optimal variable-length subnets without address waste.
            </p>
          </div>

          <form onSubmit={handleAddVlsm} className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Subnet Name (e.g. VLAN 30 WiFi)"
              value={newSubnetName}
              onChange={(e) => setNewSubnetName(e.target.value)}
              className="px-2.5 py-1.5 rounded glass-input text-xs font-mono w-44"
            />
            <input
              type="number"
              min={1}
              max={100000}
              placeholder="Hosts"
              value={newSubnetHosts}
              onChange={(e) => setNewSubnetHosts(e.target.value)}
              className="px-2 py-1.5 rounded glass-input text-xs font-mono w-20 text-center"
            />
            <button
              type="submit"
              className="px-3 py-1.5 rounded bg-[#00f0ff] hover:bg-[#00f0ff]/90 text-black text-xs font-mono font-bold flex items-center gap-1 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </form>
        </div>

        {/* VLSM Allocations Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="py-2 px-3">Subnet / VLAN Name</th>
                <th className="py-2 px-2">Needed</th>
                <th className="py-2 px-2">Allocated</th>
                <th className="py-2 px-2">Prefix</th>
                <th className="py-2 px-3">Subnet Address</th>
                <th className="py-2 px-3">Usable Range</th>
                <th className="py-2 px-3">Broadcast</th>
                <th className="py-2 px-2 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {vlsmAllocations.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-6 text-slate-500">
                    No VLSM subnets planned. Add host requirements above to partition space.
                  </td>
                </tr>
              ) : (
                vlsmAllocations.map((sub, idx) => (
                  <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-2 px-3 text-white font-semibold flex items-center gap-2">
                      <Network className="w-3.5 h-3.5 text-[#00f0ff]" />
                      {sub.name}
                    </td>
                    <td className="py-2 px-2 text-slate-400">{sub.neededHosts}</td>
                    <td className="py-2 px-2 text-emerald-400 font-bold">{sub.allocatedHosts}</td>
                    <td className="py-2 px-2 text-[#a855f7] font-bold">/{sub.prefix}</td>
                    <td className="py-2 px-3 text-[#00f0ff]">{sub.subnetAddress}</td>
                    <td className="py-2 px-3 text-slate-300">{sub.usableRange}</td>
                    <td className="py-2 px-3 text-slate-400">{sub.broadcast}</td>
                    <td className="py-2 px-2 text-right">
                      <button
                        onClick={() => {
                          const req = vlsmRequests[idx];
                          if (req) removeVlsmRequest(req.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 transition-colors p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
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
