import React from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Sun, Moon, Shield, Activity, Download } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

interface TitleBarProps {
  onOpenExport?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenExport }) => {
  const { theme, toggleTheme, isElevated } = useAppStore();

  const handleMinimize = () => {
    if (isTauri) {
      getCurrentWindow().minimize();
    }
  };

  const handleMaximize = () => {
    if (isTauri) {
      getCurrentWindow().toggleMaximize();
    }
  };

  const handleClose = () => {
    if (isTauri) {
      getCurrentWindow().close();
    }
  };

  return (
    <header
      data-tauri-drag-region
      className="h-10 bg-[#070a12] border-b border-white/5 flex items-center justify-between px-3 select-none z-50 text-xs"
    >
      {/* Brand & Status */}
      <div className="flex items-center gap-2.5 pointer-events-none">
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-[#00f0ff]">
          <Activity className="w-4 h-4 text-[#00f0ff] animate-pulse" />
          <span className="font-mono text-sm tracking-tight text-white">NET<span className="text-[#00f0ff]">PULSE</span></span>
        </div>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30">
          v1.0.0-GA
        </span>
        {isElevated && (
          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
            <Shield className="w-3 h-3" /> ROOT
          </span>
        )}
      </div>

      {/* Middle Drag Info */}
      <div data-tauri-drag-region className="flex-1 h-full flex items-center justify-center text-slate-400 font-mono text-[11px]">
        <span>Tactical Network Diagnostics Workstation</span>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-1">
        {onOpenExport && (
          <button
            onClick={onOpenExport}
            title="Export Diagnostic Report (PCAP / CSV / HTML / JSON)"
            className="px-2.5 py-1 text-slate-300 hover:text-[#00f0ff] hover:bg-white/5 rounded text-[11px] font-mono flex items-center gap-1.5 transition-all border border-white/5 hover:border-[#00f0ff]/30 mr-1"
          >
            <Download className="w-3.5 h-3.5 text-[#00f0ff]" />
            <span>Export Report</span>
          </button>
        )}

        <button
          onClick={toggleTheme}
          title="Toggle Theme"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
        </button>

        <div className="w-[1px] h-3.5 bg-white/10 mx-1" />

        <button
          onClick={handleMinimize}
          title="Minimize"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleMaximize}
          title="Maximize"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          <Square className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={handleClose}
          title="Close"
          className="p-1.5 text-slate-400 hover:text-white hover:bg-rose-500/80 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </header>
  );
};
