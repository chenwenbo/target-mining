import type { Task } from "../types";
import { getCompanyById } from "../mock-data";
import { addCustomTask } from "../mobile-mock";

export type AgentActionKind = "create_tasks";

export interface AgentAction {
  id: string;
  label: string;
  kind: AgentActionKind;
  payload: { companyIds: string[]; assignee?: string; deadline?: string };
  confirm: { title: string; affected: string[]; warning?: string };
}

function todayPlus(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export interface ActionResult {
  ok: true;
  summary: string;
  navigateTo?: string;
}

export async function executeAction(action: AgentAction): Promise<ActionResult> {
  await new Promise((r) => setTimeout(r, 400));
  if (action.kind === "create_tasks") {
    let count = 0;
    for (const [idx, id] of action.payload.companyIds.entries()) {
      const c = getCompanyById(id);
      if (!c) continue;
      const task: Task = {
        id: `agt_${Date.now()}_${idx}`,
        companyId: c.id,
        companyName: c.name,
        assignee: action.payload.assignee ?? "待分派",
        street: c.street,
        status: "pending",
        createdAt: new Date().toISOString().slice(0, 10),
        deadline: action.payload.deadline ?? todayPlus(14),
        notes: "智能体推荐 · 走访摸排",
      };
      addCustomTask(task);
      count += 1;
    }
    return {
      ok: true,
      summary: `已创建 ${count} 条走访任务`,
      navigateTo: "/tasks",
    };
  }
  return { ok: true, summary: "操作完成" };
}

export function buildCreateTasksAction(companyIds: string[], affected: string[]): AgentAction {
  return {
    id: `act_${Date.now()}`,
    label: `为这 ${companyIds.length} 家创建走访任务`,
    kind: "create_tasks",
    payload: { companyIds },
    confirm: {
      title: `确认为以下 ${companyIds.length} 家企业创建走访任务？`,
      affected,
      warning: "任务将以「待分派」状态进入任务管理。后续可在任务列表手动分配负责人。",
    },
  };
}
