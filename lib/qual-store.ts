"use client";

import { create } from "zustand";
import type { QualificationType } from "./types";

interface QualStore {
  activeQual: QualificationType;
  enabledModules: QualificationType[];
  setActiveQual: (q: QualificationType) => void;
  initModules: (modules: QualificationType[]) => void;
}

const LS_KEY = "active_qual_type";

export const useQualStore = create<QualStore>((set) => ({
  activeQual: "high_tech",
  enabledModules: ["high_tech"],

  setActiveQual: (q) => {
    set({ activeQual: q });
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, q);
    }
  },

  initModules: (modules) => {
    const stored =
      typeof window !== "undefined"
        ? (localStorage.getItem(LS_KEY) as QualificationType | null)
        : null;
    const active =
      stored && modules.includes(stored) ? stored : (modules[0] ?? "high_tech");
    set({ enabledModules: modules, activeQual: active });
  },
}));
