"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllTasks } from "@/lib/mock-data";
import { getCurrentVisitor, getVisitRecords, getTaskStatusOverrides } from "@/lib/mobile-mock";
import type { Visitor, TaskStatus } from "@/lib/types";
import { BarChart2, Users, CheckCircle2, TrendingUp, Clock } from "lucide-react";

const WILLINGNESS_MAP: Record<string, { label: string; color: string; bar: string }> = {
  strong:      { label: "意愿强烈",   color: "text-emerald-600", bar: "bg-emerald-500" },
  moderate:    { label: "有一定意愿", color: "text-blue-600",    bar: "bg-blue-500" },
  hesitant:    { label: "态度观望",   color: "text-amber-600",   bar: "bg-amber-400" },
  refused:     { label: "明确拒绝",   color: "text-red-500",     bar: "bg-red-400" },
  unreachable: { label: "无法联系",   color: "text-gray-400",    bar: "bg-gray-300" },
};

export default function StatsPage() {
  const router = useRouter();
  const [visitor, setVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    const v = getCurrentVisitor();
    if (!v) { router.replace("/mobile/login"); return; }
    setVisitor(v);
  }, [router]);

  if (!visitor) return null;

  const overrides = getTaskStatusOverrides();
  const myTasks = getAllTasks()
    .filter((t) => t.assignee === visitor.name)
    .map((t) => ({ ...t, status: (overrides[t.id] ?? t.status) as TaskStatus }));

  const allRecords = getVisitRecords().filter((r) => r.visitorId === visitor.id);

  const visitedCompanies = new Set(allRecords.map((r) => r.companyId)).size;
  const doneCount = myTasks.filter((t) => t.status === "done").length;
  const completionRate = myTasks.length > 0 ? Math.round((doneCount / myTasks.length) * 100) : 0;
  const willingCount = allRecords.filter((r) => r.willingness === "strong" || r.willingness === "moderate").length;
  const avgDuration = allRecords.length > 0
    ? Math.round(allRecords.filter((r) => r.visitDurationMinutes).reduce((s, r) => s + (r.visitDurationMinutes ?? 0), 0) / allRecords.filter((r) => r.visitDurationMinutes).length || 0)
    : 0;

  // 意愿分布
  const willingnessCount: Record<string, number> = {};
  for (const r of allRecords) {
    willingnessCount[r.willingness] = (willingnessCount[r.willingness] ?? 0) + 1;
  }
  const maxWilling = Math.max(1, ...Object.values(willingnessCount));

  // 各分级完成情况
  const tierStats = (["A", "B", "C"] as const).map((tier) => {
    const tierTasks = myTasks.filter((t) => t.tier === tier);
    const done = tierTasks.filter((t) => t.status === "done").length;
    return { tier, total: tierTasks.length, done };
  });

  const tierColors: Record<string, string> = { A: "bg-emerald-500", B: "bg-blue-500", C: "bg-amber-400" };
  const tierBg:     Record<string, string> = { A: "text-emerald-700 bg-emerald-50", B: "text-blue-700 bg-blue-50", C: "text-amber-700 bg-amber-50" };

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-blue-600 px-4 pt-3 pb-5">
        <h1 className="text-white font-semibold text-base pt-2 mb-0.5">走访统计</h1>
        <p className="text-blue-200 text-xs">{visitor.name} · {visitor.dept}</p>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* KPI 卡片 */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users,        label: "已走访企业",  value: visitedCompanies, unit: "家",  color: "text-blue-600",    bg: "bg-blue-50" },
            { icon: CheckCircle2, label: "任务完成率",  value: completionRate,   unit: "%",  color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: TrendingUp,   label: "有申报意愿",  value: willingCount,     unit: "家",  color: "text-purple-600",  bg: "bg-purple-50" },
            { icon: Clock,        label: "平均走访时长", value: avgDuration || "-", unit: avgDuration ? "分钟" : "", color: "text-amber-600", bg: "bg-amber-50" },
          ].map(({ icon: Icon, label, value, unit, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon size={16} className={color} />
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-2xl font-bold ${color}`}>{value}</span>
                <span className="text-xs text-gray-400 mb-0.5">{unit}</span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* 意愿分布 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <BarChart2 size={12} />
            申报意愿分布
          </h3>
          {allRecords.length === 0 ? (
            <p className="text-xs text-gray-400 text-center py-4">暂无走访记录</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(WILLINGNESS_MAP).map(([key, { label, color, bar }]) => {
                const count = willingnessCount[key] ?? 0;
                const pct = allRecords.length > 0 ? Math.round((count / allRecords.length) * 100) : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${color}`}>{label}</span>
                      <span className="text-xs text-gray-400">{count} 家 · {pct}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${bar}`} style={{ width: `${(count / maxWilling) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 各分级任务完成情况 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">各分级任务完成情况</h3>
          {tierStats.every((s) => s.total === 0) ? (
            <p className="text-xs text-gray-400 text-center py-4">暂无分配任务</p>
          ) : (
            <div className="space-y-4">
              {tierStats.filter((s) => s.total > 0).map(({ tier, total, done }) => (
                <div key={tier}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${tierBg[tier]}`}>{tier} 类</span>
                    <span className="text-xs text-gray-400">{done}/{total} 已完成</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tierColors[tier]}`}
                      style={{ width: `${(done / total) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 任务总览 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">任务总览</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { label: "待走访", count: myTasks.filter((t) => t.status === "pending").length, color: "text-gray-600" },
              { label: "进行中", count: myTasks.filter((t) => t.status === "in_progress").length, color: "text-blue-600" },
              { label: "已完成", count: doneCount, color: "text-emerald-600" },
            ].map(({ label, count, color }) => (
              <div key={label} className="bg-gray-50 rounded-lg py-3">
                <div className={`text-2xl font-bold ${color}`}>{count}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
