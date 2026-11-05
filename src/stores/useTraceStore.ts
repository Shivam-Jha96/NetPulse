import { create } from 'zustand';
import { api } from '../api/ipc';
import { HopTelemetry, IpTraceResult } from '../types';

interface TraceStoreState {
  target: string;
  isTracing: boolean;
  maxHops: number;
  hops: HopTelemetry[];
  traceResult: IpTraceResult | null;
  activeSessionId: string | null;
  error: string | null;

  setTarget: (target: string) => void;
  setMaxHops: (hops: number) => void;
  lookupIp: (target: string) => Promise<void>;
  startTraceroute: () => Promise<void>;
  stopTraceroute: () => Promise<void>;
  addHop: (hop: HopTelemetry) => void;
  clearHops: () => void;
}

export const useTraceStore = create<TraceStoreState>((set, get) => ({
  target: '1.1.1.1',
  isTracing: false,
  maxHops: 30,
  hops: [],
  traceResult: null,
  activeSessionId: null,
  error: null,

  setTarget: (target) => set({ target }),
  setMaxHops: (maxHops) => set({ maxHops }),

  lookupIp: async (target: string) => {
    set({ error: null });
    const res = await api.traceIp(target);
    if (res.success && res.data) {
      set({ traceResult: res.data });
    } else if (res.error) {
      set({ error: res.error.message });
    }
  },

  startTraceroute: async () => {
    const { target, maxHops } = get();
    set({ isTracing: true, hops: [], error: null });

    // Lookup target IP metadata in parallel
    get().lookupIp(target);

    const res = await api.runTraceroute({
      target,
      maxHops,
      timeout: { secs: 1, nanos: 0 },
    });

    if (res.success && res.data) {
      set({ activeSessionId: res.data.sessionId });
    } else if (res.error) {
      set({ isTracing: false, error: res.error.message });
    }
  },

  stopTraceroute: async () => {
    const { activeSessionId } = get();
    if (activeSessionId) {
      await api.stopTraceroute(activeSessionId);
    }
    set({ isTracing: false, activeSessionId: null });
  },

  addHop: (hop) =>
    set((state) => {
      // Deduplicate hop by TTL
      const filtered = state.hops.filter((h) => h.ttl !== hop.ttl);
      const updated = [...filtered, hop].sort((a, b) => a.ttl - b.ttl);
      return { hops: updated };
    }),

  clearHops: () => set({ hops: [], error: null }),
}));
