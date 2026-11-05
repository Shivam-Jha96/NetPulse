import { create } from 'zustand';
import { DnsRecord, DnssecValidation, ResolverCheckResult, DNSInspectionResult } from '../types';

export interface DnsStoreState {
  domain: string;
  recordType: string;
  transport: 'UDP_TCP' | 'DOH' | 'DOT';
  isLoading: boolean;
  records: DnsRecord[];
  dnssec: DnssecValidation | null;
  propagation: ResolverCheckResult[];
  propagationPercent: number;
  responseTimeMs: number;
  error: string | null;

  setDomain: (domain: string) => void;
  setRecordType: (recordType: string) => void;
  setTransport: (transport: 'UDP_TCP' | 'DOH' | 'DOT') => void;
  setResults: (res: DNSInspectionResult) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useDnsStore = create<DnsStoreState>((set) => ({
  domain: 'cloudflare.com',
  recordType: 'A',
  transport: 'UDP_TCP',
  isLoading: false,
  records: [],
  dnssec: null,
  propagation: [],
  propagationPercent: 0,
  responseTimeMs: 0,
  error: null,

  setDomain: (domain) => set({ domain }),
  setRecordType: (recordType) => set({ recordType }),
  setTransport: (transport) => set({ transport }),
  setResults: (res) =>
    set({
      records: res.records,
      dnssec: res.dnssecStatus,
      propagation: res.propagation.resolverResults,
      propagationPercent: res.propagation.propagationPercentage,
      responseTimeMs: res.responseTimeMs,
      isLoading: false,
      error: null,
    }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error, isLoading: false }),
  reset: () =>
    set({
      records: [],
      dnssec: null,
      propagation: [],
      propagationPercent: 0,
      responseTimeMs: 0,
      error: null,
    }),
}));
