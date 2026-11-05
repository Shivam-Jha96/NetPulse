import React from 'react';
import {
  LayoutDashboard,
  Navigation,
  Activity,
  Calculator,
  Scan,
  Globe2,
  FileSearch,
  Network,
  Settings,
  ShieldCheck,
  GitBranch,
  Bell,
} from 'lucide-react';
import { ActiveView, useAppStore } from '../../stores/useAppStore';

interface NavItem {
  id: ActiveView;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: string;
  badgeColor?: string;
  isActiveModule: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, isActiveModule: true },
  { id: 'trace', label: 'IP Trace & MTR', icon: Navigation, isActiveModule: true },
  { id: 'multitrace', label: 'Multi-Target MTR', icon: GitBranch, badge: 'Phase 4', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', isActiveModule: true },
  { id: 'watchdog', label: 'Sentinel Watchdog', icon: Bell, badge: 'Phase 4', badgeColor: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30', isActiveModule: true },
  { id: 'ping', label: 'Ping Monitor', icon: Activity, isActiveModule: true },
  { id: 'subnet', label: 'Subnet & VLSM', icon: Calculator, isActiveModule: true },
  { id: 'portscan', label: 'Port Scanner', icon: Scan, badge: 'Phase 2', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', isActiveModule: true },
  { id: 'dns', label: 'DNS Inspector', icon: Globe2, badge: 'Phase 2', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', isActiveModule: true },
  { id: 'whois', label: 'WHOIS / RDAP', icon: FileSearch, badge: 'Phase 2', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', isActiveModule: true },
  { id: 'lan', label: 'LAN Scanner', icon: Network, badge: 'Phase 3', badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', isActiveModule: true },
  { id: 'settings', label: 'Settings', icon: Settings, isActiveModule: true },
];

export const Sidebar: React.FC = () => {
  const { activeView, setActiveView, pushToast } = useAppStore();

  const handleNavClick = (item: NavItem) => {
    if (item.isActiveModule) {
      setActiveView(item.id);
    } else {
      pushToast({
        type: 'info',
        title: `${item.label}`,
        message: `${item.label} is scheduled in ${item.badge} on the implementation roadmap.`,
      });
    }
  };

  return (
    <aside className="w-60 bg-[#070a12]/95 border-r border-white/5 flex flex-col justify-between select-none">
      {/* Navigation List */}
      <div className="py-3 px-2 flex flex-col gap-1">
        <div className="px-3 pb-2 text-[10px] font-mono uppercase tracking-wider text-slate-500">
          Core Workstation
        </div>
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeView === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 shadow-[0_0_15px_rgba(0,240,255,0.15)] font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#00f0ff]' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border ${item.badgeColor}`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Engine Status Card */}
      <div className="p-3 m-2 rounded-xl bg-white/[0.02] border border-white/5">
        <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 mb-1">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>PAL Unprivileged</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-tight">
          Win32 Iphlpapi zero-elevation socket engine active.
        </p>
      </div>
    </aside>
  );
};
