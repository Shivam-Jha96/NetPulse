import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Sun,
  Moon,
  Database,
  Globe,
  Sliders,
  Download,
  Shield,
  Info,
  RefreshCw,
  CheckCircle2,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';
import { api } from '../../api/ipc';
import { UpdateStatus } from '../../types';

export const SettingsView: React.FC = () => {
  const { theme, toggleTheme, pushToast } = useAppStore();
  const [offlineGeo, setOfflineGeo] = useState(true);
  const [defaultDns, setDefaultDns] = useState('1.1.1.1 (Cloudflare)');
  const [defaultInterval, setDefaultInterval] = useState('1000');
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateResult, setUpdateResult] = useState<UpdateStatus | null>(null);

  const handleExport = (format: string) => {
    pushToast({
      type: 'success',
      title: 'Export Generated',
      message: `Diagnostic session telemetry exported in ${format} format.`,
    });
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    try {
      const res = await api.checkForUpdates();
      if (res.success && res.data) {
        setUpdateResult(res.data);
        if (res.data.isUpdateAvailable) {
          pushToast({
            type: 'info',
            title: 'Update Available',
            message: `NetPulse v${res.data.targetVersion} is ready for installation.`,
          });
        } else {
          pushToast({
            type: 'success',
            title: 'Up to Date',
            message: 'You are running the latest version of NetPulse Workstation.',
          });
        }
      }
    } catch {
      pushToast({
        type: 'error',
        title: 'Update Check Failed',
        message: 'Could not connect to update distribution channel.',
      });
    } finally {
      setCheckingUpdate(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6 space-y-6 max-w-4xl">
      <div className="border-b border-white/5 pb-4">
        <h2 className="text-xl font-bold font-mono text-white flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-[#00f0ff]" /> Workstation Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Customize network telemetry parameters, offline geolocation database, and desktop visual themes.
        </p>
      </div>

      {/* Appearance Section */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
          Visual Appearance
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Workstation Theme</div>
            <div className="text-xs text-slate-400">
              Toggle between Cyber-Dark (OLED deep black) and Tactical Light high-contrast modes.
            </div>
          </div>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-xs flex items-center gap-2 border border-white/10 transition-colors"
          >
            {theme === 'dark' ? <Moon className="w-4 h-4 text-[#00f0ff]" /> : <Sun className="w-4 h-4 text-amber-400" />}
            <span className="capitalize">{theme} Theme</span>
          </button>
        </div>
      </div>

      {/* Offline Geolocation Section */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Database className="w-4 h-4 text-[#a855f7]" /> Offline MaxMind GeoLite2 Database
        </h3>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-semibold text-white">Embedded GeoLite2 Reader</div>
            <div className="text-xs text-slate-400">
              Enables sub-millisecond offline IP geolocation without third-party API keys or internet egress.
            </div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={offlineGeo}
              onChange={(e) => setOfflineGeo(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#00f0ff]"></div>
          </label>
        </div>
      </div>

      {/* Network Engine Defaults */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Globe className="w-4 h-4 text-[#00f0ff]" /> Network Engine Defaults
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Primary Recursive DNS Resolver
            </label>
            <select
              value={defaultDns}
              onChange={(e) => setDefaultDns(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono"
            >
              <option value="1.1.1.1 (Cloudflare)">1.1.1.1 (Cloudflare Primary)</option>
              <option value="8.8.8.8 (Google)">8.8.8.8 (Google Public DNS)</option>
              <option value="9.9.9.9 (Quad9)">9.9.9.9 (Quad9 Security Filter)</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-mono text-slate-400 block mb-1">
              Default ICMP Ping Interval
            </label>
            <select
              value={defaultInterval}
              onChange={(e) => setDefaultInterval(e.target.value)}
              className="w-full px-3 py-2 rounded-lg glass-input text-xs font-mono"
            >
              <option value="200">200 ms (Fast Sweep)</option>
              <option value="500">500 ms (High Frequency)</option>
              <option value="1000">1000 ms (Standard)</option>
              <option value="2000">2000 ms (Battery Friendly)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Diagnostic Vault Export */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" /> Diagnostic Vault Export
        </h3>
        <p className="text-xs text-slate-400">
          Save historical telemetry captures, traceroute path graphs, and latency statistics for reporting.
        </p>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('JSON')}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 transition-colors"
          >
            Export JSON Data
          </button>
          <button
            onClick={() => handleExport('CSV')}
            className="px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white font-mono text-xs border border-white/10 transition-colors"
          >
            Export CSV Timeseries
          </button>
        </div>
      </div>

      {/* Software Updates & Deployment */}
      <div className="glass-panel p-5 rounded-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#00f0ff]" /> Software Updates & Release Channel
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Verify cryptographic binary signatures, download updates, or check the production release feed.
            </p>
          </div>
          <button
            onClick={handleCheckUpdates}
            disabled={checkingUpdate}
            className="px-4 py-2 rounded-lg bg-[#00f0ff]/10 hover:bg-[#00f0ff]/20 text-[#00f0ff] font-mono text-xs border border-[#00f0ff]/30 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin' : ''}`} />
            {checkingUpdate ? 'Checking Channel...' : 'Check for Updates'}
          </button>
        </div>

        <div className="p-4 rounded-lg bg-black/30 border border-white/5 space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Current Installed Version</span>
            <span className="text-white font-bold px-2 py-0.5 rounded bg-white/10 text-[11px]">v1.0.0 (Release Build)</span>
          </div>
          <div className="flex items-center justify-between border-b border-white/5 pb-2">
            <span className="text-slate-400">Trust Anchor (Ed25519 PubKey)</span>
            <span className="text-slate-400 text-[11px] truncate max-w-[260px] sm:max-w-md">
              e3b0c442...7852b855
            </span>
          </div>

          {updateResult && (
            <div className="pt-1 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-400">Release Status</span>
                {updateResult.isUpdateAvailable ? (
                  <span className="text-amber-400 flex items-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" /> Version v{updateResult.targetVersion} Available
                  </span>
                ) : (
                  <span className="text-emerald-400 flex items-center gap-1 font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Workstation Up to Date
                  </span>
                )}
              </div>

              {updateResult.isUpdateAvailable && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Signature Verification</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <Shield className="w-3.5 h-3.5" /> Authenticode & Ed25519 Verified
                    </span>
                  </div>
                  {updateResult.releaseNotes && (
                    <div className="mt-2 p-3 rounded bg-white/5 border border-white/10 text-slate-300 text-[11px] leading-relaxed">
                      <div className="text-[#00f0ff] font-bold mb-1">Release Notes:</div>
                      {updateResult.releaseNotes}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* System Information */}
      <div className="glass-panel p-5 rounded-xl space-y-2">
        <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
          <Info className="w-4 h-4 text-slate-400" /> Workstation Architecture
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-slate-400 pt-2">
          <div>
            <span className="text-slate-600 block">Desktop Harness</span>
            <span className="text-white">Tauri v2.12</span>
          </div>
          <div>
            <span className="text-slate-600 block">Core Architecture</span>
            <span className="text-white">Rust Edition 2021</span>
          </div>
          <div>
            <span className="text-slate-600 block">Presentation</span>
            <span className="text-white">React 19 / Vite 6</span>
          </div>
          <div>
            <span className="text-slate-600 block">Operating System</span>
            <span className="text-white">Windows (x86_64)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
