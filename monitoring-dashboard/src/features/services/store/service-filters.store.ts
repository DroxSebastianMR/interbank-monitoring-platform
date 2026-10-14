import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface ServiceFiltersState {
  search: string;
  status: string;
  setSearch(search: string): void;
  setStatus(status: string): void;
}

export const useServiceFiltersStore = create<ServiceFiltersState>()(
  persist(
    (set) => ({
      search: '',
      status: 'ALL',
      setSearch: (search) => set({ search }),
      setStatus: (status) => set({ status }),
    }),
    {
      name: 'interbank-monitor.service-filters',
      partialize: ({ search, status }) => ({ search, status }),
    },
  ),
);
