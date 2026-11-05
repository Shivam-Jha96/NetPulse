import { create } from 'zustand';
import { api } from '../api/ipc';
import { WatchdogAlert, WatchdogConfig, WatchdogStatus } from '../types';

interface WatchdogStoreState {
  status: WatchdogStatus;
  config: WatchdogConfig;
  isLoading: boolean;
  isSubscribed: boolean;

  fetchStatus: () => Promise<void>;
  startWatchdog: () => Promise<void>;
  stopWatchdog: () => Promise<void>;
  updateConfig: (newConfig: Partial<WatchdogConfig>) => void;
  subscribeEvents: () => () => void;
  clearAlerts: () => void;
}

const DEFAULT_CONFIG: WatchdogConfig = {
  intervalSecs: 5,
  latencyThresholdMs: 100,
  lossThresholdPercent: 5,
  targets: [
    { name: 'Default Gateway', endpoint: '192.168.1.1', targetType: 'gateway', enabled: true },
    { name: 'Primary DNS (Cloudflare)', endpoint: '1.1.1.1', targetType: 'dns', enabled: true },
    { name: 'Public Anchor (Google)', endpoint: '8.8.8.8', targetType: 'anchor', enabled: true },
  ],
  alertChannels: ['Desktop Notification', 'Audit Log'],
};

const INITIAL_STATUS: WatchdogStatus = {
  running: false,
  uptimeSecs: 0,
  lastProbeTime: null,
  activeInterface: 'Ethernet',
  interfaceState: 'UP',
  targetStatuses: [],
  totalAlertsEmitted: 0,
  recentAlerts: [],
};

export const useWatchdogStore = create<WatchdogStoreState>((set, get) => ({
  status: INITIAL_STATUS,
  config: DEFAULT_CONFIG,
  isLoading: false,
  isSubscribed: false,

  fetchStatus: async () => {
    try {
      const res = await api.getWatchdogStatus();
      if (res.success && res.data) {
        set({ status: res.data });
      }
    } catch (err) {
      console.error('Failed to fetch watchdog status:', err);
    }
  },

  startWatchdog: async () => {
    set({ isLoading: true });
    try {
      const { config } = get();
      const res = await api.startWatchdog(config);
      if (res.success && res.data) {
        set({ status: res.data, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Failed to start watchdog:', err);
      set({ isLoading: false });
    }
  },

  stopWatchdog: async () => {
    set({ isLoading: true });
    try {
      const res = await api.stopWatchdog();
      if (res.success) {
        set((state) => ({
          status: { ...state.status, running: false },
          isLoading: false,
        }));
      } else {
        set({ isLoading: false });
      }
    } catch (err) {
      console.error('Failed to stop watchdog:', err);
      set({ isLoading: false });
    }
  },

  updateConfig: (partial) => {
    set((state) => ({
      config: { ...state.config, ...partial },
    }));
  },

  subscribeEvents: () => {
    const unlistenStatus = api.onWatchdogStatus((newStatus) => {
      set({ status: newStatus });
    });

    const unlistenAlert = api.onWatchdogAlert((alert: WatchdogAlert) => {
      set((state) => ({
        status: {
          ...state.status,
          totalAlertsEmitted: state.status.totalAlertsEmitted + 1,
          recentAlerts: [alert, ...state.status.recentAlerts.slice(0, 49)],
        },
      }));
    });

    return () => {
      unlistenStatus();
      unlistenAlert();
    };
  },

  clearAlerts: () => {
    set((state) => ({
      status: { ...state.status, recentAlerts: [] },
    }));
  },
}));
