import type { Task, VisitRecord, WillingnessLevel } from "@/lib/types";

export type LifecycleStage = "pool" | "dispatched" | "investigating" | "done";

export const LIFECYCLE_META: Record<
  LifecycleStage,
  { label: string; dot: string; ribbon: string; bg: string; text: string; ring: string }
> = {
  pool: {
    label: "标的池",
    dot: "bg-slate-400",
    ribbon: "from-slate-300 to-slate-400",
    bg: "bg-slate-50",
    text: "text-slate-700",
    ring: "ring-slate-300",
  },
  dispatched: {
    label: "已派发 · 待摸排",
    dot: "bg-blue-500",
    ribbon: "from-blue-400 to-blue-500",
    bg: "bg-blue-50",
    text: "text-blue-700",
    ring: "ring-blue-400",
  },
  investigating: {
    label: "摸排中",
    dot: "bg-purple-500",
    ribbon: "from-purple-400 to-purple-500",
    bg: "bg-purple-50",
    text: "text-purple-700",
    ring: "ring-purple-400",
  },
  done: {
    label: "已完成",
    dot: "bg-emerald-500",
    ribbon: "from-emerald-400 to-emerald-500",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    ring: "ring-emerald-400",
  },
};

export const LIFECYCLE_ORDER: LifecycleStage[] = ["pool", "dispatched", "investigating", "done"];

export function latestVisitRecord(records: VisitRecord[]): VisitRecord | undefined {
  if (records.length === 0) return undefined;
  return [...records].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))[0];
}

export function getTaskLifecycleStage(
  task: Task,
  records: VisitRecord[],
  hasDraft: boolean,
): Exclude<LifecycleStage, "pool"> {
  if (records.length > 0) {
    if (task.status === "in_progress") return "investigating";
    return "done";
  }
  if (task.status === "in_progress" || hasDraft) return "investigating";
  return "dispatched";
}

// ─── 显示用映射（与 mobile 端共享，避免分叉）────────────────────

export const WILLINGNESS_META: Record<
  WillingnessLevel,
  { label: string; badge: string; dot: string }
> = {
  strong:      { label: "意愿强烈",   badge: "text-emerald-700 bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
  moderate:    { label: "有一定意愿", badge: "text-blue-700 bg-blue-50 border-blue-200",          dot: "bg-blue-500" },
  hesitant:    { label: "态度观望",   badge: "text-amber-700 bg-amber-50 border-amber-200",       dot: "bg-amber-500" },
  refused:     { label: "明确拒绝",   badge: "text-red-700 bg-red-50 border-red-200",             dot: "bg-red-500" },
  unreachable: { label: "无法联系",   badge: "text-gray-600 bg-gray-100 border-gray-200",         dot: "bg-gray-400" },
};

// 注：VisitMethod 当前类型是 "in_person" | "online"，但 mobile preview 的旧映射含
// "phone"/"online_meeting"，可能存在 localStorage 中。这里保留所有键以容错。
export const METHOD_MAP: Record<string, string> = {
  in_person: "🏢 上门拜访",
  online: "💻 线上沟通",
  phone: "📞 电话沟通",
  online_meeting: "💻 视频会议",
};

export const REVENUE_MAP: Record<string, string> = {
  under_500w: "500万以下",
  "500w_2000w": "500-2000万",
  "2000w_1yi": "2000万-1亿",
  above_1yi: "1亿以上",
};

export const RD_RATIO_MAP: Record<string, string> = {
  under_3pct: "<3%",
  "3_5pct": "3-5%",
  "5_10pct": "5-10%",
  above_10pct: ">10%",
};

export const RD_SOURCE_MAP: Record<string, string> = {
  self_invested: "企业自投",
  government_grant: "政府补贴",
  both: "两者均有",
  none: "几乎无研发投入",
};

// 同时兼容布尔与字符串（mobile 表单里以 "true"/"false" 字符串保存）
export function bool3Map(v: boolean | null | undefined | string): string {
  if (v === true || v === "true") return "是";
  if (v === false || v === "false") return "否";
  return "不清楚";
}
