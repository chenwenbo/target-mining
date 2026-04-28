"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";
import { getAllTasks } from "@/lib/mock-data";
import { getAssessmentRecords } from "@/lib/assessment-store";
import { DIMENSION_LABELS } from "@/lib/assessment";
import type { AssessmentRecord, AssessmentDimension } from "@/lib/types";
import { cn } from "@/lib/cn";

const GRADE_META = {
  优秀:   { label: "条件优秀",   color: "text-emerald-700 bg-emerald-100 border-emerald-300" },
  符合:   { label: "符合申报条件", color: "text-blue-700 bg-blue-100 border-blue-300"    },
  待培育: { label: "待重点培育",  color: "text-amber-700 bg-amber-100 border-amber-300"   },
};

const DIM_COLORS: Record<AssessmentDimension, string> = {
  rd_expense:     "bg-blue-500",
  rd_staff:       "bg-violet-500",
  ip:             "bg-cyan-500",
  hi_tech_revenue:"bg-emerald-500",
  management:     "bg-amber-500",
};

export default function AssessmentSuccessPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<AssessmentRecord | null>(null);

  useEffect(() => {
    const task = getAllTasks().find((t) => t.id === id);
    if (!task) return;
    const records = getAssessmentRecords().filter(
      (r) => r.companyId === task.companyId && r.status === "completed",
    );
    if (records.length > 0) {
      setRecord(
        records.sort(
          (a, b) =>
            new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime(),
        )[0],
      );
    }
  }, [id]);

  const task = getAllTasks().find((t) => t.id === id);
  const allTasksByAssignee = task
    ? getAllTasks().filter((t) => t.assignee === task.assignee && t.id !== id)
    : [];
  const nextTask = allTasksByAssignee.find((t) => t.status === "pending");

  const score = record?.score;

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Success header */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <CheckCircle2 size={44} className="text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">测评已提交</h1>
        <p className="text-blue-200 text-sm">测评结果已同步至管理端</p>
      </div>

      {/* Score summary */}
      {score && (
        <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-800">
              {task?.companyName}
            </span>
            <span
              className={cn(
                "text-xs font-semibold px-2.5 py-1 rounded-full border",
                GRADE_META[score.grade].color,
              )}
            >
              {GRADE_META[score.grade].label}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-3xl font-bold text-gray-900">{score.total}</span>
            <span className="text-sm text-gray-400">/ 100 分</span>
          </div>

          <div className="space-y-2 pt-1">
            {score.dimensionScores.map((d) => (
              <div key={d.dimension} className="flex items-center gap-2">
                <span className="text-xs text-gray-500 w-16 flex-shrink-0">
                  {DIMENSION_LABELS[d.dimension]}
                </span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full", DIM_COLORS[d.dimension])}
                    style={{ width: `${(d.score / d.maxScore) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-500 w-10 text-right">
                  {d.score}/{d.maxScore}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="px-4 space-y-3">
        <Link href="/mobile/tasks">
          <button className="w-full bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl active:scale-[0.98] transition-transform">
            返回任务列表
          </button>
        </Link>

        {nextTask && (
          <Link href={`/mobile/tasks/${nextTask.id}`}>
            <button className="w-full border border-blue-200 text-blue-600 font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform">
              继续走访下一家
              <ChevronRight size={16} />
            </button>
          </Link>
        )}

        <Link href={`/mobile/tasks/${id}`}>
          <button className="w-full text-gray-400 font-medium text-sm py-2 flex items-center justify-center gap-1">
            <ArrowLeft size={14} />
            返回当前任务
          </button>
        </Link>
      </div>
    </div>
  );
}
