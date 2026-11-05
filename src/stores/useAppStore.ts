import { create } from 'zustand';
import { NetworkInterface } from '../types';

export type ActiveView = 'dashboard' | 'trace' | 'ping' | 'subnet' | 'portscan' | 'dns' | 'whois' | 'lan' | 'watchdog' | 'multitrace' | 'settings';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title?: string;
  message: string;
  timestamp: number;
}

interface AppStoreState {
  activeView: ActiveView;
  theme: 'dark' | 'light';
  interfaces: NetworkInterface[];
  activeInterface: string;
  isElevated: boolean;
  toasts: ToastMessage[];

  setActiveView: (view: ActiveView) => void;
  toggleTheme: () => void;
  setInterfaces: (interfaces: NetworkInterface[], active?: string) => void;
  setElevationState: (isElevated: boolean) => void;
  pushToast: (toast: Omit<ToastMessage, 'id' | 'timestamp'>) => void;
  dismissToast: (id: string) => void;
}

export const useAppStore = create<AppStoreState>((set) => ({
  activeView: 'dashboard',
  theme: 'dark',
  interfaces: [],
  activeInterface: 'Ethernet',
  isElevated: false,
  toasts: [],

  setActiveView: (activeView) => set({ activeView }),
  toggleTheme: () =>
    set((state) => {
      const next = state.theme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      return { theme: next };
    }),
  setInterfaces: (interfaces, active) =>
    set({
      interfaces,
      activeInterface: active || interfaces[0]?.name || 'Ethernet',
    }),
  setElevationState: (isElevated) => set({ isElevated }),
  pushToast: (toast) =>
    set((state) => ({
      toasts: [
        ...state.toasts,
        {
          ...toast,
          id: crypto.randomUUID(),
          timestamp: Date.now(),
        },
      ],
    })),
  dismissToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
