"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getAllTasks } from "@/lib/mock-data";
import { getCurrentVisitor, getVisitRecords, getTaskStatusOverrides, initSeedVisitRecords, getDispatchedTasks, getCustomTasks } from "@/lib/mobile-mock";
import type { Visitor, TaskStatus, VisitRecord, QualificationType } from "@/lib/types";
import { QUAL_TYPES, QUAL_TYPE_META } from "@/lib/types";
import { BarChart2, Users, CheckCircle2, TrendingUp } from "lucide-react";

const WILLINGNESS_MAP: Record<string, { label: string; color: string; bar: string }> = {
  strong:      { label: "意愿强烈",   color: "text-emerald-600", bar: "bg-emerald-500" },
  moderate:    { label: "有一定意愿", color: "text-blue-600",    bar: "bg-blue-500" },
  hesitant:    { label: "态度观望",   color: "text-amber-600",   bar: "bg-amber-400" },
  refused:     { label: "明确拒绝",   color: "text-red-500",     bar: "bg-red-400" },
  unreachable: { label: "无法联系",   color: "text-gray-400",    bar: "bg-gray-300" },
};

const QUAL_TAB_ACTIVE: Record<QualificationType, string> = {
  high_tech:       "bg-blue-600 text-white",
  innovative_sme:  "bg-violet-600 text-white",
  specialized_sme: "bg-amber-500 text-white",
  little_giant:    "bg-rose-500 text-white",
};

const QUAL_TAB_INACTIVE: Record<QualificationType, string> = {
  high_tech:       "text-blue-600",
  innovative_sme:  "text-violet-600",
  specialized_sme: "text-amber-600",
  little_giant:    "text-rose-500",
};

interface StatsState {
  allRecords: VisitRecord[];
  visitedCompanies: number;
  doneCount: number;
  completionRate: number;
  willingCount: number;
  willingnessCount: Record<string, number>;
  maxWilling: number;
  pendingCount: number;
  totalTasks: number;
}

function computeStats(
  visitorId: string,
  visitorName: string,
  visitorStreet: string | undefined,
  qualFilter: QualificationType | "all",
): StatsState {
  const overrides = getTaskStatusOverrides();
  const allTasksRaw = [...getAllTasks(), ...getDispatchedTasks(), ...getCustomTasks()];

  // Build taskId → qualType lookup for visit record filtering
  const taskQualMap: Record<string, QualificationType> = {};
  for (const t of allTasksRaw) {
    taskQualMap[t.id] = (t.qualType ?? "high_tech") as QualificationType;
  }

  const myTasks = allTasksRaw
    .filter((t) => visitorStreet ? t.street === visitorStreet : t.assignee === visitorName)
    .map((t) => ({ ...t, status: (overrides[t.id] ?? t.status) as TaskStatus }));

  const filteredTasks = qualFilter === "all"
    ? myTasks
    : myTasks.filter((t) => (t.qualType ?? "high_tech") === qualFilter);

  const myRecords = getVisitRecords().filter((r) => r.visitorId === visitorId);
  const filteredRecords = qualFilter === "all"
    ? myRecords
    : myRecords.filter((r) => {
        const q = r.qualType ?? taskQualMap[r.taskId] ?? "high_tech";
        return q === qualFilter;
      });

  const visitedCompanies = new Set(filteredRecords.map((r) => r.companyId)).size;
  const doneCount = filteredTasks.filter((t) => t.status === "done").length;
  const completionRate = filteredTasks.length > 0 ? Math.round((doneCount / filteredTasks.length) * 100) : 0;
  const willingCount = filteredRecords.filter((r) => r.willingness === "strong" || r.willingness === "moderate").length;
  const willingnessCount: Record<string, number> = {};
  for (const r of filteredRecords) {
    willingnessCount[r.willingness] = (willingnessCount[r.willingness] ?? 0) + 1;
  }
  return {
    allRecords: filteredRecords,
    visitedCompanies,
    doneCount,
    completionRate,
    willingCount,
    willingnessCount,
    maxWilling: Math.max(1, ...Object.values(willingnessCount)),
    pendingCount: filteredTasks.filter((t) => t.status === "pending").length,
    totalTasks: filteredTasks.length,
  };
}

