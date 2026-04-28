import { getAllCompanies } from "@/lib/mock-data";
import HiEvalClient from "./HiEvalClient";

export default function HiEvalPage() {
  const companies = getAllCompanies();
  return <HiEvalClient companies={companies} />;
}
