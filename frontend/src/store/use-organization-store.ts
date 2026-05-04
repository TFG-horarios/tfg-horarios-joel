import { create } from 'zustand';

type OrganizationState = {
  selectedOrganizationId: string | null;
  selectOrganization: (id: string) => void;
  clearSelection: () => void;
};

export const useOrganizationStore = create<OrganizationState>()((set) => ({
  selectedOrganizationId: null,
  selectOrganization: (id) => set({ selectedOrganizationId: id }),
  clearSelection: () => set({ selectedOrganizationId: null }),
}));
