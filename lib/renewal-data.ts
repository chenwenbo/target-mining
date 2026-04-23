import type { CertifiedCompany, RenewalTask } from "./types";
import { getRenewalStatus } from "./renewal";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawCompanies: CertifiedCompany[] = require("../mock/companies.json");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawRenewalTasks: RenewalTask[] = require("../mock/renewal-tasks.json");

export function getCertifiedCompanies(): (CertifiedCompany & { renewalStatus: ReturnType<typeof getRenewalStatus> })[] {
  return rawCompanies
    .filter((c) => c.alreadyCertified && c.certifiedYear !== undefined)
    .map((c) => ({ ...c, renewalStatus: getRenewalStatus(c) }));
}

export function getCertifiedCompanyById(id: string): (CertifiedCompany & { renewalStatus: ReturnType<typeof getRenewalStatus> }) | undefined {
  return getCertifiedCompanies().find((c) => c.id === id);
}

export function getAllRenewalTasks(): RenewalTask[] {
  return rawRenewalTasks;
}
