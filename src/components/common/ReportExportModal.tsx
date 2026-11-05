import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  FileCode,
  FileSpreadsheet,
  FileText,
  Radio,
  Shield,
  X,
} from 'lucide-react';
import { api } from '../../api/ipc';
import { useAppStore } from '../../stores/useAppStore';
import { ReportFormat, ReportType } from '../../types';

interface ReportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultType?: ReportType;
  target?: string;
}

export const ReportExportModal: React.FC<ReportExportModalProps> = ({
  isOpen,
  onClose,
  defaultType = 'FULL_AUDIT',
  target,
}) => {
  const { pushToast } = useAppStore();

  const [format, setFormat] = useState<ReportFormat>('HTML');
  const [reportType, setReportType] = useState<ReportType>(defaultType);
  const [isExporting, setIsExporting] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const res = await api.exportReport({
        format,
        reportType,
        title: `NetPulse ${reportType} Audit`,
        target: target || 'Diagnostic Session',
      });

      if (res.success && res.data) {
        const result = res.data;

        // Trigger file download
        let downloadUrl = '';
        if (result.contentBase64) {
          downloadUrl = `data:${result.mimeType};base64,${result.contentBase64}`;
        } else if (result.contentText) {
          const blob = new Blob([result.contentText], { type: result.mimeType });
          downloadUrl = URL.createObjectURL(blob);
        }

        if (downloadUrl) {
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = result.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          pushToast({
            type: 'success',
            title: 'Report Exported Successfully',
            message: `Downloaded ${result.filename} (${(result.sizeBytes / 1024).toFixed(1)} KB)`,
          });
        }

        setIsExporting(false);
        onClose();
      } else {
        setIsExporting(false);
        pushToast({
          type: 'error',
          title: 'Export Failed',
          message: res.error?.message || 'Could not serialize report',
        });
      }
    } catch (err) {
      console.error('Failed to export report:', err);
      setIsExporting(false);
      pushToast({
        type: 'error',
        title: 'Export Failed',
        message: 'An unexpected error occurred during export generation.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0e1322] border border-white/10 rounded-2xl p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/20">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">Export Diagnostic Report</h2>
              <p className="text-xs text-slate-400">Standard binary PCAP, RFC 4180 CSV & Cyber-Glassmorphic HTML</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Format Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400 tracking-wider">Target Format</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              { id: 'HTML', label: 'HTML Audit', icon: FileCode, desc: 'Executive UI' },
              { id: 'CSV', label: 'RFC CSV', icon: FileSpreadsheet, desc: 'Data Tables' },
              { id: 'PCAP', label: 'Libpcap', icon: Radio, desc: 'Wireshark 2.4' },
              { id: 'JSON', label: 'Raw JSON', icon: FileText, desc: 'Raw Schemas' },
            ].map((f) => {
              const Icon = f.icon;
              const isSelected = format === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFormat(f.id as ReportFormat)}
                  className={`p-3 rounded-xl border flex flex-col items-center text-center gap-1.5 transition-all ${
                    isSelected
                      ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/40 shadow-[0_0_12px_rgba(0,240,255,0.15)] font-bold'
                      : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-xs">{f.label}</span>
                  <span className="text-[9px] text-slate-500 font-mono">{f.desc}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Report Scope Selector */}
        <div className="space-y-2">
          <label className="text-xs font-mono uppercase text-slate-400 tracking-wider">Report Scope</label>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            {[
              { id: 'FULL_AUDIT', label: 'Full Diagnostic Audit' },
              { id: 'TRACEROUTE', label: 'MTR Traceroute Hops' },
              { id: 'PING_SERIES', label: 'Ping Latency Series' },
              { id: 'PORT_SCAN', label: 'Port Scan Inventory' },
              { id: 'LAN_INVENTORY', label: 'LAN ARP Neighbors' },
            ].map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => setReportType(r.id as ReportType)}
                className={`p-2.5 rounded-lg border text-left transition-all ${
                  reportType === r.id
                    ? 'bg-[#00f0ff]/10 text-[#00f0ff] border-[#00f0ff]/30 font-bold'
                    : 'bg-white/[0.02] text-slate-400 border-white/5 hover:text-white hover:bg-white/5'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Security & Authenticity Notice */}
        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-start gap-2.5 text-xs font-mono text-slate-400">
          <Shield className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-[11px] leading-relaxed">
            All reports include SHA-256 integrity digest, timestamp certificate, and RFC compliant data formats suitable for compliance audits (SOC 2, ISO 27001).
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-white/5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="px-5 py-2 rounded-lg text-xs font-semibold bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff]/30 hover:bg-[#00f0ff]/20 shadow-[0_0_15px_rgba(0,240,255,0.2)] flex items-center gap-2 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <span>Generating...</span>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Export Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
