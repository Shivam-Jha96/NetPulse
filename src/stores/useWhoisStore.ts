import { create } from 'zustand';
import { RdapRecord } from '../types';

export interface WhoisStoreState {
  query: string;
  isLoading: boolean;
  result: RdapRecord | null;
  error: string | null;

  setQuery: (query: string) => void;
  setResult: (result: RdapRecord) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useWhoisStore = create<WhoisStoreState>((set) => ({
  query: 'cloudflare.com',
  isLoading: false,
  result: null,
  error: null,

  setQuery: (query) => set({ query }),
  setResult: (result) => set({ result, isLoading: false, error: null }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () => set({ result: null, error: null, isLoading: false }),
}));
