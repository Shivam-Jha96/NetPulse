import { create } from 'zustand';
import { LanDevice, LanScanResult } from '../types';
import { api } from '../api/ipc';

interface LanStoreState {
  isScanning: boolean;
  scanProgress: number;
  devices: LanDevice[];
  activeInterface: string;
  subnetCidr: string;
  durationMs: number;
  totalHostsScanned: number;
  searchQuery: string;
  filterVendor: string;
  filterType: string;

  startScan: (interfaceName?: string) => Promise<void>;
  stopScan: () => void;
  setSearchQuery: (query: string) => void;
  setFilterVendor: (vendor: string) => void;
  setFilterType: (type: string) => void;
  setActiveInterface: (interfaceName: string) => void;
  addDevice: (device: LanDevice) => void;
  addDeviceBatch: (batch: LanDevice[]) => void;
  clearDevices: () => void;
}

export const useLanStore = create<LanStoreState>((set, get) => ({
  isScanning: false,
  scanProgress: 0,
  devices: [],
  activeInterface: 'Ethernet / Wi-Fi',
  subnetCidr: '192.168.1.0/24',
  durationMs: 0,
  totalHostsScanned: 254,
  searchQuery: '',
  filterVendor: 'ALL',
  filterType: 'ALL',

  startScan: async (interfaceName?: string) => {
    const iface = interfaceName || get().activeInterface;
    set({
      isScanning: true,
      scanProgress: 10,
      activeInterface: iface,
      devices: [],
    });

    // Wire real-time streaming listeners
    const unlistenDev = api.onLanDeviceDiscovered((dev) => {
      get().addDevice(dev);
    });

    const unlistenBatch = api.onLanDeviceDiscoveredBatch((batch) => {
      get().addDeviceBatch(batch);
    });

    // Simulated progress tick while scanning
    const progressInterval = setInterval(() => {
      set((state) => {
        if (!state.isScanning) return state;
        const next = Math.min(state.scanProgress + 15, 95);
        return { scanProgress: next };
      });
    }, 150);

    try {
      const res = await api.scanLan(iface);
      clearInterval(progressInterval);
      unlistenDev();
      unlistenBatch();

      if (res.success && res.data) {
        const data: LanScanResult = res.data;
        set({
          isScanning: false,
          scanProgress: 100,
          subnetCidr: data.subnetCidr,
          totalHostsScanned: data.totalHostsScanned,
          durationMs: data.durationMs,
          devices: data.devices,
        });
      } else {
        set({ isScanning: false, scanProgress: 0 });
      }
    } catch (err) {
      clearInterval(progressInterval);
      unlistenDev();
      unlistenBatch();
      set({ isScanning: false, scanProgress: 0 });
    }
  },

  stopScan: () => set({ isScanning: false, scanProgress: 0 }),

  setSearchQuery: (searchQuery: string) => set({ searchQuery }),

  setFilterVendor: (filterVendor: string) => set({ filterVendor }),

  setFilterType: (filterType: string) => set({ filterType }),

  setActiveInterface: (activeInterface: string) => set({ activeInterface }),

  addDevice: (device: LanDevice) => {
    set((state) => {
      if (state.devices.some((d) => d.ip === device.ip)) {
        return state;
      }
      return { devices: [...state.devices, device] };
    });
  },

  addDeviceBatch: (batch: LanDevice[]) => {
    set((state) => {
      const existingIps = new Set(state.devices.map((d) => d.ip));
      const newItems = batch.filter((d) => !existingIps.has(d.ip));
      if (newItems.length === 0) return state;
      return { devices: [...state.devices, ...newItems] };
    });
  },

  clearDevices: () => set({ devices: [], scanProgress: 0 }),
}));
