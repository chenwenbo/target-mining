"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllTasks } from "@/lib/mock-data";
import { getCurrentVisitor, getVisitRecordsByTask, getTaskStatusOverrides, getDispatchedTasks, getCustomTasks } from "@/lib/mobile-mock";
import { QUAL_TYPE_META, type Task, type Visitor, type TaskStatus, type QualificationType } from "@/lib/types";
import { Search, ChevronRight, CheckCircle2 } from "lucide-react";

const STATUS_TABS: { label: string; value: TaskStatus | "all" }[] = [
  { label: "全部", value: "all" },
  { label: "待摸排", value: "pending" },
  { label: "摸排完成", value: "done" },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "待摸排",
  done: "摸排完成",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: "bg-gray-100 text-gray-500",
  done: "bg-emerald-100 text-emerald-600",
};

// 资质类型徽章配色（与 QUAL_TYPE_META.color 对应）
const QUAL_BADGE_STYLES: Record<QualificationType, string> = {
  high_tech:       "bg-blue-50 text-blue-600 border-blue-100",
  innovative_sme:  "bg-violet-50 text-violet-600 border-violet-100",
  specialized_sme: "bg-amber-50 text-amber-600 border-amber-100",
  little_giant:    "bg-rose-50 text-rose-600 border-rose-100",
};

// 缺省视为高企，兼容历史任务数据
const qualOf = (t: Task): QualificationType => t.qualType ?? "high_tech";

export default function TasksPage() {
  const router = useRouter();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");
  const [qualFilter, setQualFilter] = useState<QualificationType | "all">("all");

  useEffect(() => {
    const v = getCurrentVisitor();
    if (!v) {
      router.replace("/mobile/login");
      return;
    }
    setVisitor(v);
  }, [router]);

  if (!visitor) return null;

  const overrides = getTaskStatusOverrides();
  // 街道管理员视角：以街道为隔离边界，凡本街道任务都可见
  // （历史 mock 任务的 assignee 仍是中文姓名，街道字段才是稳定标识）
  const allTasks = [...getAllTasks(), ...getDispatchedTasks(), ...getCustomTasks()]
    .filter((t) => (visitor.street ? t.street === visitor.street : t.assignee === visitor.name))
    .map((t) => ({ ...t, status: (overrides[t.id] ?? t.status) as TaskStatus }));

  const filtered = allTasks.filter((t) => {
    if (search && !t.companyName.includes(search)) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (qualFilter !== "all" && qualOf(t) !== qualFilter) return false;
    return true;
  });

  // 仅展示本街道任务实际涉及的资质类型，避免空标签
  const qualFilterTabs: (QualificationType | "all")[] = [
    "all",
    ...(Object.keys(QUAL_TYPE_META) as QualificationType[]).filter((q) =>
      allTasks.some((t) => qualOf(t) === q)
    ),
  ];

  const pendingCount = allTasks.filter((t) => t.status === "pending").length;

  return (
    <div className="flex flex-col h-screen">
      {/* 顶部 Header */}
      <div className="bg-blue-600 pt-safe px-4 pb-4">
        <div className="flex items-center justify-between mb-3 pt-2">
          <div>
            <h1 className="text-white font-semibold text-base">我的任务</h1>
            <p className="text-blue-200 text-xs mt-0.5">{visitor.name} · {visitor.dept}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              待摸排 {pendingCount}
            </span>
          </div>
        </div>
        {/* 搜索框 */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索企业名称"
            className="w-full bg-white rounded-lg pl-8 pr-3 py-2 text-sm text-gray-700 outline-none placeholder:text-gray-400"
          />
        </div>
      </div>

      {/* 状态 Tab */}
      <div className="bg-white border-b border-gray-100 px-4 flex gap-1 overflow-x-auto no-scrollbar">
        {STATUS_TABS.map(({ label, value }) => (
          <button
            key={value}
            onClick={() => setStatusFilter(value)}
            className={`shrink-0 py-2.5 px-3 text-sm font-medium border-b-2 transition-colors ${
              statusFilter === value
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-400"
            }`}
          >
            {label}
            <span className="ml-1 text-xs">
              ({value === "all" ? allTasks.length : allTasks.filter((t) => t.status === value).length})
            </span>
          </button>
        ))}
      </div>

      {/* 资质类型筛选 */}
      {qualFilterTabs.length > 2 && (
        <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar">
          {qualFilterTabs.map((q) => {
            const active = qualFilter === q;
            const label = q === "all" ? "全部资质" : QUAL_TYPE_META[q].shortLabel;
            const count = q === "all" ? allTasks.length : allTasks.filter((t) => qualOf(t) === q).length;
            return (
              <button
                key={q}
                onClick={() => setQualFilter(q)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border font-medium transition-colors ${
                  active
                    ? q === "all"
                      ? "bg-blue-600 text-white border-blue-600"
                      : `${QUAL_BADGE_STYLES[q]} ring-1 ring-current`
                    : "bg-gray-50 text-gray-500 border-gray-100"
                }`}
              >
                {label}
                <span className="ml-1 opacity-70">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 任务列表 */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <CheckCircle2 size={40} className="mb-3 opacity-30" />
            <p className="text-sm">暂无任务</p>
          </div>
        ) : (
          filtered.map((task) => <TaskCard key={task.id} task={task} />)
        )}
      </div>
    </div>
  );
}

function TaskCard({ task }: { task: Task & { status: TaskStatus } }) {
  const records = getVisitRecordsByTask(task.id);
  const lastRecord = records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];

  return (
    <Link href={`/mobile/tasks/${task.id}`}>
      <div className="bg-white rounded-xl p-4 border border-gray-100 active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${QUAL_BADGE_STYLES[qualOf(task)]}`}>
              {QUAL_TYPE_META[qualOf(task)].shortLabel}摸排
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0 mt-0.5" />
        </div>

        <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1">{task.companyName}</h3>
        <p className="text-xs text-gray-400 mb-2">{task.street} · 走访次数 {records.length}</p>

        {lastRecord && (
          <div className="flex justify-end">
            <span className="text-[10px] text-gray-400">
              上次走访 {lastRecord.visitedAt.slice(5, 10).replace("-", "月") + "日"}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
