"use client";
import { useState } from "react";
import type { Task, VisitRecord, Company } from "@/lib/types";
import { cn } from "@/lib/cn";
import { LIFECYCLE_META, type LifecycleStage } from "./lifecycle";
import KanbanCard from "./KanbanCard";

type KanbanItem = {
  task: Task;
  stage: Exclude<LifecycleStage, "pool">;
  records: VisitRecord[];
  latest?: VisitRecord;
  hasDraft: boolean;
  company?: Company;
};

type Props = {
  stage: Exclude<LifecycleStage, "pool">;
  label?: string;
  items: KanbanItem[];
  filtersActive: boolean;
  isDropTarget?: boolean;
  isDragging?: boolean;
  onDrop?: () => void;
};

export default function KanbanColumn({
  stage,
  label,
  items,
  filtersActive,
  isDropTarget,
  isDragging,
  onDrop,
}: Props) {
  const meta = LIFECYCLE_META[stage];
  const displayLabel = label ?? meta.label;
  const [isDragOver, setIsDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => {
        if (!isDropTarget || !isDragging) return;
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (isDropTarget && isDragging) onDrop?.();
      }}
      className={cn(
        "flex flex-col rounded-xl border flex-1 min-w-[260px] overflow-hidden transition-colors",
        isDragOver
          ? "bg-blue-50 border-blue-300 ring-2 ring-blue-200"
          : "bg-[#f1f5f9] border-[#e5e7eb]",
      )}
    >
      {/* 列头 */}
      <div className="shrink-0 px-4 py-3 border-b border-[#e5e7eb] bg-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", meta.dot)} />
            <span className="text-sm font-semibold text-[#0f172a]">{displayLabel}</span>
          </div>
          <span className={cn("text-xs font-bold tabular-nums px-2 py-0.5 rounded-full", meta.bg, meta.text)}>
            {items.length}
          </span>
        </div>
      </div>

      {/* 卡片区 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isDragOver && (
          <div className="h-14 rounded-lg border-2 border-dashed border-blue-300 flex items-center justify-center text-xs text-blue-500 mb-1">
            松开以派发
          </div>
        )}
        {items.length === 0 && !isDragOver ? (
          <div className="flex items-center justify-center h-24 text-xs text-[#94a3b8] text-center px-4">
            {filtersActive ? "无符合筛选条件的任务" : "暂无任务"}
          </div>
        ) : (
          items.map((item) => (
            <KanbanCard
              key={item.task.id}
              stage={item.stage}
              task={item.task}
              company={item.company}
              latestRecord={item.latest}
            />
          ))
        )}
      </div>
    </div>
  );
}
