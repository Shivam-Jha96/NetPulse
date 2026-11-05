import { create } from 'zustand';
import { api } from '../api/ipc';
import { HistoricalPathRecord, MultiTraceResult, TargetTraceProgress } from '../types';

interface MultiTraceStoreState {
  targets: string[];
  maxHops: number;
  timeoutMs: number;
  isRunning: boolean;
  targetResults: Record<string, TargetTraceProgress>;
  selectedTarget: string;
  historicalPaths: Record<string, HistoricalPathRecord[]>;
  totalDeviations: number;
  activeSessionId: string | null;

  addTarget: (target: string) => void;
  removeTarget: (target: string) => void;
  setTargets: (targets: string[]) => void;
  setMaxHops: (maxHops: number) => void;
  setTimeoutMs: (timeoutMs: number) => void;
  setSelectedTarget: (target: string) => void;
  startMultiTrace: () => Promise<void>;
  fetchHistoricalPaths: (target: string) => Promise<void>;
  subscribeEvents: () => () => void;
  clearResults: () => void;
}

const DEFAULT_TARGETS = ['1.1.1.1', '8.8.8.8', '9.9.9.9', '208.67.222.222'];

export const useMultiTraceStore = create<MultiTraceStoreState>((set, get) => ({
  targets: DEFAULT_TARGETS,
  maxHops: 30,
  timeoutMs: 1000,
  isRunning: false,
  targetResults: {},
  selectedTarget: DEFAULT_TARGETS[0],
  historicalPaths: {},
  totalDeviations: 0,
  activeSessionId: null,

  addTarget: (target) => {
    const trimmed = target.trim();
    if (!trimmed) return;
    set((state) => {
      if (state.targets.includes(trimmed) || state.targets.length >= 8) {
        return state;
      }
      return {
        targets: [...state.targets, trimmed],
        selectedTarget: state.selectedTarget || trimmed,
      };
    });
  },

  removeTarget: (target) => {
    set((state) => {
      const filtered = state.targets.filter((t) => t !== target);
      return {
        targets: filtered,
        selectedTarget: state.selectedTarget === target ? (filtered[0] || '') : state.selectedTarget,
      };
    });
  },

  setTargets: (targets) => {
    const valid = targets.slice(0, 8);
    set({ targets: valid, selectedTarget: valid[0] || '' });
  },

  setMaxHops: (maxHops) => set({ maxHops: Math.min(64, Math.max(1, maxHops)) }),
  setTimeoutMs: (timeoutMs) => set({ timeoutMs: Math.min(5000, Math.max(200, timeoutMs)) }),
  setSelectedTarget: (selectedTarget) => set({ selectedTarget }),

  startMultiTrace: async () => {
    const { targets, maxHops, timeoutMs } = get();
    if (targets.length === 0) return;

    set({ isRunning: true, targetResults: {}, totalDeviations: 0 });

    try {
      const res = await api.runMultiTrace({
        targets,
        maxHops,
        timeoutMs,
      });

      if (res.success && res.data) {
        const resultMap: Record<string, TargetTraceProgress> = {};
        for (const prog of res.data.targets) {
          resultMap[prog.target] = prog;
        }

        set({
          isRunning: false,
          targetResults: resultMap,
          totalDeviations: res.data.totalDeviations,
          activeSessionId: res.data.sessionId,
        });
      } else {
        set({ isRunning: false });
      }
    } catch (err) {
      console.error('Failed to run multitrace:', err);
      set({ isRunning: false });
    }
  },

  fetchHistoricalPaths: async (target) => {
    try {
      const res = await api.getHistoricalPaths(target);
      if (res.success && res.data) {
        set((state) => ({
          historicalPaths: {
            ...state.historicalPaths,
            [target]: res.data || [],
          },
        }));
      }
    } catch (err) {
      console.error('Failed to fetch historical paths for', target, err);
    }
  },

  subscribeEvents: () => {
    const unlistenProgress = api.onMultiTraceProgress((progress: TargetTraceProgress) => {
      set((state) => ({
        targetResults: {
          ...state.targetResults,
          [progress.target]: progress,
        },
      }));
    });

    const unlistenCompleted = api.onMultiTraceCompleted((result: MultiTraceResult) => {
      const resultMap: Record<string, TargetTraceProgress> = {};
      for (const prog of result.targets) {
        resultMap[prog.target] = prog;
      }
      set({
        isRunning: false,
        targetResults: resultMap,
        totalDeviations: result.totalDeviations,
        activeSessionId: result.sessionId,
      });
    });

    return () => {
      unlistenProgress();
      unlistenCompleted();
    };
  },

  clearResults: () => set({ targetResults: {}, totalDeviations: 0, activeSessionId: null }),
}));
