import Link from "next/link";
import { CalendarDays, User, RefreshCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import type { RenewalTask, RenewalTaskStatus, RenewalStatus } from "@/lib/types";

const URGENCY_META: Record<RenewalStatus, { label: string; bg: string; text: string }> = {
  overdue:    { label: "已过期",  bg: "bg-red-100",    text: "text-red-700" },
  critical:   { label: "紧急",    bg: "bg-orange-100", text: "text-orange-700" },
  approaching:{ label: "预警",    bg: "bg-amber-100",  text: "text-amber-700" },
  active:     { label: "正常",    bg: "bg-emerald-100",text: "text-emerald-700" },
};

interface Props {
  task: RenewalTask;
  columns: { key: RenewalTaskStatus; label: string }[];
  onMove: (id: string, to: RenewalTaskStatus) => void;
}

export default function RenewalTaskCard({ task, columns, onMove }: Props) {
  const urgencyMeta = URGENCY_META[task.urgency];
  const isOverdue = new Date(task.deadline) < new Date("2026-04-22");

  return (
    <div className="bg-white rounded-lg border border-[#e5e7eb] p-4 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.08)] transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <span className={cn("inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium", urgencyMeta.bg, urgencyMeta.text)}>
          <RefreshCcw size={9} /> {urgencyMeta.label}
        </span>
        <span className={cn(
          "text-[10px] px-1.5 py-0.5 rounded-full font-medium",
          isOverdue ? "bg-red-50 text-red-600" : "bg-[#f7f8fa] text-[#94a3b8]"
        )}>
          {isOverdue ? "⚠ 已超期" : `截止 ${task.deadline.slice(0, 7)}`}
        </span>
      </div>

      <Link
        href={`/targets/${task.companyId}`}
        className="block text-sm font-semibold text-[#0f172a] hover:text-blue-600 transition-colors leading-snug mb-1"
      >
        {task.companyName}
      </Link>

      <div className="text-[11px] text-[#94a3b8] font-mono mb-2">{task.certNo}</div>

      {task.notes && (
        <p className="text-xs text-[#64748b] mb-3 leading-relaxed line-clamp-2">{task.notes}</p>
      )}

      <div className="flex items-center gap-1.5 text-xs text-[#94a3b8] mb-3 border-t border-[#f1f5f9] pt-2">
        <span className="flex items-center gap-1"><User size={10} /> {task.assignee}</span>
        <span className="mx-1">·</span>
        <span className="flex items-center gap-1"><CalendarDays size={10} /> {task.expiryYear}年到期</span>
      </div>

      {/* Move buttons */}
      <div className="flex gap-1.5">
        {columns.filter((c) => c.key !== task.status).slice(0, 2).map((col) => (
          <button
            key={col.key}
            onClick={() => onMove(task.id, col.key)}
            className="flex-1 text-[11px] px-2 py-1 border border-[#e5e7eb] rounded-md text-[#475569] hover:bg-[#f7f8fa] hover:text-[#0f172a] transition-colors"
          >
            → {col.label}
          </button>
        ))}
      </div>
    </div>
  );
}
