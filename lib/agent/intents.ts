export type AgentIntent = "query" | "report" | "action";

const REPORT_KEYWORDS = ["生成", "周报", "简报", "月报", "报告", "汇报"];
const ACTION_KEYWORDS = [
  "创建任务",
  "建任务",
  "派任务",
  "分派",
  "分配",
  "安排走访",
  "去走访",
  "排走访",
];

export interface IntentHint {
  intent: AgentIntent;
  reportKey?: "weekly_discovery" | "task_execution";
}

export function detectIntent(question: string, qid?: string): IntentHint {
  const q = question.trim();

  if (qid === "report:weekly_discovery") return { intent: "report", reportKey: "weekly_discovery" };
  if (qid === "report:task_execution") return { intent: "report", reportKey: "task_execution" };

  const isReport = REPORT_KEYWORDS.some((k) => q.includes(k));
  if (isReport) {
    if (q.includes("任务")) return { intent: "report", reportKey: "task_execution" };
    return { intent: "report", reportKey: "weekly_discovery" };
  }

  if (ACTION_KEYWORDS.some((k) => q.includes(k))) {
    return { intent: "action" };
  }

  return { intent: "query" };
}

export function isCandidateListQuestion(qid?: string): boolean {
  return qid === "q11" || qid === "q1" || qid === "q12";
}
