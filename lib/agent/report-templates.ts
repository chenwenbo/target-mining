import { getPotentialTargets, getAllTasks, getDashboardKPI } from "../mock-data";

export type ReportKey = "weekly_discovery" | "task_execution";

export interface AgentReport {
  key: ReportKey;
  title: string;
  filename: string;
  markdown: string;
}

export function generateReport(key: ReportKey): AgentReport {
  if (key === "task_execution") return buildTaskExecutionReport();
  return buildWeeklyDiscoveryReport();
}

function todayLabel(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function buildWeeklyDiscoveryReport(): AgentReport {
  const targets = getPotentialTargets();
  const kpi = getDashboardKPI();

  const fieldRows = Object.entries(kpi.byField)
    .sort((a, b) => b[1] - a[1])
    .map(([f, n], i) => `${i + 1}. **${f}** — ${n} 家`)
    .join("\n");

  const streetRows = Object.entries(kpi.byStreet)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([s, n], i) => `${i + 1}. ${s} — ${n} 家`)
    .join("\n");

  const strong = targets.filter((c) => c.declarationWillingness === "strong").length;
  const moderate = targets.filter((c) => c.declarationWillingness === "moderate").length;
  const unknown = targets.filter((c) => c.declarationWillingness === "unknown").length;

  const markdown = `# 高企发现周报 — ${todayLabel()}

## 一、本周标的池概况

- 标的池累计：**${targets.length}** 家潜在申报企业
- 申报意愿强烈：**${strong}** 家（可启动辅导）
- 基本意愿：**${moderate}** 家（建议跟进）
- 未接触：**${unknown}** 家（需排查）

## 二、技术领域分布

${fieldRows}

## 三、街道 / 园区 TOP 5

${streetRows}

## 四、年度申报进度

- 年度目标：**${kpi.yearGoal}** 家
- 已认定：**${kpi.certified}** 家
- 完成率：**${Math.round((kpi.certified / kpi.yearGoal) * 100)}%**
- 预测全年完成：**${kpi.estimatedCompletion}** 家

## 五、下周建议

1. 优先走访 **未接触高潜力企业**（${unknown} 家）
2. 跟进 **意愿强烈** 企业的辅导排期
3. 关注电子信息和先进制造与自动化两大主赛道
`;

  return {
    key: "weekly_discovery",
    title: "本月高企发现周报",
    filename: `weekly-discovery-${todayLabel()}.md`,
    markdown,
  };
}

function buildTaskExecutionReport(): AgentReport {
  const tasks = getAllTasks();
  const done = tasks.filter((t) => t.status === "done").length;
  const inProgress = tasks.filter((t) => t.status === "in_progress").length;
  const pending = tasks.filter((t) => t.status === "pending").length;
  const today = new Date().toISOString().slice(0, 10);
  const overdue = tasks.filter((t) => t.status !== "done" && t.deadline < today);

  const byAssignee = new Map<string, { total: number; done: number }>();
  for (const t of tasks) {
    const cur = byAssignee.get(t.assignee) ?? { total: 0, done: 0 };
    cur.total += 1;
    if (t.status === "done") cur.done += 1;
    byAssignee.set(t.assignee, cur);
  }
  const assigneeRows = [...byAssignee.entries()]
    .sort((a, b) => b[1].done - a[1].done)
    .map(
      ([name, s], i) =>
        `${i + 1}. **${name}** — 完成 ${s.done} / ${s.total}（${Math.round((s.done / s.total) * 100)}%）`,
    )
    .join("\n");

  const overdueRows = overdue
    .slice(0, 10)
    .map(
      (t, i) =>
        `${i + 1}. ${t.companyName} · ${t.assignee} · 截止 ${t.deadline} · ${t.notes || "—"}`,
    )
    .join("\n");

  const markdown = `# 任务执行简报 — ${todayLabel()}

## 一、整体进度

- 任务总数：**${tasks.length}** 条
- ✅ 已完成：**${done}** 条（${Math.round((done / tasks.length) * 100)}%）
- 🔄 进行中：**${inProgress}** 条
- ⏳ 待启动：**${pending}** 条
- 🔴 已超期：**${overdue.length}** 条

## 二、各负责人产出

${assigneeRows || "暂无数据"}

## 三、超期任务清单（最多 10 条）

${overdueRows || "无超期任务"}

## 四、建议

1. 优先解决 **已超期** 任务，避免影响整体进度
2. 关注产出最低负责人的资源支持
3. 周内确保至少完成 **${Math.max(0, Math.ceil(tasks.length * 0.7) - done)}** 条任务以达到 70% 完成率
`;

  return {
    key: "task_execution",
    title: "任务执行简报",
    filename: `task-execution-${todayLabel()}.md`,
    markdown,
  };
}
