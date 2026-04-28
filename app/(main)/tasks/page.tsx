"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Building2, ChevronRight, RotateCw, Search, X } from "lucide-react";
import { getAllTasks, getCompanyById, getDashboardKPI } from "@/lib/mock-data";
import {
  getDispatchedTasks,
  getVisitRecords,
  getTaskStatusOverrides,
  setTaskStatus,
  getDraft,
  MOCK_VISITORS,
} from "@/lib/mobile-mock";
import { useCurrentPCUser } from "@/lib/account-mock";
import { STREETS, type Street, type Task, type VisitRecord, type WillingnessLevel } from "@/lib/types";
import {
  getTaskLifecycleStage,
  latestVisitRecord,
  LIFECYCLE_ORDER,
  WILLINGNESS_META,
  type LifecycleStage,
} from "./lifecycle";
import PipelineRibbon from "./PipelineRibbon";
import PoolSummary from "./PoolSummary";
import TaskRow from "./TaskRow";
import TaskDetailDrawer from "./TaskDetailDrawer";

type StageWithAll = LifecycleStage | "all";

type TaskWithStage = {
  task: Task;
  stage: Exclude<LifecycleStage, "pool">;
  records: VisitRecord[];
  latest?: VisitRecord;
  hasDraft: boolean;
};

