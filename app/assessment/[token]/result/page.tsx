"use client";

import { useEffect, useState, use } from "react";
import { getAssessmentRecordByToken } from "@/lib/assessment-store";
import { DIMENSION_LABELS } from "@/lib/assessment";
import type { AssessmentRecord, AssessmentDimension } from "@/lib/types";
import { getCompanyById } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

const GRADE_META = {
  优秀:   { label: "条件优秀",   color: "text-emerald-700", bg: "bg-emerald-100", ring: "ring-emerald-400" },
  符合:   { label: "符合申报条件", color: "text-blue-700",    bg: "bg-blue-100",    ring: "ring-blue-400"    },
  待培育: { label: "待重点培育",  color: "text-amber-700",   bg: "bg-amber-100",   ring: "ring-amber-400"   },
};

const DIM_COLORS: Record<AssessmentDimension, string> = {
  rd_expense:     "bg-blue-500",
  rd_staff:       "bg-violet-500",
  ip:             "bg-cyan-500",
  hi_tech_revenue:"bg-emerald-500",
  management:     "bg-amber-500",
};

export default function AssessmentResultPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const [record, setRecord] = useState<AssessmentRecord | null | undefined>(undefined);
  const [companyName, setCompanyName] = useState("");

  useEffect(() => {
    const r = getAssessmentRecordByToken(token) ?? null;
    setRecord(r);
    if (r) {
      const c = getCompanyById(r.companyId);
      setCompanyName(c?.name ?? "企业测评");
    }
  }, [token]);

  if (record === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <p className="text-[#94a3b8] text-sm">加载中…</p>
      </div>
    );
  }

  if (!record || !record.score) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-6">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔗</div>
          <p className="text-lg font-semibold text-[#0f172a]">测评结果不存在</p>
          <p className="text-sm text-[#94a3b8]">请先完成测评问卷</p>
        </div>
      </div>
    );
  }

  const { score } = record;
  const grade = GRADE_META[score.grade];

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-[#94a3b8] mb-0.5">高企资质测评 · 结果</p>
          <h1 className="text-base font-bold text-[#0f172a] truncate">{companyName}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        {/* Score card */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 text-center">
          <div
            className={cn(
              "inline-flex items-center justify-center w-24 h-24 rounded-full ring-4 mb-4",
              grade.bg,
              grade.ring,
            )}
          >
            <span className="text-3xl font-bold text-[#0f172a]">{score.total}</span>
          </div>
          <p className={cn("text-lg font-bold", grade.color)}>{grade.label}</p>
          <p className="text-xs text-[#94a3b8] mt-1">综合评分 {score.total} / 100 分</p>
        </div>

        {/* Dimension scores */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 space-y-3">
          <h2 className="text-sm font-semibold text-[#0f172a]">各维度得分</h2>
          {score.dimensionScores.map((d) => (
            <div key={d.dimension} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#475569]">{DIMENSION_LABELS[d.dimension]}</span>
                <span className="font-medium text-[#0f172a]">
                  {d.score} / {d.maxScore}
                </span>
              </div>
              <div className="w-full bg-[#f1f5f9] rounded-full h-2 overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all", DIM_COLORS[d.dimension])}
                  style={{ width: `${(d.score / d.maxScore) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Cultivation suggestions */}
        {score.suggestions.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 space-y-3">
            <h2 className="text-sm font-semibold text-[#0f172a]">培育建议</h2>
            {score.suggestions.map((s, i) => (
              <div
                key={i}
                className={cn(
                  "p-4 rounded-xl border",
                  s.urgent ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50",
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={cn(
                      "text-xs font-semibold",
                      s.urgent ? "text-red-700" : "text-amber-700",
                    )}
                  >
                    {s.urgent ? "⚠ 重要" : "建议"}
                  </span>
                  <span className="text-xs font-semibold text-[#0f172a]">{s.title}</span>
                </div>
                <p className="text-xs text-[#475569] leading-relaxed">{s.body}</p>
              </div>
            ))}
          </div>
        )}

        {/* Footer */}
        <p className="text-center text-xs text-[#94a3b8] py-2">
          测评结果已同步至主管部门系统
        </p>
      </div>
    </div>
  );
}
