import type { CertifiedCompany } from "./types";
import { getRenewalStatus } from "./renewal";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawCompanies: CertifiedCompany[] = require("../mock/companies.json");

const CURRENT_USER_KEY = "pc_current_user";

function readScope(): { city: string; district: string } | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CURRENT_USER_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw) as { city?: string; district?: string };
    if (u.city && u.district) return { city: u.city, district: u.district };
    return null;
  } catch {
    return null;
  }
}

export function getCertifiedCompanies(): (CertifiedCompany & { renewalStatus: ReturnType<typeof getRenewalStatus> })[] {
  const scope = readScope();
  return rawCompanies
    .filter((c) => c.alreadyCertified && c.certifiedYear !== undefined)
    .filter((c) => !scope || (c.city === scope.city && c.district === scope.district))
    .map((c) => ({ ...c, renewalStatus: getRenewalStatus(c) }));
}

export function getCertifiedCompanyById(id: string): (CertifiedCompany & { renewalStatus: ReturnType<typeof getRenewalStatus> }) | undefined {
  return getCertifiedCompanies().find((c) => c.id === id);
}
