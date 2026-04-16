import type { Tier } from "./types";

export interface TierConfig {
  label: string;
  desc: string;
  color: string; // tailwind text color
  bg: string;    // tailwind bg color
  border: string;
  min: number;
  max: number;
}

export const TIER_CONFIG: Record<Tier, TierConfig> = {
  A: {
    label: "A 类",
    desc: "可立即申报",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    min: 80,
    max: 100,
  },
  B: {
    label: "B 类",
    desc: "缺 1-2 项",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    min: 60,
    max: 79,
  },
  C: {
    label: "C 类",
    desc: "中远期培育",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    min: 40,
    max: 59,
  },
  D: {
    label: "D 类",
    desc: "暂不推荐",
    color: "text-slate-500",
    bg: "bg-slate-50",
    border: "border-slate-200",
    min: 0,
    max: 39,
  },
};

export function getTierConfig(tier: Tier): TierConfig {
  return TIER_CONFIG[tier];
}

export function scoreToTier(score: number): Tier {
  if (score >= 80) return "A";
  if (score >= 60) return "B";
  if (score >= 40) return "C";
  return "D";
}
