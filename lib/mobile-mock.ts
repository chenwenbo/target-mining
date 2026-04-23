import type { Visitor, VisitRecord, TaskStatus } from "./types";

// ─── Mock 走访人员（与 tasks.json 的 assignee 字段对应）──────────
export const MOCK_VISITORS: Visitor[] = [
  { id: "v1", name: "王科员", role: "street_officer", street: "国家网安基地", dept: "国家网安基地管委会" },
  { id: "v2", name: "李科员", role: "tech_officer",   street: null,         dept: "科创局·高新处" },
  { id: "v3", name: "张科员", role: "street_officer", street: "金银湖街道",  dept: "金银湖街道办事处" },
  { id: "v4", name: "赵科员", role: "street_officer", street: "将军路街道",  dept: "将军路街道办事处" },
];

// ─── SessionStorage：当前用户 ────────────────────────────────────
const VISITOR_KEY = "current_visitor";

export function getCurrentVisitor(): Visitor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(VISITOR_KEY);
    return raw ? (JSON.parse(raw) as Visitor) : null;
  } catch {
    return null;
  }
}

export function setCurrentVisitor(visitor: Visitor): void {
  sessionStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
}

export function clearCurrentVisitor(): void {
  sessionStorage.removeItem(VISITOR_KEY);
}

// ─── LocalStorage：走访记录 ──────────────────────────────────────
const RECORDS_KEY = "visit_records";

export function getVisitRecords(): VisitRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? (JSON.parse(raw) as VisitRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveVisitRecord(record: VisitRecord): void {
  const existing = getVisitRecords();
  const idx = existing.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    existing[idx] = record;
  } else {
    existing.push(record);
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(existing));
}

export function getVisitRecordsByTask(taskId: string): VisitRecord[] {
  return getVisitRecords().filter((r) => r.taskId === taskId);
}

// ─── LocalStorage：任务状态覆盖（模拟状态同步）────────────────────
const TASK_STATUS_KEY = "task_status_overrides";

type StatusOverrides = Record<string, TaskStatus>;

export function getTaskStatusOverrides(): StatusOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TASK_STATUS_KEY);
    return raw ? (JSON.parse(raw) as StatusOverrides) : {};
  } catch {
    return {};
  }
}

export function setTaskStatus(taskId: string, status: TaskStatus): void {
  const overrides = getTaskStatusOverrides();
  overrides[taskId] = status;
  localStorage.setItem(TASK_STATUS_KEY, JSON.stringify(overrides));
}

// ─── 走访记录草稿 ────────────────────────────────────────────────
const DRAFT_KEY_PREFIX = "visit_draft_";

export function saveDraft(taskId: string, data: Partial<VisitRecord>): void {
  localStorage.setItem(DRAFT_KEY_PREFIX + taskId, JSON.stringify(data));
}

export function getDraft(taskId: string): Partial<VisitRecord> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + taskId);
    return raw ? (JSON.parse(raw) as Partial<VisitRecord>) : null;
  } catch {
    return null;
  }
}

export function clearDraft(taskId: string): void {
  localStorage.removeItem(DRAFT_KEY_PREFIX + taskId);
}
