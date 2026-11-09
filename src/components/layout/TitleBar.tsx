import React, { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, Copy, X, Sun, Moon, Shield, Activity, Download } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

const isTauriApp = () => typeof window !== 'undefined' && ('__TAURI_INTERNALS__' in window || '__TAURI__' in window);

interface TitleBarProps {
  onOpenExport?: () => void;
}

export const TitleBar: React.FC<TitleBarProps> = ({ onOpenExport }) => {
  const { theme, toggleTheme, isElevated } = useAppStore();
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    if (!isTauriApp()) return;

    let unlisten: (() => void) | undefined;
    const appWin = getCurrentWindow();

    appWin.isMaximized().then(setIsMaximized).catch(() => {});

    appWin.onResized(async () => {
      try {
        const max = await appWin.isMaximized();
        setIsMaximized(max);
      } catch {
        // ignore errors
      }
    }).then((fn) => {
      unlisten = fn;
    }).catch(() => {});

    return () => {
      if (unlisten) unlisten();
    };
  }, []);

  const handleMinimize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTauriApp()) {
      try {
        await getCurrentWindow().minimize();
      } catch (err) {
        console.error('Failed to minimize window:', err);
      }
    }
  };

  const handleMaximize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTauriApp()) {
      try {
        await getCurrentWindow().toggleMaximize();
        const max = await getCurrentWindow().isMaximized();
        setIsMaximized(max);
      } catch (err) {
        console.error('Failed to toggle maximize window:', err);
      }
    }
  };

  const handleClose = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isTauriApp()) {
      try {
        await getCurrentWindow().close();
      } catch (err) {
        console.error('Failed to close window:', err);
      }
    }
  };

  return (
    <header
      className="h-10 bg-[#070a12] border-b border-white/5 flex items-center justify-between px-3 select-none z-50 text-xs"
    >
      {/* Brand & Status */}
      <div data-tauri-drag-region className="flex items-center gap-2.5 h-full cursor-default">
        <div className="flex items-center gap-1.5 font-bold tracking-wider text-[#00f0ff] pointer-events-none">
          <Activity className="w-4 h-4 text-[#00f0ff] animate-pulse" />
          <span className="font-mono text-sm tracking-tight text-white">NET<span className="text-[#00f0ff]">PULSE</span></span>
        </div>
        <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 pointer-events-none">
          v1.0.0-GA
        </span>
        {isElevated && (
          <span className="flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 pointer-events-none">
            <Shield className="w-3 h-3" /> ROOT
          </span>
        )}
      </div>

      {/* Middle Drag Info */}
      <div
        data-tauri-drag-region
        onDoubleClick={handleMaximize}
        className="flex-1 h-full flex items-center justify-center text-slate-400 font-mono text-[11px] cursor-default"
      >
        <span className="pointer-events-none">Tactical Network Diagnostics Workstation</span>
      </div>

      {/* Action Controls */}
      <div
        className="flex items-center gap-1 relative z-10"
        onMouseDown={(e) => e.stopPropagation()}
      >
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
          title={isMaximized ? "Restore" : "Maximize"}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/5 rounded transition-colors"
        >
          {isMaximized ? <Copy className="w-3.5 h-3.5 rotate-180" /> : <Square className="w-3.5 h-3.5" />}
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
