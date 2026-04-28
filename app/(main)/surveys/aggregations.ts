import type {
  Company,
  Task,
  TaskStatus,
  VisitMethod,
  VisitRecord,
  WillingnessLevel,
} from "@/lib/types";

// ─── 元数据 ───────────────────────────────────────────────────
export const WILLINGNESS_META: Record<WillingnessLevel, { label: string; color: string }> = {
  strong:      { label: "意愿强烈",   color: "#10b981" },
  moderate:    { label: "有一定意愿", color: "#3b82f6" },
  hesitant:    { label: "态度观望",   color: "#f59e0b" },
  refused:     { label: "明确拒绝",   color: "#ef4444" },
  unreachable: { label: "无法联系",   color: "#94a3b8" },
};

export const WILLINGNESS_ORDER: WillingnessLevel[] = [
  "strong", "moderate", "hesitant", "refused", "unreachable",
];

export const VISIT_METHOD_META: Record<VisitMethod, { label: string; color: string }> = {
  in_person:      { label: "上门走访", color: "#2563eb" },
  phone:          { label: "电话沟通", color: "#0891b2" },
  online_meeting: { label: "线上会议", color: "#7c3aed" },
};

// ─── 输入聚合参数 ─────────────────────────────────────────────
export interface AggInputs {
  records: VisitRecord[];
  companies: Company[];
  tasks: Task[];
  taskStatusOverrides: Record<string, TaskStatus>;
}

// ─── KPI ─────────────────────────────────────────────────────
export interface SurveyKPI {
  totalVisits: number;
  visitedCompanies: number;
  totalTasks: number;
  doneTasks: number;
  coverageRate: number;
  willingCount: number;
  avgDurationMin: number | null;
  coveredStreets: number;
}

export function computeKPI({ records, companies, tasks, taskStatusOverrides }: AggInputs): SurveyKPI {
  const visitedCompanies = new Set(records.map((r) => r.companyId)).size;
  const totalVisits = records.length;
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(
    (t) => (taskStatusOverrides[t.id] ?? t.status) === "done"
  ).length;
  const coverageRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const willingCompanies = new Set(
    records
      .filter((r) => r.willingness === "strong" || r.willingness === "moderate")
      .map((r) => r.companyId)
  );

  const durations = records
    .map((r) => r.visitDurationMinutes)
    .filter((v): v is number => typeof v === "number" && v > 0);
  const avgDurationMin =
    durations.length > 0
      ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length)
      : null;

  const companyById = new Map(companies.map((c) => [c.id, c]));
  const streets = new Set<string>();
  for (const r of records) {
    const c = companyById.get(r.companyId);
    if (c) streets.add(c.street);
  }

  return {
    totalVisits,
    visitedCompanies,
    totalTasks,
    doneTasks,
    coverageRate,
    willingCount: willingCompanies.size,
    avgDurationMin,
    coveredStreets: streets.size,
  };
}

// ─── 意愿分布 ─────────────────────────────────────────────────
export interface WillingnessSlice {
  key: WillingnessLevel;
  name: string;
  value: number;
  color: string;
}

export function computeWillingnessDist(records: VisitRecord[]): WillingnessSlice[] {
  const counts: Record<WillingnessLevel, number> = {
    strong: 0, moderate: 0, hesitant: 0, refused: 0, unreachable: 0,
  };
  for (const r of records) counts[r.willingness]++;
  return WILLINGNESS_ORDER.map((k) => ({
    key: k,
    name: WILLINGNESS_META[k].label,
    value: counts[k],
    color: WILLINGNESS_META[k].color,
  }));
}

// ─── 走访方式分布 ─────────────────────────────────────────────
export interface MethodSlice {
  key: VisitMethod;
  name: string;
  value: number;
  color: string;
}

export function computeMethodDist(records: VisitRecord[]): MethodSlice[] {
  const counts: Record<VisitMethod, number> = { in_person: 0, phone: 0, online_meeting: 0 };
  for (const r of records) counts[r.visitMethod]++;
  return (Object.keys(counts) as VisitMethod[]).map((k) => ({
    key: k,
    name: VISIT_METHOD_META[k].label,
    value: counts[k],
    color: VISIT_METHOD_META[k].color,
  }));
}

// ─── 街道横向对比(堆叠) ───────────────────────────────────────
export interface StreetRow {
  street: string;
  total: number;
  strong: number;
  moderate: number;
  hesitant: number;
  refused: number;
  unreachable: number;
}

export function computeStreetBreakdown({ records, companies }: AggInputs): StreetRow[] {
  const companyById = new Map(companies.map((c) => [c.id, c]));
  const buckets: Record<string, Omit<StreetRow, "street" | "total">> = {};
  for (const r of records) {
    const c = companyById.get(r.companyId);
    if (!c) continue;
    const b =
      buckets[c.street] ??
      (buckets[c.street] = { strong: 0, moderate: 0, hesitant: 0, refused: 0, unreachable: 0 });
    b[r.willingness]++;
  }
  return Object.entries(buckets)
    .map(([street, b]) => ({
      street,
      total: b.strong + b.moderate + b.hesitant + b.refused + b.unreachable,
      ...b,
    }))
    .sort((a, b) => b.total - a.total);
}

