import rawCompanies from "../mock/companies.json";
import { STREETS } from "./types";

interface RawCompany {
  id: string;
  name: string;
  street: string;
  industry: string;
  techField: string | null;
  employees: number;
  rdEmployees: number;
  patents: { invention: number; utility: number; design: number };
  software: number;
  alreadyCertified: boolean;
}

export interface PreviewCompany {
  name: string;
  industry: string;
}

export interface StreetStats {
  total: number;         // 企业总数
  techCount: number;     // 泛科技企业
  highPotential: number; // 高潜力企业
  preview: PreviewCompany[];
  blurredCount: number;
}

function isTech(c: RawCompany): boolean {
  return c.techField !== null;
}

function isHighPotential(c: RawCompany): boolean {
  const totalPatents = c.patents.invention + c.patents.utility + c.patents.design + c.software;
  return isTech(c) && (totalPatents > 0 || c.employees >= 30 || c.rdEmployees >= 10);
}

function scoreCompany(c: RawCompany): number {
  return Math.min(100, c.patents.invention * 10 + c.patents.utility * 3 + c.software * 2 + Math.floor(c.employees / 10));
}

export function getStreetStats(street: string): StreetStats {
  const all = (rawCompanies as RawCompany[]).filter((c) => c.street === street);
  const techCompanies = all.filter(isTech);
  const highPotentialCompanies = all.filter(isHighPotential);

  const scored = highPotentialCompanies
    .map((c) => ({ c, score: scoreCompany(c) }))
    .sort((a, b) => b.score - a.score);

  const preview: PreviewCompany[] = scored.slice(0, 3).map(({ c }) => ({
    name: c.name,
    industry: c.industry,
  }));

  return {
    total: all.length,
    techCount: techCompanies.length,
    highPotential: highPotentialCompanies.length,
    preview,
    blurredCount: Math.max(0, highPotentialCompanies.length - 3),
  };
}

export function getStreets(): string[] {
  return [...STREETS];
}
