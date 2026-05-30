'use client';

import { create } from 'zustand';

type OrganizationState = {
  selectedOrganizationId: string | null;
  searchQuery: string;
};

type OrganizationActions = {
  selectOrganization: (id: string) => void;
  clearSelection: () => void;
  setSearchQuery: (q: string) => void;
};

export type OrganizationStore = OrganizationState & OrganizationActions;

export const useOrganizationStore = create<OrganizationStore>()((set) => ({
  selectedOrganizationId: null,
  searchQuery: '',
  selectOrganization: (id) => set({ selectedOrganizationId: id }),
  clearSelection: () => set({ selectedOrganizationId: null }),
  setSearchQuery: (q) => set({ searchQuery: q }),
}));

export const useOrganizationActions = () =>
  useOrganizationStore((state) => ({
    selectOrganization: state.selectOrganization,
    clearSelection: state.clearSelection,
    setSearchQuery: state.setSearchQuery,
  }));