export default function StatsPage() {
  const router = useRouter();
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [activeQual, setActiveQual] = useState<QualificationType | "all">("all");
  const [stats, setStats] = useState<StatsState | null>(null);

  useEffect(() => {
    const v = getCurrentVisitor();
    if (!v) { router.replace("/mobile/login"); return; }
    initSeedVisitRecords();
    setVisitor(v);
    setStats(computeStats(v.id, v.name, v.street ?? undefined, "all"));
  }, [router]);

  useEffect(() => {
    if (!visitor) return;
    setStats(computeStats(visitor.id, visitor.name, visitor.street ?? undefined, activeQual));
  }, [activeQual, visitor]);

  if (!visitor || !stats) return null;

  const { allRecords, visitedCompanies, doneCount, completionRate, willingCount, willingnessCount, maxWilling, pendingCount, totalTasks } = stats;

  const tabs: Array<{ key: QualificationType | "all"; label: string }> = [
    { key: "all", label: "全部" },
    ...QUAL_TYPES.map((q) => ({ key: q as QualificationType, label: QUAL_TYPE_META[q].shortLabel })),
  ];

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-blue-600 px-4 pt-3 pb-5">
        <h1 className="text-white font-semibold text-base pt-2 mb-0.5">走访统计</h1>
        <p className="text-blue-200 text-xs">{visitor.name} · {visitor.dept}</p>
      </div>

      {/* Qualification filter tabs */}
      <div className="bg-white border-b border-gray-100 px-3 py-2.5 flex gap-2 overflow-x-auto">
        {tabs.map(({ key, label }) => {
          const isActive = activeQual === key;
          let cls: string;
          if (key === "all") {
            cls = isActive ? "bg-gray-700 text-white" : "text-gray-500 bg-gray-100";
          } else {
            cls = isActive
              ? QUAL_TAB_ACTIVE[key as QualificationType]
              : `${QUAL_TAB_INACTIVE[key as QualificationType]} bg-gray-100`;
          }
          return (
            <button
              key={key}
              onClick={() => setActiveQual(key)}
              className={`flex-shrink-0 px-3.5 py-1 rounded-full text-xs font-medium transition-colors ${cls}`}
            >
              {label}
            </button>
          );
        })}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* KPI 卡片 */}
        <div className="grid grid-cols-3 gap-2">
          {[
            { icon: Users,        label: "已走访企业", value: visitedCompanies, unit: "家", color: "text-blue-600",    bg: "bg-blue-50" },
            { icon: CheckCircle2, label: "任务完成率", value: completionRate,   unit: "%",  color: "text-emerald-600", bg: "bg-emerald-50" },
            { icon: TrendingUp,   label: "有申报意愿", value: willingCount,     unit: "家", color: "text-purple-600",  bg: "bg-purple-50" },
          ].map(({ icon: Icon, label, value, unit, color, bg }) => (
            <div key={label} className="bg-white rounded-xl p-3">
              <div className={`w-7 h-7 rounded-lg ${bg} flex items-center justify-center mb-2`}>
                <Icon size={15} className={color} />
              </div>
              <div className="flex items-end gap-1">
                <span className={`text-xl font-bold ${color}`}>{value}</span>
                <span className="text-xs text-gray-400 mb-0.5">{unit}</span>
              </div>
              <p className="text-[11px] text-gray-400 mt-0.5 whitespace-nowrap">{label}</p>
            </div>
          ))}
        </div>

        {/* 意愿分布 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <BarChart2 size={12} />
            申报意愿分布
            {activeQual !== "all" && (
              <span className="ml-1 text-gray-400 normal-case font-normal">
                · {QUAL_TYPE_META[activeQual as QualificationType].label}
              </span>
            )}
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

        {/* 任务总览 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            任务总览
            {activeQual !== "all" && (
              <span className="ml-1 text-gray-400 normal-case font-normal">
                · {QUAL_TYPE_META[activeQual as QualificationType].label}
              </span>
            )}
          </h3>
          {totalTasks === 0 ? (
            <p className="text-xs text-gray-400 text-center py-3">该资质暂无摸排任务</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 text-center">
              {[
                { label: "待摸排",  count: pendingCount, color: "text-gray-600" },
                { label: "摸排完成", count: doneCount,   color: "text-emerald-600" },
              ].map(({ label, count, color }) => (
                <div key={label} className="bg-gray-50 rounded-lg py-3">
                  <div className={`text-2xl font-bold ${color}`}>{count}</div>
                  <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
