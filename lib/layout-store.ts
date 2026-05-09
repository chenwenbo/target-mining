"use client";
import { create } from "zustand";

interface LayoutStore {
  sidebarCollapsed: boolean;
  agentPanelOpen: boolean;
  toggleSidebar: () => void;
  openAgentPanel: () => void;
  closeAgentPanel: () => void;
  toggleAgentPanel: () => void;
}

export const useLayoutStore = create<LayoutStore>((set) => ({
  sidebarCollapsed: false,
  agentPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  openAgentPanel: () => set({ agentPanelOpen: true, sidebarCollapsed: true }),
  closeAgentPanel: () => set({ agentPanelOpen: false, sidebarCollapsed: false }),
  toggleAgentPanel: () =>
    set((s) =>
      s.agentPanelOpen
        ? { agentPanelOpen: false, sidebarCollapsed: false }
        : { agentPanelOpen: true, sidebarCollapsed: true }
    ),
}));
