import { create } from 'zustand';
import { api } from '../api/ipc';
import { PingSample, RttStatistics } from '../types';

interface PingStoreState {
  target: string;
  intervalMs: number;
  packetSize: number;
  dfBit: boolean;
  isPinging: boolean;
  activeSessionId: string | null;
  samples: PingSample[];
  stats: RttStatistics;
  error: string | null;

  setTarget: (target: string) => void;
  setIntervalMs: (ms: number) => void;
  setPacketSize: (size: number) => void;
  setDfBit: (df: boolean) => void;
  startPing: () => Promise<void>;
  stopPing: () => Promise<void>;
  addSample: (sample: PingSample) => void;
  resetSamples: () => void;
}

const initialStats: RttStatistics = {
  min: null,
  avg: null,
  max: null,
  stdev: null,
  p95: null,
  p99: null,
  jitterMs: null,
  packetsSent: 0,
  packetsReceived: 0,
  packetLossPercent: 0,
};

export const usePingStore = create<PingStoreState>((set, get) => ({
  target: '1.1.1.1',
  intervalMs: 1000,
  packetSize: 56,
  dfBit: false,
  isPinging: false,
  activeSessionId: null,
  samples: [],
  stats: initialStats,
  error: null,

  setTarget: (target) => set({ target }),
  setIntervalMs: (intervalMs) => set({ intervalMs }),
  setPacketSize: (packetSize) => set({ packetSize }),
  setDfBit: (dfBit) => set({ dfBit }),

  startPing: async () => {
    const { target, intervalMs, packetSize, dfBit } = get();
    set({ isPinging: true, error: null });

    const secs = Math.floor(intervalMs / 1000);
    const nanos = (intervalMs % 1000) * 1_000_000;

    const res = await api.startContinuousPing({
      target,
      interval: { secs, nanos },
      packetSize,
      dfBit,
      timeout: { secs: 1, nanos: 500_000_000 },
    });

    if (res.success && res.data) {
      set({ activeSessionId: res.data.sessionId });
    } else if (res.error) {
      set({ isPinging: false, error: res.error.message });
    }
  },

  stopPing: async () => {
    const { activeSessionId } = get();
    if (activeSessionId) {
      await api.stopContinuousPing(activeSessionId);
    }
    set({ isPinging: false, activeSessionId: null });
  },

  addSample: (sample) =>
    set((state) => {
      // Keep last 100 samples
      const samples = [...state.samples.slice(-99), sample];

      // Recompute running statistics
      const sent = state.stats.packetsSent + 1;
      const isSuccess = sample.status === 'SUCCESS' && sample.rttMs !== null;
      const received = state.stats.packetsReceived + (isSuccess ? 1 : 0);
      const lossPercent = ((sent - received) / sent) * 100;

      const validRtts = samples.filter((s) => s.status === 'SUCCESS' && s.rttMs !== null).map((s) => s.rttMs!);

      let min = state.stats.min;
      let max = state.stats.max;
      let avg = state.stats.avg;
      let stdev = state.stats.stdev;
      let jitter = state.stats.jitterMs || 0;

      if (sample.rttMs !== null) {
        min = min !== null ? Math.min(min, sample.rttMs) : sample.rttMs;
        max = max !== null ? Math.max(max, sample.rttMs) : sample.rttMs;
      }

      if (validRtts.length > 0) {
        const sum = validRtts.reduce((a, b) => a + b, 0);
        avg = sum / validRtts.length;
        const variance = validRtts.reduce((acc, val) => acc + Math.pow(val - avg!, 2), 0) / validRtts.length;
        stdev = Math.sqrt(variance);

        // RFC 3550 Jitter
        if (validRtts.length >= 2) {
          const last = validRtts[validRtts.length - 1];
          const prev = validRtts[validRtts.length - 2];
          jitter += (Math.abs(last - prev) - jitter) / 16;
        }
      }

      return {
        samples,
        stats: {
          min,
          avg,
          max,
          stdev,
          p95: max,
          p99: max,
          jitterMs: jitter,
          packetsSent: sent,
          packetsReceived: received,
          packetLossPercent: lossPercent,
        },
      };
    }),

  resetSamples: () => set({ samples: [], stats: initialStats, error: null }),
}));
