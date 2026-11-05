import React, { useMemo } from 'react';
import {
  Network,
  Play,
  RotateCw,
  Search,
  Copy,
  Check,
  ShieldCheck,
  ShieldAlert,
  Server,
  Laptop,
  Smartphone,
  Cpu,
  Router,
  Clock,
  Radio,
  ExternalLink,
} from 'lucide-react';
import { useLanStore } from '../../stores/useLanStore';
import { useAppStore } from '../../stores/useAppStore';
import { useElevation } from '../../hooks/useElevation';
import { LanDevice } from '../../types';

const VENDOR_FILTERS = [
  'ALL',
  'Apple',
  'Cisco',
  'Intel',
  'Raspberry Pi',
  'Espressif',
  'Samsung',
  'Microsoft',
  'Dell',
  'HP',
];

const TYPE_FILTERS = [
  'ALL',
  'Network Equipment',
  'Workstation',
  'Mobile',
  'IoT',
];

export const LanView: React.FC = () => {
  const {
    isScanning,
    scanProgress,
    devices,
    activeInterface,
    subnetCidr,
    durationMs,
    totalHostsScanned,
    searchQuery,
    filterVendor,
    filterType,
    startScan,
    stopScan,
    setSearchQuery,
    setFilterVendor,
    setFilterType,
    setActiveInterface,
  } = useLanStore();

  const { interfaces, setActiveView, pushToast } = useAppStore();
  const { isElevated, helperConnected, requestElevation } = useElevation();
  const [copiedIp, setCopiedIp] = React.useState<string | null>(null);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIp(text);
    pushToast({
      type: 'info',
      title: 'Copied to Clipboard',
      message: `${label}: ${text}`,
    });
    setTimeout(() => setCopiedIp(null), 2000);
  };

  const handleQuickPing = (ip: string) => {
    setActiveView('ping');
    pushToast({
      type: 'info',
      title: 'Switched to Ping Monitor',
      message: `Monitoring host ${ip}`,
    });
  };

  const handleQuickPortScan = (ip: string) => {
    setActiveView('portscan');
    pushToast({
      type: 'info',
      title: 'Switched to Port Scanner',
      message: `Target set to ${ip}`,
    });
  };

  // Filtered devices
  const filteredDevices = useMemo(() => {
    return devices.filter((dev) => {
      // Vendor filter
      if (filterVendor !== 'ALL') {
        if (!dev.vendor.toLowerCase().includes(filterVendor.toLowerCase())) {
          return false;
        }
      }
      // Type filter
      if (filterType !== 'ALL') {
        if (dev.deviceType !== filterType) {
          return false;
        }
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesIp = dev.ip.toLowerCase().includes(q);
        const matchesMac = dev.mac.toLowerCase().includes(q);
        const matchesVendor = dev.vendor.toLowerCase().includes(q);
        const matchesHost = dev.hostname?.toLowerCase().includes(q) ?? false;
        const matchesType = dev.deviceType.toLowerCase().includes(q);
        return matchesIp || matchesMac || matchesVendor || matchesHost || matchesType;
      }
      return true;
    });
  }, [devices, filterVendor, filterType, searchQuery]);

  // Statistics
  const gatewayCount = devices.filter((d) => d.isGateway).length;
  const uniqueVendorsCount = new Set(devices.map((d) => d.vendor)).size;

  const getDeviceIcon = (type: string, isGateway: boolean) => {
    if (isGateway) return <Router className="w-4 h-4 text-[#00f0ff]" />;
    switch (type) {
      case 'Network Equipment':
        return <Router className="w-4 h-4 text-cyan-400" />;
      case 'Mobile':
        return <Smartphone className="w-4 h-4 text-emerald-400" />;
      case 'IoT':
        return <Cpu className="w-4 h-4 text-amber-400" />;
      case 'Server':
        return <Server className="w-4 h-4 text-purple-400" />;
      default:
        return <Laptop className="w-4 h-4 text-blue-400" />;
    }
  };

  const getVendorBadgeStyle = (vendor: string) => {
    const v = vendor.toLowerCase();
    if (v.includes('apple')) return 'bg-slate-400/10 text-slate-200 border-slate-400/20';
    if (v.includes('cisco')) return 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20';
    if (v.includes('intel')) return 'bg-blue-500/10 text-blue-300 border-blue-500/20';
    if (v.includes('raspberry')) return 'bg-rose-500/10 text-rose-300 border-rose-500/20';
    if (v.includes('espressif')) return 'bg-amber-500/10 text-amber-300 border-amber-500/20';
    if (v.includes('samsung')) return 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20';
    if (v.includes('microsoft')) return 'bg-sky-500/10 text-sky-300 border-sky-500/20';
    if (v.includes('dell')) return 'bg-teal-500/10 text-teal-300 border-teal-500/20';
    if (v.includes('hp')) return 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20';
    return 'bg-slate-700/20 text-slate-400 border-slate-600/20';
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0b0f19] text-[#f8fafc] overflow-y-auto p-6 space-y-6">
      {/* View Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-[#00f0ff]/10 border border-[#00f0ff]/20 text-[#00f0ff] shadow-[0_0_20px_rgba(0,240,255,0.2)]">
            <Network className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              LAN ARP Discovery Scanner
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Phase 3 Live
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              High-throughput ARP neighbor cache sweep, IEEE OUI manufacturer resolution, and hostname probing.
            </p>
          </div>
        </div>

        {/* Top Control Actions */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Privilege Status Pill */}
          <button
            onClick={() => !isElevated && requestElevation()}
            title={isElevated ? 'Privileged Helper Connected' : 'Click to Request Administrator Elevation'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono border transition-all ${
              isElevated || helperConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.15)]'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
            }`}
          >
            {isElevated || helperConnected ? (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Elevated Helper</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-3.5 h-3.5" />
                <span>Zero-Elevation PAL</span>
              </>
            )}
          </button>

          {/* Interface Selector Dropdown */}
          <div className="flex items-center gap-1.5 bg-white/[0.03] border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={activeInterface}
              onChange={(e) => setActiveInterface(e.target.value)}
              className="bg-transparent text-xs font-mono focus:outline-none cursor-pointer"
            >
              {interfaces.length > 0 ? (
                interfaces.map((iface) => (
                  <option key={iface.name} value={iface.name} className="bg-[#0b0f19] text-white">
                    {iface.name}
                  </option>
                ))
              ) : (
                <option value="Ethernet / Wi-Fi" className="bg-[#0b0f19] text-white">
                  Ethernet / Wi-Fi
                </option>
              )}
            </select>
          </div>

          {/* Scan Action Button */}
          {isScanning ? (
            <button
              onClick={stopScan}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-rose-300 text-xs font-semibold hover:bg-rose-500/30 transition-all shadow-[0_0_15px_rgba(244,63,94,0.2)]"
            >
              <RotateCw className="w-4 h-4 animate-spin" />
              <span>Cancel Scan</span>
            </button>
          ) : (
            <button
              onClick={() => startScan()}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00f0ff] text-black text-xs font-semibold hover:bg-[#33f3ff] transition-all shadow-[0_0_20px_rgba(0,240,255,0.3)] active:scale-95"
            >
              <Play className="w-4 h-4 fill-black" />
              <span>Start ARP Discovery</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Discovered */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-[#00f0ff]/30 transition-all">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Active Devices
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-white flex items-center gap-2">
            {devices.length}
            {devices.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Discovered on {subnetCidr}
          </div>
        </div>

        {/* Gateways */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-cyan-500/30 transition-all">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Network Gateways
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-cyan-400">
            {gatewayCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Default routing hop(s)
          </div>
        </div>

        {/* Vendors */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-amber-500/30 transition-all">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Identified OUI Vendors
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-amber-400">
            {uniqueVendorsCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            IEEE database mapped
          </div>
        </div>

        {/* Scan Duration / Subnet */}
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 relative overflow-hidden group hover:border-purple-500/30 transition-all">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400">
            Scan Scope & Time
          </div>
          <div className="mt-1 text-2xl font-bold font-mono text-purple-400">
            {durationMs > 0 ? `${durationMs.toFixed(0)} ms` : `${totalHostsScanned} hosts`}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Subnet: {subnetCidr}
          </div>
        </div>
      </div>

      {/* Progress Bar (Visible while scanning) */}
      {isScanning && (
        <div className="w-full bg-white/[0.03] border border-white/10 rounded-xl p-3 flex flex-col gap-2">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-[#00f0ff] flex items-center gap-1.5">
              <RotateCw className="w-3.5 h-3.5 animate-spin" />
              Scanning subnet {subnetCidr} with 20 Hz batch streaming...
            </span>
            <span className="text-slate-400">{scanProgress}%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-[#00f0ff] to-cyan-400 transition-all duration-300"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters & Search Toolbar */}
      <div className="flex flex-col gap-3 p-4 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by IP, MAC, Hostname, or Manufacturer..."
              className="w-full bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#00f0ff]/50 transition-all"
            />
          </div>

          {/* Device Type Select */}
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-400 uppercase font-mono">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-300 focus:outline-none cursor-pointer"
            >
              {TYPE_FILTERS.map((tf) => (
                <option key={tf} value={tf} className="bg-[#0b0f19] text-white">
                  {tf}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vendor Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] text-slate-500 font-mono uppercase mr-1">Vendors:</span>
          {VENDOR_FILTERS.map((vf) => {
            const active = filterVendor === vf;
            return (
              <button
                key={vf}
                onClick={() => setFilterVendor(vf)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono border transition-all ${
                  active
                    ? 'bg-[#00f0ff]/15 text-[#00f0ff] border-[#00f0ff]/40 shadow-[0_0_10px_rgba(0,240,255,0.15)] font-semibold'
                    : 'bg-white/[0.02] text-slate-400 border-white/5 hover:bg-white/5 hover:text-white'
                }`}
              >
                {vf}
              </button>
            );
          })}
        </div>
      </div>

      {/* Discovered Device Table */}
      <div className="flex-1 rounded-xl bg-white/[0.02] border border-white/5 overflow-hidden flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[10px] font-mono text-slate-400 uppercase tracking-wider bg-white/[0.01]">
                <th className="py-3 px-4">Device / Hostname</th>
                <th className="py-3 px-4">IP Address</th>
                <th className="py-3 px-4">MAC Address</th>
                <th className="py-3 px-4">OUI Manufacturer</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Latency</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03] text-xs">
              {filteredDevices.length > 0 ? (
                filteredDevices.map((dev) => (
                  <tr
                    key={dev.ip}
                    className="hover:bg-white/[0.02] transition-colors group font-mono text-slate-300"
                  >
                    {/* Hostname & Icon */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5">
                          {getDeviceIcon(dev.deviceType, dev.isGateway)}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {dev.hostname || 'Unknown Hostname'}
                            {dev.isGateway && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                GATEWAY
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-slate-500">
                            {dev.hostname ? 'Resolved via mDNS / rDNS' : 'Unresolved hostname'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* IP Address */}
                    <td className="py-3.5 px-4 font-bold text-white">
                      <div className="flex items-center gap-1.5">
                        <span>{dev.ip}</span>
                        <button
                          onClick={() => handleCopy(dev.ip, 'IP')}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity"
                          title="Copy IP"
                        >
                          {copiedIp === dev.ip ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* MAC Address */}
                    <td className="py-3.5 px-4 text-slate-400 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span>{dev.mac}</span>
                        <button
                          onClick={() => handleCopy(dev.mac, 'MAC')}
                          className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-white transition-opacity"
                          title="Copy MAC"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                    {/* Vendor Badge */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-1 rounded-md text-[11px] border font-sans font-medium ${getVendorBadgeStyle(
                          dev.vendor
                        )}`}
                      >
                        {dev.vendor}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="py-3.5 px-4 text-slate-400">
                      <span className="text-xs">{dev.deviceType}</span>
                    </td>

                    {/* Latency */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>
                          {dev.latencyMs !== null ? `${dev.latencyMs.toFixed(2)} ms` : '—'}
                        </span>
                      </div>
                    </td>

                    {/* Quick Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleQuickPing(dev.ip)}
                          className="px-2 py-1 rounded text-[11px] bg-white/[0.03] hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 transition-all"
                          title="Ping this IP"
                        >
                          Ping
                        </button>
                        <button
                          onClick={() => handleQuickPortScan(dev.ip)}
                          className="px-2 py-1 rounded text-[11px] bg-white/[0.03] hover:bg-white/10 text-[#00f0ff] hover:text-[#00f0ff] border border-white/5 transition-all"
                          title="Port Scan this IP"
                        >
                          Port Scan
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Network className="w-8 h-8 text-slate-600 mb-1" />
                      <p className="text-sm font-semibold text-slate-400">No LAN devices discovered yet</p>
                      <p className="text-xs text-slate-500 max-w-sm">
                        Click &ldquo;Start ARP Discovery&rdquo; to sweep your local subnet for connected workstations, mobile devices, IoT hardware, and network routers.
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LanView;
