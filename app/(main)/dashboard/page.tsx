import { getDashboardKPI } from "@/lib/mock-data";
import DashboardClient from "./DashboardClient";

export default function DashboardPage() {
  const kpi = getDashboardKPI();
  return <DashboardClient kpi={kpi} />;
}
