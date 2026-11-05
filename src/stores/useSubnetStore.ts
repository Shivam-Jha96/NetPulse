import { create } from 'zustand';
import { api } from '../api/ipc';
import { SubnetCalculationResult, VlsmSubnetAllocation } from '../types';

interface SubnetStoreState {
  cidr: string;
  details: SubnetCalculationResult | null;
  vlsmRequests: Array<{ id: string; name: string; hosts: number }>;
  vlsmAllocations: VlsmSubnetAllocation[];
  error: string | null;

  setCidr: (cidr: string) => void;
  calculate: (cidr?: string) => Promise<void>;
  addVlsmRequest: (name: string, hosts: number) => void;
  removeVlsmRequest: (id: string) => void;
  clearVlsmRequests: () => void;
}

export const useSubnetStore = create<SubnetStoreState>((set, get) => ({
  cidr: '192.168.10.0/24',
  details: null,
  vlsmRequests: [
    { id: '1', name: 'VLAN 10 Engineering', hosts: 50 },
    { id: '2', name: 'VLAN 20 Sales', hosts: 25 },
  ],
  vlsmAllocations: [],
  error: null,

  setCidr: (cidr) => set({ cidr }),

  calculate: async (overrideCidr) => {
    const cidr = overrideCidr || get().cidr;
    const reqs = get().vlsmRequests.map((r) => [r.name, r.hosts] as [string, number]);

    const res = await api.calculateSubnet(cidr, reqs);
    if (res.success && res.data) {
      set({
        details: res.data,
        vlsmAllocations: res.data.vlsmSubnets || [],
        error: null,
      });
    } else if (res.error) {
      set({ error: res.error.message });
    }
  },

  addVlsmRequest: (name, hosts) => {
    set((state) => ({
      vlsmRequests: [
        ...state.vlsmRequests,
        { id: crypto.randomUUID(), name, hosts },
      ],
    }));
    get().calculate();
  },

  removeVlsmRequest: (id) => {
    set((state) => ({
      vlsmRequests: state.vlsmRequests.filter((r) => r.id !== id),
    }));
    get().calculate();
  },

  clearVlsmRequests: () => {
    set({ vlsmRequests: [], vlsmAllocations: [] });
    get().calculate();
  },
}));