// ─── 走访员排行 ──────────────────────────────────────────────
export interface VisitorRow {
  visitorId: string;
  visitorName: string;
  visits: number;
  willingCount: number;
  willingRate: number;
}

export function computeVisitorRanking(records: VisitRecord[]): VisitorRow[] {
  const buckets: Record<string, { visitorName: string; visits: number; willingCount: number }> = {};
  for (const r of records) {
    const b =
      buckets[r.visitorId] ??
      (buckets[r.visitorId] = { visitorName: r.visitorName, visits: 0, willingCount: 0 });
    b.visits++;
    if (r.willingness === "strong" || r.willingness === "moderate") b.willingCount++;
  }
  return Object.entries(buckets)
    .map(([visitorId, b]) => ({
      visitorId,
      visitorName: b.visitorName,
      visits: b.visits,
      willingCount: b.willingCount,
      willingRate: b.visits > 0 ? Math.round((b.willingCount / b.visits) * 100) : 0,
    }))
    .sort((a, b) => b.visits - a.visits || b.willingRate - a.willingRate);
}

// ─── 企业自述档位 ────────────────────────────────────────────
const EMPLOYEE_BUCKETS: { label: string; test: (n: number) => boolean }[] = [
  { label: "< 10 人",    test: (n) => n < 10 },
  { label: "10-49 人",   test: (n) => n >= 10 && n < 50 },
  { label: "50-99 人",   test: (n) => n >= 50 && n < 100 },
  { label: "100-299 人", test: (n) => n >= 100 && n < 300 },
  { label: "300+ 人",    test: (n) => n >= 300 },
];

const REVENUE_LABELS = {
  under_500w:    "< 500 万",
  "500w_2000w":  "500-2000 万",
  "2000w_1yi":   "2000 万-1 亿",
  above_1yi:     "> 1 亿",
} as const;
type RevenueKey = keyof typeof REVENUE_LABELS;

const RD_RATIO_LABELS = {
  under_3pct:  "< 3%",
  "3_5pct":    "3-5%",
  "5_10pct":   "5-10%",
  above_10pct: "> 10%",
} as const;
type RdRatioKey = keyof typeof RD_RATIO_LABELS;

export interface BucketData {
  label: string;
  value: number;
}

export interface FieldVerifiedDist {
  empBuckets: BucketData[];
  revBuckets: BucketData[];
  rdBuckets: BucketData[];
}

export function computeFieldVerifiedDist(records: VisitRecord[]): FieldVerifiedDist {
  const empBuckets: BucketData[] = EMPLOYEE_BUCKETS.map((b) => ({ label: b.label, value: 0 }));
  for (const r of records) {
    const n = r.fieldVerified.employeeCount;
    if (typeof n !== "number") continue;
    for (let i = 0; i < EMPLOYEE_BUCKETS.length; i++) {
      if (EMPLOYEE_BUCKETS[i].test(n)) {
        empBuckets[i].value++;
        break;
      }
    }
  }

  const revKeys = Object.keys(REVENUE_LABELS) as RevenueKey[];
  const revBuckets: BucketData[] = revKeys.map((k) => ({ label: REVENUE_LABELS[k], value: 0 }));
  for (const r of records) {
    const k = r.fieldVerified.annualRevenue;
    if (!k) continue;
    const idx = revKeys.indexOf(k);
    if (idx >= 0) revBuckets[idx].value++;
  }

  const rdKeys = Object.keys(RD_RATIO_LABELS) as RdRatioKey[];
  const rdBuckets: BucketData[] = rdKeys.map((k) => ({ label: RD_RATIO_LABELS[k], value: 0 }));
  for (const r of records) {
    const k = r.fieldVerified.rdExpenseRatio;
    if (!k) continue;
    const idx = rdKeys.indexOf(k);
    if (idx >= 0) rdBuckets[idx].value++;
  }

  return { empBuckets, revBuckets, rdBuckets };
}

// ─── 障碍 / 需求关键词词频 ───────────────────────────────────
const STOPWORDS = new Set([
  "我们", "他们", "以及", "但是", "因为", "所以", "由于", "不能", "不会", "没有", "已经",
  "可以", "就是", "还是", "这是", "那么", "什么", "对于", "进行", "目前", "近期", "希望",
  "公司", "企业", "方面", "情况", "问题", "一些", "正在", "尚未", "后续", "相关",
  "暂时", "比较", "其实", "感觉", "认为", "觉得", "可能", "或者", "如果", "应该",
]);

export interface KeywordItem {
  word: string;
  count: number;
}

export function computeKeywordTop(
  records: VisitRecord[],
  field: "keyObstacles" | "companyCommitments",
  topN = 12
): KeywordItem[] {
  const counts: Record<string, number> = {};
  for (const r of records) {
    const text = r[field];
    if (!text) continue;
    const tokens = text.split(/[，,。.；;：:、\s\n\r/()（）"""''!?！？\-—…]+/).filter(Boolean);
    for (const raw of tokens) {
      const t = raw.trim();
      if (t.length < 2) continue;
      if (STOPWORDS.has(t)) continue;
      counts[t] = (counts[t] ?? 0) + 1;
    }
  }
  return Object.entries(counts)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN);
}
