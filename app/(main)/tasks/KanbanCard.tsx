"use client";
import Link from "next/link";
import { User } from "lucide-react";
import type { Task, VisitRecord, Company } from "@/lib/types";
import { cn } from "@/lib/cn";
import { WILLINGNESS_META, type LifecycleStage } from "./lifecycle";

type Props = {
  stage: Exclude<LifecycleStage, "pool">;
  task: Task;
  company?: Company;
  latestRecord?: VisitRecord;
};

export default function KanbanCard({ stage, task, company, latestRecord }: Props) {
  const wMeta = stage === "done" && latestRecord ? WILLINGNESS_META[latestRecord.willingness] : null;
  const href =
    stage === "done"
      ? `/targets/${task.companyId}?tab=企业摸排`
      : `/targets/${task.companyId}`;

  return (
    <Link
      href={href}
      className="block bg-white rounded-lg border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.08)] hover:border-[#cbd5e1] transition-all p-3 space-y-2"
    >
      <div
        className="text-[13px] font-semibold text-[#0f172a] leading-snug line-clamp-2"
        title={task.companyName}
      >
        {task.companyName}
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569]">
          {task.street}
        </span>
        {company?.industry && (
          <span className="text-[10px] text-[#94a3b8] truncate max-w-[130px]" title={company.industry}>
            {company.industry}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1 text-[11px] text-[#64748b]">
        <User size={10} className="text-[#94a3b8]" />
        {task.assignee}
      </div>

      {wMeta && (
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full border",
            wMeta.badge,
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", wMeta.dot)} />
          {wMeta.label}
        </span>
      )}
    </Link>
  );
}