export default function TasksPage() {
  const { user, mounted } = useCurrentPCUser();
  const lockedStreet: Street | null =
    mounted && user.role === "street_admin" && user.street ? (user.street as Street) : null;

  const [version, setVersion] = useState(0);
  const [stage, setStage] = useState<StageWithAll>("all");
  const [q, setQ] = useState("");
  const [streetFilter, setStreetFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [willingnessFilter, setWillingnessFilter] = useState<WillingnessLevel | "all">("all");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // 街道管理员视角：街道筛选锁定为本街道，经办人筛选不再适用
  useEffect(() => {
    if (lockedStreet && streetFilter !== lockedStreet) setStreetFilter(lockedStreet);
    if (lockedStreet && assigneeFilter !== "all") setAssigneeFilter("all");
  }, [lockedStreet, streetFilter, assigneeFilter]);

  // localStorage 数据（每次 version 变化重读，避免在 SSR 时访问）
  const [allRecords, setAllRecords] = useState<VisitRecord[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Task["status"]>>({});
  const [dispatched, setDispatched] = useState<Task[]>([]);

  useEffect(() => {
    setAllRecords(getVisitRecords());
    setStatusOverrides(getTaskStatusOverrides());
    setDispatched(getDispatchedTasks());
  }, [version]);

  const kpi = useMemo(() => getDashboardKPI(), []);

  // 合并所有任务并附加生命周期信息
  const enriched: TaskWithStage[] = useMemo(() => {
    const merged = [...getAllTasks(), ...dispatched];
    // 按 id 去重，dispatched 的覆盖 base
    const byId = new Map<string, Task>();
    for (const t of merged) byId.set(t.id, t);

    const out: TaskWithStage[] = [];
    for (const baseTask of byId.values()) {
      const overriddenStatus = statusOverrides[baseTask.id] ?? baseTask.status;
      const task: Task = { ...baseTask, status: overriddenStatus };
      const records = allRecords.filter((r) => r.taskId === task.id);
      const draft = typeof window !== "undefined" ? getDraft(task.id) : null;
      const lifecycleStage = getTaskLifecycleStage(task, records, !!draft);
      out.push({
        task,
        stage: lifecycleStage,
        records,
        latest: latestVisitRecord(records),
        hasDraft: !!draft,
      });
    }
    return out;
  }, [allRecords, statusOverrides, dispatched]);

  // 阶段计数
  const counts: Record<LifecycleStage, number> = useMemo(() => {
    const c: Record<LifecycleStage, number> = {
      pool: kpi.funnelGrowthUnion,
      dispatched: 0,
      investigating: 0,
      done: 0,
    };
    for (const e of enriched) c[e.stage]++;
    return c;
  }, [enriched, kpi.funnelGrowthUnion]);

  const total = enriched.length;

  // 筛选
  const filtered = useMemo(() => {
    return enriched
      .filter((e) => {
        if (stage !== "all" && stage !== "pool" && e.stage !== stage) return false;
        if (q && !e.task.companyName.includes(q)) return false;
        if (streetFilter !== "all" && e.task.street !== streetFilter) return false;
        if (assigneeFilter !== "all" && e.task.assignee !== assigneeFilter) return false;
        if (
          willingnessFilter !== "all" &&
          (!e.latest || e.latest.willingness !== willingnessFilter)
        ) {
          return false;
        }
        return true;
      })
      .sort((a, b) => {
        // 同阶段内：超期优先，然后按截止日期升序
        const stageOrder = LIFECYCLE_ORDER.indexOf(a.stage) - LIFECYCLE_ORDER.indexOf(b.stage);
        if (stageOrder !== 0) return stageOrder;
        return a.task.deadline.localeCompare(b.task.deadline);
      });
  }, [enriched, stage, q, streetFilter, assigneeFilter, willingnessFilter]);

  // 经办人选项 = MOCK_VISITORS ∪ 任务里出现过的 assignee
  const assigneeOptions = useMemo(() => {
    const set = new Set<string>(MOCK_VISITORS.map((v) => v.name));
    for (const e of enriched) set.add(e.task.assignee);
    return Array.from(set).sort();
  }, [enriched]);

  const selected = enriched.find((e) => e.task.id === selectedTaskId);
  const selectedCompany = selected ? getCompanyById(selected.task.companyId) : undefined;

  function clearFilters() {
    setQ("");
    setStreetFilter(lockedStreet ?? "all");
    setAssigneeFilter("all");
    setWillingnessFilter("all");
  }

  function advanceTask(taskId: string) {
    setTaskStatus(taskId, "in_progress");
    setVersion((v) => v + 1);
  }

  const willingnessFilterEnabled = stage === "done" || stage === "all";

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">任务管理</h1>
          <p className="text-sm text-[#94a3b8] mt-1 flex items-center gap-2">
            从标的池到摸排闭环的全流程跟踪
            {lockedStreet && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[11px] text-blue-700">
                <Building2 size={10} />
                当前视图：{lockedStreet} · 仅本街道
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setVersion((v) => v + 1)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#475569] bg-white border border-[#e5e7eb] rounded-lg hover:bg-[#f7f8fa] transition-colors"
            title="重新读取最新摸排数据"
          >
            <RotateCw size={13} /> 刷新
          </button>
          <Link
            href="/targets"
            className="flex items-center gap-1 px-3.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            从标的池派发 <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* 生命周期管道 */}
      <PipelineRibbon counts={counts} total={total} selected={stage} onSelect={setStage} />

      {/* 筛选条 */}
      {stage !== "pool" && (
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] px-4 py-3 mb-4 flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-[280px]">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="搜索企业名称…"
              className="w-full pl-8 pr-3 py-1.5 text-sm border border-[#e5e7eb] rounded-md focus:outline-none focus:border-blue-400"
            />
          </div>

          {!lockedStreet && (
            <Selector
              label="街道"
              value={streetFilter}
              onChange={setStreetFilter}
              options={[{ value: "all", label: "全部街道" }, ...STREETS.map((s) => ({ value: s, label: s }))]}
            />
          )}

          {!lockedStreet && (
            <Selector
              label="经办人"
              value={assigneeFilter}
              onChange={setAssigneeFilter}
              options={[{ value: "all", label: "全部经办人" }, ...assigneeOptions.map((a) => ({ value: a, label: a }))]}
            />
          )}

          <Selector
            label="意愿"
            value={willingnessFilter}
            onChange={(v) => setWillingnessFilter(v as WillingnessLevel | "all")}
            disabled={!willingnessFilterEnabled}
            options={[
              { value: "all", label: "全部意愿" },
              ...(["strong", "moderate", "hesitant", "refused", "unreachable"] as WillingnessLevel[]).map((w) => ({
                value: w,
                label: WILLINGNESS_META[w].label,
              })),
            ]}
          />

          {(q || (!lockedStreet && streetFilter !== "all") || (!lockedStreet && assigneeFilter !== "all") || willingnessFilter !== "all") && (
            <button
              onClick={clearFilters}
              className="ml-auto flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors"
            >
              <X size={12} /> 清除筛选
            </button>
          )}
        </div>
      )}

      {/* 主内容 */}
      {stage === "pool" ? (
        <PoolSummary
          funnelPatentGrowth={kpi.funnelPatentGrowth}
          funnelEmployeeGrowth={kpi.funnelEmployeeGrowth}
          funnelGrowthUnion={kpi.funnelGrowthUnion}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.length === 0 ? (
            <div className="rounded-xl border-2 border-dashed border-[#e5e7eb] bg-white p-12 text-center text-sm text-[#94a3b8]">
              暂无符合条件的任务
            </div>
          ) : (
            filtered.map((e) => (
              <TaskRow
                key={e.task.id}
                stage={e.stage}
                task={e.task}
                company={getCompanyById(e.task.companyId)}
                latestRecord={e.latest}
                recordCount={e.records.length}
                hasDraft={e.hasDraft}
                onOpen={() => setSelectedTaskId(e.task.id)}
                onAdvance={e.stage === "dispatched" ? () => advanceTask(e.task.id) : undefined}
              />
            ))
          )}
        </div>
      )}

      <TaskDetailDrawer
        open={!!selected}
        onClose={() => setSelectedTaskId(null)}
        task={selected?.task ?? null}
        company={selectedCompany}
        records={selected?.records ?? []}
        stage={selected?.stage}
      />
    </div>
  );
}

// ─── 简化的下拉组件 ─────────────────────────────────────────────
function Selector({
  label,
  value,
  onChange,
  options,
  disabled = false,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
}) {
  return (
    <label className={`flex items-center gap-1.5 text-sm ${disabled ? "opacity-40" : ""}`}>
      <span className="text-[#475569]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-2.5 py-1.5 text-sm bg-white border border-[#e5e7eb] rounded-md focus:outline-none focus:border-blue-400 disabled:cursor-not-allowed min-w-[110px]"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}
