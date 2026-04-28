"use client";
import { useEffect, useMemo, useState } from "react";
import { Building2, Search, X, Check } from "lucide-react";
import { getAllTasks, getCompanyById, getAllCompanies } from "@/lib/mock-data";
import {
  getDispatchedTasks,
  getVisitRecords,
  getTaskStatusOverrides,
  getCustomTasks,
  addCustomTask,
  getDraft,
  MOCK_VISITORS,
} from "@/lib/mobile-mock";
import { useCurrentPCUser } from "@/lib/account-mock";
import { STREETS, type Street, type Task, type VisitRecord, type WillingnessLevel } from "@/lib/types";
import {
  getTaskLifecycleStage,
  latestVisitRecord,
  WILLINGNESS_META,
  type LifecycleStage,
} from "./lifecycle";
import KanbanPoolColumn from "./KanbanPoolColumn";
import KanbanColumn from "./KanbanColumn";

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
  const [q, setQ] = useState("");
  const [streetFilter, setStreetFilter] = useState<string>("all");
  const [assigneeFilter, setAssigneeFilter] = useState<string>("all");
  const [willingnessFilter, setWillingnessFilter] = useState<WillingnessLevel | "all">("all");
  // 拖拽派发
  const [draggingCompanyId, setDraggingCompanyId] = useState<string | null>(null);
  const [pendingCompanyId, setPendingCompanyId] = useState<string | null>(null);
  const [selectedAssignee, setSelectedAssignee] = useState<string>("");

  useEffect(() => {
    if (lockedStreet && streetFilter !== lockedStreet) setStreetFilter(lockedStreet);
    if (lockedStreet && assigneeFilter !== "all") setAssigneeFilter("all");
  }, [lockedStreet, streetFilter, assigneeFilter]);

  const [allRecords, setAllRecords] = useState<VisitRecord[]>([]);
  const [statusOverrides, setStatusOverrides] = useState<Record<string, Task["status"]>>({});
  const [dispatched, setDispatched] = useState<Task[]>([]);
  const [customTasks, setCustomTasks] = useState<Task[]>([]);

  useEffect(() => {
    setAllRecords(getVisitRecords());
    setStatusOverrides(getTaskStatusOverrides());
    setDispatched(getDispatchedTasks());
    setCustomTasks(getCustomTasks());
  }, [version]);

  const allCompanies = useMemo(() => getAllCompanies(), []);

  const enriched: TaskWithStage[] = useMemo(() => {
    const merged = [...getAllTasks(), ...dispatched, ...customTasks];
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
  }, [allRecords, statusOverrides, dispatched, customTasks]);

  const assigneeOptions = useMemo(() => {
    const set = new Set<string>(MOCK_VISITORS.map((v) => v.name));
    for (const e of enriched) set.add(e.task.assignee);
    return Array.from(set).sort();
  }, [enriched]);

  const filtersActive = !!(
    q ||
    streetFilter !== "all" ||
    assigneeFilter !== "all" ||
    willingnessFilter !== "all"
  );

  function makeColumnItems(stagePredicate: (s: Exclude<LifecycleStage, "pool">) => boolean) {
    return enriched
      .filter((e) => {
        if (!stagePredicate(e.stage)) return false;
        if (q && !e.task.companyName.includes(q)) return false;
        if (streetFilter !== "all" && e.task.street !== streetFilter) return false;
        if (assigneeFilter !== "all" && e.task.assignee !== assigneeFilter) return false;
        if (
          willingnessFilter !== "all" &&
          (!e.latest || e.latest.willingness !== willingnessFilter)
        )
          return false;
        return true;
      })
      .sort((a, b) => a.task.deadline.localeCompare(b.task.deadline))
      .map((e) => ({ ...e, company: getCompanyById(e.task.companyId) }));
  }

  // 已派发待摸排 = dispatched + investigating 合并
  const activeItems = useMemo(
    () => makeColumnItems((s) => s === "dispatched" || s === "investigating"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enriched, q, streetFilter, assigneeFilter, willingnessFilter],
  );

  const doneItems = useMemo(
    () => makeColumnItems((s) => s === "done"),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [enriched, q, streetFilter, assigneeFilter, willingnessFilter],
  );

  function handleDropToDispatched() {
    if (!draggingCompanyId) return;
    setSelectedAssignee(MOCK_VISITORS[0]?.name ?? "");
    setPendingCompanyId(draggingCompanyId);
    setDraggingCompanyId(null);
  }

  function confirmDispatch() {
    if (!pendingCompanyId || !selectedAssignee) return;
    const company = allCompanies.find((c) => c.id === pendingCompanyId);
    if (!company) return;
    const today = new Date();
    const deadline = new Date(today.setMonth(today.getMonth() + 3))
      .toISOString()
      .slice(0, 10);
    const newTask: Task = {
      id: `custom_${Date.now()}`,
      companyId: company.id,
      companyName: company.name,
      assignee: selectedAssignee,
      street: company.street as import("@/lib/types").Street,
      status: "pending",
      createdAt: new Date().toISOString().slice(0, 10),
      deadline,
      notes: "",
    };
    addCustomTask(newTask);
    setPendingCompanyId(null);
    setVersion((v) => v + 1);
  }

  function clearFilters() {
    setQ("");
    setStreetFilter(lockedStreet ?? "all");
    setAssigneeFilter("all");
    setWillingnessFilter("all");
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* 标题行 */}
      <div className="flex items-end justify-between mb-4">
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
      </div>

      {/* 筛选条 */}
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
            options={[
              { value: "all", label: "全部街道" },
              ...STREETS.map((s) => ({ value: s, label: s })),
            ]}
          />
        )}

        {!lockedStreet && (
          <Selector
            label="经办人"
            value={assigneeFilter}
            onChange={setAssigneeFilter}
            options={[
              { value: "all", label: "全部经办人" },
              ...assigneeOptions.map((a) => ({ value: a, label: a })),
            ]}
          />
        )}

        <Selector
          label="意愿"
          value={willingnessFilter}
          onChange={(v) => setWillingnessFilter(v as WillingnessLevel | "all")}
          options={[
            { value: "all", label: "全部意愿" },
            ...(
              ["strong", "moderate", "hesitant", "refused", "unreachable"] as WillingnessLevel[]
            ).map((w) => ({
              value: w,
              label: WILLINGNESS_META[w].label,
            })),
          ]}
        />

        {filtersActive && (
          <button
            onClick={clearFilters}
            className="ml-auto flex items-center gap-1 text-xs text-[#64748b] hover:text-[#0f172a] transition-colors"
          >
            <X size={12} /> 清除筛选
          </button>
        )}
      </div>

      {/* 看板：3 列 */}
      <div
        className="flex gap-3 flex-1 min-h-0 overflow-x-auto pb-1"
        onDragEnd={() => setDraggingCompanyId(null)}
      >
        {/* 标的池（所有企业） */}
        <KanbanPoolColumn
          companies={allCompanies}
          onDragStart={setDraggingCompanyId}
          onDragEnd={() => setDraggingCompanyId(null)}
        />

        {/* 已派发待摸排（dispatched + investigating） */}
        <KanbanColumn
          stage="dispatched"
          label="已派发待摸排"
          items={activeItems}
          filtersActive={filtersActive}
          isDropTarget
          isDragging={!!draggingCompanyId}
          onDrop={handleDropToDispatched}
        />

        {/* 已完成 */}
        <KanbanColumn
          stage="done"
          label="已完成"
          items={doneItems}
          filtersActive={filtersActive}
        />
      </div>

      {/* 派发确认弹窗 */}
      {pendingCompanyId && (() => {
        const company = allCompanies.find((c) => c.id === pendingCompanyId);
        return (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-[2px] z-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-2xl w-[340px] p-6">
              <h3 className="text-base font-semibold text-[#0f172a] mb-0.5">派发企业</h3>
              <p className="text-xs text-[#94a3b8] mb-4 truncate">{company?.name}</p>

              <p className="text-xs text-[#475569] font-medium mb-2">选择跟进经办人</p>
              <div className="space-y-2 mb-5">
                {MOCK_VISITORS.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setSelectedAssignee(v.name)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm transition-colors ${
                      selectedAssignee === v.name
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-[#e5e7eb] text-[#0f172a] hover:border-[#cbd5e1]"
                    }`}
                  >
                    <span className="font-medium">{v.name}</span>
                    {selectedAssignee === v.name && <Check size={14} className="text-blue-600" />}
                  </button>
                ))}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setPendingCompanyId(null)}
                  className="flex-1 py-2 text-sm border border-[#e5e7eb] rounded-lg text-[#475569] hover:bg-[#f7f8fa] transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmDispatch}
                  disabled={!selectedAssignee}
                  className="flex-1 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-medium"
                >
                  确认派发
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function Selector({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <span className="text-[#475569]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-2.5 py-1.5 text-sm bg-white border border-[#e5e7eb] rounded-md focus:outline-none focus:border-blue-400 min-w-[110px]"
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
