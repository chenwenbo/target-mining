import { getRenewalKPI } from "@/lib/renewal";
import { getCertifiedCompanies } from "@/lib/renewal-data";
import RenewalClient from "./RenewalClient";

export default function RenewalPage() {
  const companies = getCertifiedCompanies();
  const kpi = getRenewalKPI(companies);
  return <RenewalClient kpi={kpi} />;
}
