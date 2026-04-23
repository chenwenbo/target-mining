"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAllTasks } from "@/lib/mock-data";
import { getVisitRecordsByTask } from "@/lib/mobile-mock";
import type { VisitRecord } from "@/lib/types";
import { CheckCircle2, ChevronRight, ArrowLeft } from "lucide-react";

const WILLINGNESS_MAP: Record<string, { label: string; color: string }> = {
  strong:      { label: "意愿强烈",   color: "text-emerald-600 bg-emerald-50 border-emerald-200" },
  moderate:    { label: "有一定意愿", color: "text-blue-600 bg-blue-50 border-blue-200" },
  hesitant:    { label: "态度观望",   color: "text-amber-600 bg-amber-50 border-amber-200" },
  refused:     { label: "明确拒绝",   color: "text-red-600 bg-red-50 border-red-200" },
  unreachable: { label: "无法联系",   color: "text-gray-500 bg-gray-50 border-gray-200" },
};

export default function VisitSuccessPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<VisitRecord | null>(null);

  useEffect(() => {
    const records = getVisitRecordsByTask(id);
    if (records.length > 0) {
      setRecord(records.sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0]);
    }
  }, [id]);

  const task = getAllTasks().find((t) => t.id === id);
  if (!task) return null;

  const w = record ? (WILLINGNESS_MAP[record.willingness] ?? { label: "-", color: "text-gray-400 bg-gray-50 border-gray-200" }) : null;

  // 下一条待走访任务（用于快捷跳转）
  const allTasksByAssignee = getAllTasks().filter((t) => t.assignee === task.assignee && t.id !== id);
  const nextTask = allTasksByAssignee.find((t) => t.status === "pending");

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* 成功区域 */}
      <div className="bg-gradient-to-b from-blue-600 to-blue-700 px-6 pt-16 pb-12 flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4">
          <CheckCircle2 size={44} className="text-white" strokeWidth={1.5} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-1">走访记录已提交</h1>
        <p className="text-blue-200 text-sm">任务状态已更新为「进行中」</p>
      </div>

      {/* 走访摘要卡片 */}
      {record && w && (
        <div className="mx-4 -mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
          <h2 className="font-semibold text-gray-800 text-sm mb-3 truncate">{task.companyName}</h2>
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">走访日期</span>
              <span className="text-xs font-medium text-gray-700">{record.visitedAt}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">走访人员</span>
              <span className="text-xs font-medium text-gray-700">{record.visitorName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-400">申报意愿</span>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${w.color}`}>{w.label}</span>
            </div>
            {record.followUpDate && (
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-400">约定下次联系</span>
                <span className="text-xs font-medium text-gray-700">{record.followUpDate}</span>
              </div>
            )}
            {record.nextSteps.length > 0 && (
              <div>
                <span className="text-xs text-gray-400 block mb-1.5">后续行动</span>
                <div className="flex flex-wrap gap-1">
                  {record.nextSteps.map((s) => (
                    <span key={s} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
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
            查看本次走访记录
          </button>
        </Link>
      </div>
    </div>
  );
}
