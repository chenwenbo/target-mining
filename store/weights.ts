"use client";
import { create } from "zustand";
import type { Weights } from "@/lib/types";
import { DEFAULT_WEIGHTS } from "@/lib/types";

interface WeightsStore {
  weights: Weights;
  setWeight: (key: keyof Weights, value: number) => void;
  resetWeights: () => void;
}

export const useWeightsStore = create<WeightsStore>((set) => ({
  weights: DEFAULT_WEIGHTS,
  setWeight: (key, value) =>
    set((state) => ({
      weights: { ...state.weights, [key]: value },
    })),
  resetWeights: () => set({ weights: DEFAULT_WEIGHTS }),
}));
