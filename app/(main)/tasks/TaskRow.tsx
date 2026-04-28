"use client";
import Link from "next/link";
import { CalendarDays, User, FileText, ChevronRight, AlertTriangle, Save, Repeat } from "lucide-react";
import type { Task, VisitRecord, Company } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  WILLINGNESS_META,
  REVENUE_MAP,
  RD_RATIO_MAP,
  type LifecycleStage,
} from "./lifecycle";

const TODAY = "2026-04-28";

type Props = {
  stage: Exclude<LifecycleStage, "pool">;
  task: Task;
  company?: Company;
  latestRecord?: VisitRecord;
  recordCount: number;
  hasDraft: boolean;
  onOpen: () => void;
  onAdvance?: () => void;
};

export default function TaskRow({
  stage,
  task,
  company,
  latestRecord,
  recordCount,
  hasDraft,
  onOpen,
  onAdvance,
}: Props) {
  const isOverdue = task.deadline < TODAY && stage !== "done";

  return (
    <div
      onClick={onOpen}
      className="group bg-white rounded-lg border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:shadow-[0_2px_10px_0_rgba(15,23,42,0.08)] hover:border-[#cbd5e1] transition-all cursor-pointer"
    >
      <div className="grid grid-cols-12 gap-4 items-center px-4 py-3.5">
        {/* 左：企业基本信息 */}
        <div className="col-span-4 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Link
              href={`/targets/${task.companyId}`}
              onClick={(e) => e.stopPropagation()}
              className="text-sm font-semibold text-[#0f172a] hover:text-blue-600 transition-colors truncate"
              title={task.companyName}
            >
              {task.companyName}
            </Link>
            {isOverdue && (
              <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-50 text-red-600 border border-red-100">
                <AlertTriangle size={10} /> 已超期
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 text-[11px] text-[#64748b]">
            <span className="px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569] truncate max-w-[120px]" title={task.street}>
              {task.street}
            </span>
            {company?.industry && (
              <span className="text-[#94a3b8] truncate" title={company.industry}>
                {company.industry}
              </span>
            )}
          </div>
        </div>

        {/* 中：阶段特化信息 */}
        <div className="col-span-6 min-w-0">
          {(stage === "dispatched" || stage === "investigating") && (
            <DispatchedMiddle task={task} stage={stage} hasDraft={hasDraft} recordCount={recordCount} />
          )}
          {stage === "done" && latestRecord && (
            <DoneMiddle task={task} record={latestRecord} recordCount={recordCount} />
          )}
        </div>

        {/* 右：操作 */}
        <div className="col-span-2 flex items-center justify-end gap-2">
          {stage === "dispatched" && onAdvance && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdvance();
              }}
              className="text-xs px-3 py-1.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100 transition-colors font-medium"
            >
              标记摸排中
            </button>
          )}
          {stage !== "dispatched" && (
            <span className="text-xs text-[#94a3b8] flex items-center gap-0.5 group-hover:text-blue-600 transition-colors">
              查看详情 <ChevronRight size={13} />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 中段：派发中 / 摸排中 ────────────────────────────────────
function DispatchedMiddle({
  task,
  stage,
  hasDraft,
  recordCount,
}: {
  task: Task;
  stage: "dispatched" | "investigating";
  hasDraft: boolean;
  recordCount: number;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
        <span className="flex items-center gap-1">
          <User size={11} className="text-[#94a3b8]" />
          {task.assignee}
        </span>
        <span className="flex items-center gap-1">
          <CalendarDays size={11} className="text-[#94a3b8]" />
          派发于 {task.createdAt}
        </span>
        <span className="flex items-center gap-1">
          截止 <span className="font-medium tabular-nums">{task.deadline}</span>
        </span>
        {stage === "investigating" && hasDraft && (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-fuchsia-50 text-fuchsia-700 border border-fuchsia-100">
            <Save size={10} /> 草稿已保存
          </span>
        )}
        {stage === "investigating" && recordCount > 0 && (
          <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-100">
            <Repeat size={10} /> 走访 {recordCount} 次
          </span>
        )}
      </div>
      {task.notes && (
        <div className="flex items-start gap-1 text-[11px] text-[#94a3b8] line-clamp-1">
          <FileText size={11} className="text-[#cbd5e1] shrink-0 mt-0.5" />
          <span className="truncate">{task.notes}</span>
        </div>
      )}
    </div>
  );
}

// ─── 中段：已完成（含意愿与摸排结果摘要）─────────────────────
function DoneMiddle({
  task,
  record,
  recordCount,
}: {
  task: Task;
  record: VisitRecord;
  recordCount: number;
}) {
  const wMeta = WILLINGNESS_META[record.willingness];
  const facts: string[] = [];
  if (record.fieldVerified.employeeCount) facts.push(`${record.fieldVerified.employeeCount} 人`);
  if (record.fieldVerified.rdExpenseRatio)
    facts.push(`研发占比 ${RD_RATIO_MAP[record.fieldVerified.rdExpenseRatio]}`);
  if (record.fieldVerified.annualRevenue)
    facts.push(`营收 ${REVENUE_MAP[record.fieldVerified.annualRevenue]}`);

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        {/* 意愿徽章 */}
        <span
          className={cn(
            "inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border",
            wMeta.badge,
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", wMeta.dot)} />
          {wMeta.label}
        </span>
        {/* 走访次数 */}
        {recordCount > 1 && (
          <span className="text-[10px] text-purple-700 bg-purple-50 border border-purple-100 px-1.5 py-0.5 rounded-full">
            走访 {recordCount} 次
          </span>
        )}
        <span className="text-[11px] text-[#94a3b8]">
          {record.visitedAt} · {record.visitorName}
        </span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap">
        {facts.slice(0, 3).map((f) => (
          <span
            key={f}
            className="text-[10px] text-[#475569] bg-[#f7f8fa] border border-[#e5e7eb] px-1.5 py-0.5 rounded"
          >
            {f}
          </span>
        ))}
        {record.acknowledgedGaps[0] && (
          <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded truncate max-w-[140px]" title={record.acknowledgedGaps[0]}>
            障碍 · {record.acknowledgedGaps[0]}
          </span>
        )}
        {record.nextSteps[0] && (
          <span className="text-[10px] text-blue-700 bg-blue-50 border border-blue-100 px-1.5 py-0.5 rounded truncate max-w-[140px]" title={record.nextSteps[0]}>
            下一步 · {record.nextSteps[0]}
          </span>
        )}
      </div>
    </div>
  );
}
