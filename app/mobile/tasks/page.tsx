"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getAllTasks } from "@/lib/mock-data";
import { getCurrentVisitor, getVisitRecordsByTask, getTaskStatusOverrides } from "@/lib/mobile-mock";
import type { Task, Visitor, TaskStatus } from "@/lib/types";
import { Search, ChevronRight, AlertCircle, CheckCircle2, Clock } from "lucide-react";

const STATUS_TABS: { label: string; value: TaskStatus | "all" }[] = [
  { label: "全部", value: "all" },
  { label: "待走访", value: "pending" },
  { label: "进行中", value: "in_progress" },
  { label: "已完成", value: "done" },
];

const STATUS_LABELS: Record<TaskStatus, string> = {
  pending: "待走访",
  in_progress: "进行中",
  done: "已完成",
};

const STATUS_STYLES: Record<TaskStatus, string> = {
  pending: "bg-gray-100 text-gray-500",
  in_progress: "bg-blue-100 text-blue-600",
  done: "bg-emerald-100 text-emerald-600",
};

export default function TasksPage() {
  const router = useRouter();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "all">("all");

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
  const allTasks = getAllTasks()
    .filter((t) => (visitor.street ? t.street === visitor.street : t.assignee === visitor.name))
    .map((t) => ({ ...t, status: (overrides[t.id] ?? t.status) as TaskStatus }));

  const filtered = allTasks.filter((t) => {
    if (search && !t.companyName.includes(search)) return false;
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    return true;
  });

  const pendingCount = allTasks.filter((t) => t.status === "pending").length;
  const overdueCount = allTasks.filter(
    (t) => t.status !== "done" && new Date(t.deadline) < new Date()
  ).length;

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
            {overdueCount > 0 && (
              <span className="flex items-center gap-1 bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
                <AlertCircle size={10} />
                超期 {overdueCount}
              </span>
            )}
            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full font-medium">
              待走访 {pendingCount}
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
  const isOverdue = task.status !== "done" && new Date(task.deadline) < new Date();

  return (
    <Link href={`/mobile/tasks/${task.id}`}>
      <div className="bg-white rounded-xl p-4 border border-gray-100 active:scale-[0.98] transition-transform">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[task.status]}`}>
              {STATUS_LABELS[task.status]}
            </span>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0 mt-0.5" />
        </div>

        <h3 className="font-semibold text-gray-800 text-sm leading-snug mb-1">{task.companyName}</h3>
        <p className="text-xs text-gray-400 mb-2">{task.street} · 走访次数 {records.length}</p>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Clock size={11} className={isOverdue ? "text-red-400" : "text-gray-300"} />
            <span className={`text-[11px] ${isOverdue ? "text-red-500 font-medium" : "text-gray-400"}`}>
              {isOverdue ? "已超期 · " : "截止 "}
              {task.deadline}
            </span>
          </div>
          {lastRecord && (
            <span className="text-[10px] text-gray-400">
              上次走访 {lastRecord.visitedAt.slice(5, 10).replace("-", "月") + "日"}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
