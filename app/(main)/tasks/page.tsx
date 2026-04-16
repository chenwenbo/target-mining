"use client";
import { useState } from "react";
import Link from "next/link";
import { getAllTasks } from "@/lib/mock-data";
import TierBadge from "@/components/ui/TierBadge";
import { cn } from "@/lib/cn";
import { CalendarDays, User, ChevronRight } from "lucide-react";
import type { Task, TaskStatus } from "@/lib/types";

const COLUMNS: { key: TaskStatus; label: string; color: string; dot: string }[] = [
  { key: "pending", label: "待处理", color: "bg-slate-50 border-slate-200", dot: "bg-slate-300" },
  { key: "in_progress", label: "处理中", color: "bg-blue-50 border-blue-200", dot: "bg-blue-500" },
  { key: "done", label: "已完成", color: "bg-emerald-50 border-emerald-200", dot: "bg-emerald-500" },
];

function TaskCard({
  task,
  onMove,
}: {
  task: Task;
  onMove: (id: string, to: TaskStatus) => void;
}) {
  const isOverdue = new Date(task.deadline) < new Date("2026-04-15");

  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.08)] transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <TierBadge tier={task.tier} size="sm" />
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          isOverdue ? "bg-red-50 text-red-600" : "bg-[#f7f8fa] text-[#94a3b8]"
        )}>
          {isOverdue ? "⚠ 已超期" : task.deadline}
        </span>
      </div>

      <Link
        href={`/targets/${task.companyId}`}
        className="block text-sm font-semibold text-[#0f172a] hover:text-blue-600 transition-colors leading-snug mb-2"
      >
        {task.companyName}
      </Link>

      {task.notes && (
        <p className="text-xs text-[#64748b] mb-3 leading-relaxed line-clamp-2">{task.notes}</p>
      )}

      <div className="flex items-center justify-between pt-2 border-t border-[#f1f5f9]">
        <div className="flex items-center gap-3 text-[11px] text-[#94a3b8]">
          <span className="flex items-center gap-1"><User size={10} /> {task.assignee}</span>
          <span className="flex items-center gap-1"><CalendarDays size={10} /> {task.createdAt}</span>
        </div>
      </div>

      {/* Move buttons */}
      <div className="flex gap-1.5 mt-3">
        {COLUMNS.filter((c) => c.key !== task.status).map((col) => (
          <button
            key={col.key}
            onClick={() => onMove(task.id, col.key)}
            className="flex-1 text-[11px] px-2 py-1 border border-[#e5e7eb] rounded-md text-[#475569] hover:bg-[#f7f8fa] hover:text-[#0f172a] transition-colors flex items-center justify-center gap-1"
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>(getAllTasks());
  const [filterAssignee, setFilterAssignee] = useState("all");

  const assignees = ["all", ...Array.from(new Set(tasks.map((t) => t.assignee)))];

  const visibleTasks = filterAssignee === "all" ? tasks : tasks.filter((t) => t.assignee === filterAssignee);

  function moveTask(id: string, to: TaskStatus) {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: to } : t)));
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">任务管理</h1>
          <p className="text-sm text-[#94a3b8] mt-1">标的派发与跟进 · 共 {tasks.length} 条任务</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-[#475569]">
            <span>经办人</span>
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-2.5 py-1.5 text-sm bg-white border border-[#e5e7eb] rounded-md focus:outline-none"
            >
              {assignees.map((a) => (
                <option key={a} value={a}>{a === "all" ? "全部" : a}</option>
              ))}
            </select>
          </div>
          <Link
            href="/targets"
            className="flex items-center gap-1 px-3.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            从标的池派发 <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {COLUMNS.map((col) => {
          const count = visibleTasks.filter((t) => t.status === col.key).length;
          return (
            <div key={col.key} className={cn("rounded-xl border p-4", col.color)}>
              <div className="flex items-center gap-2 mb-1">
                <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                <span className="text-sm font-semibold text-[#0f172a]">{col.label}</span>
              </div>
              <div className="text-2xl font-bold text-[#0f172a] tabular-nums">{count}</div>
              <div className="text-xs text-[#94a3b8] mt-0.5">条任务</div>
            </div>
          );
        })}
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-3 gap-5">
        {COLUMNS.map((col) => {
          const colTasks = visibleTasks.filter((t) => t.status === col.key);
          return (
            <div key={col.key}>
              <div className="flex items-center gap-2 mb-3">
                <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                <span className="text-sm font-semibold text-[#475569]">{col.label}</span>
                <span className="ml-auto text-xs bg-[#f1f5f9] text-[#94a3b8] px-2 py-0.5 rounded-full tabular-nums">
                  {colTasks.length}
                </span>
              </div>
              <div className="space-y-3 min-h-[200px]">
                {colTasks.map((task) => (
                  <TaskCard key={task.id} task={task} onMove={moveTask} />
                ))}
                {colTasks.length === 0 && (
                  <div className="rounded-lg border-2 border-dashed border-[#e5e7eb] p-6 text-center text-xs text-[#94a3b8]">
                    暂无任务
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
