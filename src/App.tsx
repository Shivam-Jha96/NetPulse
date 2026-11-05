import React, { useEffect, useState } from 'react';
import { TitleBar } from './components/layout/TitleBar';
import { Sidebar } from './components/layout/Sidebar';
import { StatusBar } from './components/layout/StatusBar';
import { DashboardView } from './components/dashboard/DashboardView';
import { TraceView } from './components/trace/TraceView';
import { MultiTraceView } from './components/enterprise/MultiTraceView';
import { WatchdogView } from './components/enterprise/WatchdogView';
import { PingView } from './components/ping/PingView';
import { SubnetView } from './components/subnet/SubnetView';
import { PortScanView } from './components/portscan/PortScanView';
import { DnsView } from './components/dns/DnsView';
import { WhoisView } from './components/whois/WhoisView';
import { LanView } from './components/lan/LanView';
import { SettingsView } from './components/settings/SettingsView';
import { ReportExportModal } from './components/common/ReportExportModal';
import { ToastContainer } from './components/common/ToastContainer';
import { useAppStore } from './stores/useAppStore';
import { api } from './api/ipc';

export const App: React.FC = () => {
  const { activeView, setInterfaces, setElevationState } = useAppStore();
  const [isExportOpen, setIsExportOpen] = useState(false);

  useEffect(() => {
    // Initial hardware & OS interface scan
    api.getNetworkInterfaces().then((res) => {
      if (res.success && res.data) {
        setInterfaces(res.data);
      }
    });

    api.checkElevationStatus().then((res) => {
      if (res.success && res.data) {
        setElevationState(res.data.isElevated);
      }
    });
  }, [setInterfaces, setElevationState]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#0b0f19] text-[#f8fafc] overflow-hidden select-none">
      {/* Frameless Desktop Window Titlebar */}
      <TitleBar onOpenExport={() => setIsExportOpen(true)} />

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar />

        {/* Dynamic Viewport */}
        <main className="flex-1 flex flex-col bg-[#0b0f19] overflow-hidden relative">
          {activeView === 'dashboard' && <DashboardView />}
          {activeView === 'trace' && <TraceView />}
          {activeView === 'multitrace' && <MultiTraceView />}
          {activeView === 'watchdog' && <WatchdogView />}
          {activeView === 'ping' && <PingView />}
          {activeView === 'subnet' && <SubnetView />}
          {activeView === 'portscan' && <PortScanView />}
          {activeView === 'dns' && <DnsView />}
          {activeView === 'whois' && <WhoisView />}
          {activeView === 'lan' && <LanView />}
          {activeView === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Bottom Status Bar */}
      <StatusBar />

      {/* Report Export Dialog */}
      <ReportExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        defaultType="FULL_AUDIT"
      />

      {/* Reactive Toasts */}
      <ToastContainer />
    </div>
  );
};

export default App;
