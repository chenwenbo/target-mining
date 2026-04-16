import type { Company, Task } from "./types";
import { scoreCompany, scoreAll } from "./scoring";
import { DEFAULT_WEIGHTS } from "./types";

// ─── Raw data (imported at module load) ────────────────────────
// We use require() so this works in both server and client contexts.
// Vercel/Next.js will bundle the JSON at build time.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawCompanies: Company[] = require("../mock/companies.json");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawTasks: Task[] = require("../mock/tasks.json");

// ─── Public accessors ───────────────────────────────────────────

export function getAllCompanies(): Company[] {
  return rawCompanies;
}

export function getPotentialTargets(): Company[] {
  return rawCompanies.filter((c) => !c.alreadyCertified);
}

export function getCertifiedBenchmarks(): Company[] {
  return rawCompanies.filter((c) => c.alreadyCertified);
}

export function getCompanyById(id: string): Company | undefined {
  return rawCompanies.find((c) => c.id === id);
}

export function getScoredTargets(weights = DEFAULT_WEIGHTS) {
  return scoreAll(getPotentialTargets(), weights);
}

export function getScoredById(id: string, weights = DEFAULT_WEIGHTS) {
  const c = getCompanyById(id);
  if (!c) return undefined;
  return { ...c, score: scoreCompany(c, weights) };
}

export function getAllTasks(): Task[] {
  return rawTasks;
}

// ─── KPI helpers ────────────────────────────────────────────────

export function getDashboardKPI(weights = DEFAULT_WEIGHTS) {
  const scored = getScoredTargets(weights);
  const byTier = { A: 0, B: 0, C: 0, D: 0 };
  for (const c of scored) byTier[c.score.tier]++;

  const byStreet: Record<string, number> = {};
  for (const c of scored) {
    byStreet[c.street] = (byStreet[c.street] || 0) + 1;
  }

  const byField: Record<string, number> = {};
  for (const c of scored) {
    if (c.techField) byField[c.techField] = (byField[c.techField] || 0) + 1;
  }

  const byAge: Record<string, number> = {
    "1-3 年": 0,
    "3-5 年": 0,
    "5-8 年": 0,
    "8-15 年": 0,
    "15 年+": 0,
  };
  const now = new Date("2026-01-01").getTime();
  for (const c of scored) {
    const years = (now - new Date(c.establishedAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years < 3) byAge["1-3 年"]++;
    else if (years < 5) byAge["3-5 年"]++;
    else if (years < 8) byAge["5-8 年"]++;
    else if (years < 15) byAge["8-15 年"]++;
    else byAge["15 年+"]++;
  }

  const top10 = [...scored]
    .sort((a, b) => b.score.total - a.score.total)
    .slice(0, 10);

  return {
    yearGoal: 120,
    certified: 58,
    total: scored.length,
    estimatedCompletion: 138,
    byTier,
    byStreet,
    byField,
    byAge,
    top10,
  };
}
