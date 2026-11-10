import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ServiceFiltersState {
  search: string;
  status: string;
  criticality: string;
  latency: string;
  setSearch(search: string): void;
  setStatus(status: string): void;
  setCriticality(criticality: string): void;
  setLatency(latency: string): void;
  reset(): void;
}

export const useServiceFiltersStore = create<ServiceFiltersState>()(
  persist(
    (set) => ({
      search: '',
      status: 'ALL',
      criticality: 'ALL',
      latency: 'ALL',
      setSearch: (search) => set({ search }),
      setStatus: (status) => set({ status }),
      setCriticality: (criticality) => set({ criticality }),
      setLatency: (latency) => set({ latency }),
      reset: () => set({ search: '', status: 'ALL', criticality: 'ALL', latency: 'ALL' }),
    }),
    {
      name: 'interbank-monitor.service-filters',
      partialize: ({ search, status, criticality, latency }) => ({
        search,
        status,
        criticality,
        latency,
      }),
    },
  ),
);
