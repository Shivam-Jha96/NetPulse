import React from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useAppStore } from '../../stores/useAppStore';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useAppStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-10 right-4 flex flex-col gap-2 z-50 pointer-events-none max-w-sm">
      {toasts.map((toast) => {
        const Icon =
          toast.type === 'success'
            ? CheckCircle
            : toast.type === 'error'
            ? AlertCircle
            : toast.type === 'warning'
            ? AlertTriangle
            : Info;

        const borderClass =
          toast.type === 'success'
            ? 'border-emerald-500/40 text-emerald-400'
            : toast.type === 'error'
            ? 'border-rose-500/40 text-rose-400'
            : toast.type === 'warning'
            ? 'border-amber-500/40 text-amber-400'
            : 'border-[#00f0ff]/40 text-[#00f0ff]';

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3 rounded-xl bg-[#0b0f19]/95 backdrop-blur-xl border ${borderClass} shadow-2xl text-xs font-mono transition-all animate-in fade-in slide-in-from-right`}
          >
            <Icon className="w-4 h-4 mt-0.5 shrink-0" />
            <div className="flex-1">
              {toast.title && <div className="font-bold text-white mb-0.5">{toast.title}</div>}
              <div className="text-slate-300 leading-snug">{toast.message}</div>
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-slate-500 hover:text-white transition-colors p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
