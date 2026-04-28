import { getAllCompanies, getAllTasks } from "@/lib/mock-data";
import SurveyStatsClient from "./SurveyStatsClient";

export default function SurveysPage() {
  const companies = getAllCompanies();
  const tasks = getAllTasks();
  return <SurveyStatsClient companies={companies} tasks={tasks} />;
}
