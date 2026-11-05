import React from 'react';
import { Wifi, Database, Radio } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { useTraceStore } from '../../stores/useTraceStore';

export const StatusBar: React.FC = () => {
  const { activeInterface } = useAppStore();
  const { traceResult } = useTraceStore();

  return (
    <footer className="h-7 bg-[#070a12] border-t border-white/5 flex items-center justify-between px-3 text-[11px] font-mono text-slate-400 select-none z-40">
      <div className="flex items-center gap-4">
        {/* Network NIC status */}
        <div className="flex items-center gap-1.5 text-emerald-400">
          <Wifi className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>NIC: {activeInterface}</span>
        </div>

        {/* Egress IP */}
        <div className="flex items-center gap-1 text-slate-300">
          <span className="text-slate-500">Egress:</span>
          <span className="text-[#00f0ff]">{traceResult?.ip || '1.1.1.1'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* GeoLite2 DB status */}
        <div className="flex items-center gap-1.5 text-slate-300">
          <Database className="w-3 h-3 text-[#a855f7]" />
          <span>GeoLite2: <span className="text-[#a855f7]">Active (Embedded)</span></span>
        </div>

        {/* Telemetry Stream rate */}
        <div className="flex items-center gap-1.5 text-cyan-400">
          <Radio className="w-3 h-3 text-[#00f0ff]" />
          <span>20 Hz IPC</span>
        </div>
      </div>
    </footer>
  );
};
