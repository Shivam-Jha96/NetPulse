import { create } from 'zustand';
import { PortResult, PortScanResult } from '../types';

export interface PortScanStoreState {
  target: string;
  scanType: 'TCP_CONNECT' | 'SYN_STEALTH' | 'UDP';
  portPreset: string;
  customPorts: string;
  concurrency: number;
  timeoutMs: number;
  grabBanners: boolean;
  isRunning: boolean;
  progressPercent: number;
  openPorts: PortResult[];
  closedCount: number;
  filteredCount: number;
  selectedPort: PortResult | null;
  scanResult: PortScanResult | null;
  error: string | null;

  setTarget: (target: string) => void;
  setScanType: (scanType: 'TCP_CONNECT' | 'SYN_STEALTH' | 'UDP') => void;
  setPortPreset: (portPreset: string) => void;
  setCustomPorts: (customPorts: string) => void;
  setConcurrency: (concurrency: number) => void;
  setTimeoutMs: (timeoutMs: number) => void;
  setGrabBanners: (grabBanners: boolean) => void;
  startScan: () => void;
  ingestPort: (port: PortResult) => void;
  ingestPortBatch: (batch: PortResult[], progress?: number) => void;
  completeScan: (result: PortScanResult) => void;
  stopScan: () => void;
  selectPort: (selectedPort: PortResult | null) => void;
  resetScan: () => void;
}

export const usePortScanStore = create<PortScanStoreState>((set) => ({
  target: '127.0.0.1',
  scanType: 'TCP_CONNECT',
  portPreset: 'top-20',
  customPorts: '80, 443, 8080',
  concurrency: 250,
  timeoutMs: 1500,
  grabBanners: true,
  isRunning: false,
  progressPercent: 0,
  openPorts: [],
  closedCount: 0,
  filteredCount: 0,
  selectedPort: null,
  scanResult: null,
  error: null,

  setTarget: (target) => set({ target }),
  setScanType: (scanType) => set({ scanType }),
  setPortPreset: (portPreset) => set({ portPreset }),
  setCustomPorts: (customPorts) => set({ customPorts }),
  setConcurrency: (concurrency) => set({ concurrency }),
  setTimeoutMs: (timeoutMs) => set({ timeoutMs }),
  setGrabBanners: (grabBanners) => set({ grabBanners }),

  startScan: () =>
    set({
      isRunning: true,
      progressPercent: 0,
      openPorts: [],
      closedCount: 0,
      filteredCount: 0,
      selectedPort: null,
      scanResult: null,
      error: null,
    }),

  ingestPort: (port) =>
    set((state) => {
      if (port.state === 'OPEN') {
        if (!state.openPorts.some((p) => p.port === port.port)) {
          return { openPorts: [...state.openPorts, port] };
        }
      } else if (port.state === 'CLOSED') {
        return { closedCount: state.closedCount + 1 };
      } else if (port.state === 'FILTERED') {
        return { filteredCount: state.filteredCount + 1 };
      }
      return {};
    }),

  ingestPortBatch: (batch, progress) =>
    set((state) => {
      const newOpen = batch.filter(
        (p) => p.state === 'OPEN' && !state.openPorts.some((op) => op.port === p.port)
      );
      const newClosed = batch.filter((p) => p.state === 'CLOSED').length;
      const newFiltered = batch.filter((p) => p.state === 'FILTERED').length;

      return {
        openPorts: [...state.openPorts, ...newOpen],
        closedCount: state.closedCount + newClosed,
        filteredCount: state.filteredCount + newFiltered,
        progressPercent: progress !== undefined ? progress : state.progressPercent,
      };
    }),

  completeScan: (scanResult) =>
    set({
      isRunning: false,
      progressPercent: 100,
      scanResult,
      openPorts: scanResult.ports.filter((p) => p.state === 'OPEN'),
      closedCount: scanResult.closedCount,
      filteredCount: scanResult.filteredCount,
    }),

  stopScan: () => set({ isRunning: false, progressPercent: 100 }),

  selectPort: (selectedPort) => set({ selectedPort }),

  resetScan: () =>
    set({
      isRunning: false,
      progressPercent: 0,
      openPorts: [],
      closedCount: 0,
      filteredCount: 0,
      selectedPort: null,
      scanResult: null,
      error: null,
    }),
}));
