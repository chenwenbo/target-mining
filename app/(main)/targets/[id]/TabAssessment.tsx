"use client";

import { useState, useEffect } from "react";
import {
  Copy,
  Check,
  QrCode,
  ClipboardList,
  RefreshCcw,
  X,
  Sparkles,
  TrendingUp,
  AlertTriangle,
  ListChecks,
  Eye,
} from "lucide-react";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import {
  generateToken,
  buildShareUrl,
  saveAssessmentRecord,
  getLatestCompletedByCompany,
  getLatestPendingByCompany,
} from "@/lib/assessment-store";
import {
  ASSESSMENT_QUESTIONS,
  DIMENSION_LABELS,
  generateAiAnalysis,
  type AiAnalysis,
} from "@/lib/assessment";
import type {
  Company,
  AssessmentRecord,
  AssessmentScore,
  AssessmentDimension,
} from "@/lib/types";
import { cn } from "@/lib/cn";

const GRADE_META: Record<
  AssessmentScore["grade"],
  { label: string; bg: string; text: string; border: string }
> = {
  优秀:   { label: "条件优秀",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  符合:   { label: "符合申报条件", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  待培育: { label: "待重点培育",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
};

const DIM_COLORS: Record<AssessmentDimension, string> = {
  rd_expense:      "#2563eb",
  rd_staff:        "#7c3aed",
  ip:              "#0891b2",
  hi_tech_revenue: "#059669",
  management:      "#d97706",
};

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const option = {
    series: [
      {
        type: "gauge",
        startAngle: 200,
        endAngle: -20,
        min: 0,
        max: 100,
        splitNumber: 4,
        pointer: { length: "60%", width: 4, itemStyle: { color } },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [
              [0.6, "#ef4444"],
              [0.8, "#f59e0b"],
              [1, "#10b981"],
            ],
          },
        },
        axisTick: { show: false },
        splitLine: { show: false },
        axisLabel: { show: false },
        detail: {
          fontSize: 26,
          fontWeight: "bold",
          color: "#0f172a",
          offsetCenter: [0, "30%"],
          formatter: "{value}",
        },
        data: [{ value: score }],
      },
    ],
  };
  return <EChartsWrapper option={option} height={160} />;
}

function SharePanel({
  shareUrl,
  onRegenerate,
}: {
  shareUrl: string;
  onRegenerate: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`;

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <QrCode size={16} className="text-blue-600" />
          <span className="text-sm font-semibold text-[#0f172a]">测评链接</span>
        </div>
        <button
          onClick={onRegenerate}
          className="flex items-center gap-1 text-xs text-[#94a3b8] hover:text-blue-600 transition-colors"
        >
          <RefreshCcw size={12} />
          重新生成
        </button>
      </div>

      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 border border-[#e5e7eb] rounded-lg overflow-hidden w-[90px] h-[90px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="测评二维码" className="w-full h-full" />
        </div>

        <div className="flex-1 space-y-2">
          <p className="text-xs text-[#64748b]">将二维码或链接发送给企业，扫码即可在手机端填写测评问卷</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 text-xs text-[#475569] bg-[#f7f8fa] border border-[#e5e7eb] rounded-lg px-3 py-2 outline-none truncate"
            />
            <button
              onClick={handleCopy}
              className={cn(
                "flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap",
                copied
                  ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                  : "bg-blue-600 text-white hover:bg-blue-700",
              )}
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? "已复制" : "复制链接"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Assessment detail drawer ──────────────────────────────────────

function AssessmentDrawer({
  record,
  company,
  open,
  onClose,
}: {
  record: AssessmentRecord;
  company: Company;
  open: boolean;
  onClose: () => void;
}) {
  const { answers, score, submittedAt, source } = record;
  if (!answers || !score) return null;

  const dims: AssessmentDimension[] = [
    "rd_expense",
    "rd_staff",
    "ip",
    "hi_tech_revenue",
    "management",
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/30 z-40 transition-opacity duration-300",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "fixed right-0 top-0 bottom-0 w-[480px] bg-white z-50 flex flex-col shadow-2xl transition-transform duration-300",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb] flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">测评原始数据</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">{company.name}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-[#f1f5f9] text-[#64748b] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Meta */}
        <div className="px-6 py-3 bg-[#f8fafc] border-b border-[#e5e7eb] flex-shrink-0">
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <p className="text-[#94a3b8] mb-1">提交时间</p>
              <p className="font-medium text-[#0f172a]">{submittedAt?.slice(0, 10) ?? "—"}</p>
            </div>
            <div>
              <p className="text-[#94a3b8] mb-1">填写方式</p>
              <p className="font-medium text-[#0f172a]">
                {source === "enterprise_self" ? "企业自填" : "工作人员代填"}
              </p>
            </div>
            <div>
              <p className="text-[#94a3b8] mb-1">综合得分</p>
              <p className="font-bold text-[#0f172a]">{score.total} / 100</p>
            </div>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-7">
          {dims.map((dim) => {
            const dimQuestions = ASSESSMENT_QUESTIONS.filter(
              (q) => q.dimension === dim,
            );
            const dimScore = score.dimensionScores.find(
              (d) => d.dimension === dim,
            );

            return (
              <div key={dim}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: DIM_COLORS[dim] }}
                    />
                    {DIMENSION_LABELS[dim]}
                  </h3>
                  {dimScore && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#f1f5f9] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(dimScore.score / dimScore.maxScore) * 100}%`,
                            backgroundColor: DIM_COLORS[dim],
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#475569] w-10 text-right">
                        {dimScore.score}/{dimScore.maxScore}
                      </span>
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {dimQuestions.map((q) => {
                    const selectedValue = answers[q.id];
                    const selectedOpt = q.options.find(
                      (o) => o.value === selectedValue,
                    );

                    return (
                      <div key={q.id} className="bg-[#f8fafc] rounded-xl p-4 border border-[#f1f5f9]">
                        <p className="text-xs font-medium text-[#0f172a] mb-2.5 leading-relaxed">
                          {q.text}
                        </p>
                        {q.hint && (
                          <p className="text-xs text-[#94a3b8] mb-2.5 leading-relaxed bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                            💡 {q.hint}
                          </p>
                        )}
                        <div className="space-y-1.5">
                          {q.options.map((opt) => {
                            const isSelected = opt.value === selectedValue;
                            return (
                              <div
                                key={opt.value}
                                className={cn(
                                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors",
                                  isSelected
                                    ? "bg-blue-600 text-white"
                                    : "bg-white border border-[#e5e7eb] text-[#64748b]",
                                )}
                              >
                                <span>{opt.label}</span>
                                {!q.isQualifier && (
                                  <span
                                    className={cn(
                                      "font-semibold ml-2 flex-shrink-0",
                                      isSelected
                                        ? "text-blue-100"
                                        : "text-[#94a3b8]",
                                    )}
                                  >
                                    {opt.score > 0 ? `+${opt.score}` : "0"} 分
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                        {!selectedOpt && (
                          <p className="text-xs text-amber-600 mt-2">未作答</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── AI analysis panel ─────────────────────────────────────────────

function ProbabilityRing({ value }: { value: number }) {
  const color =
    value >= 70 ? "#10b981" : value >= 45 ? "#f59e0b" : "#ef4444";
  const deg = Math.round(value * 3.6);
  return (
    <div
      className="relative w-16 h-16 rounded-full flex items-center justify-center flex-shrink-0"
      style={{
        background: `conic-gradient(${color} ${deg}deg, #e2e8f0 0deg)`,
      }}
    >
      <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center">
        <span className="text-sm font-bold text-[#0f172a]">{value}%</span>
      </div>
    </div>
  );
}

function AiAnalysisPanel({ analysis }: { analysis: AiAnalysis }) {
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-white" />
          <span className="text-white font-semibold text-sm">AI 智能分析</span>
        </div>
        <span className="text-xs text-blue-100 bg-white/20 px-2 py-0.5 rounded-full">
          由 AI 生成
        </span>
      </div>

      <div className="p-5 space-y-5">
        {/* Summary */}
        <p className="text-sm text-[#475569] leading-relaxed bg-[#f8fafc] rounded-xl p-4 border border-[#f1f5f9]">
          {analysis.summary}
        </p>

        {/* Probability */}
        <div className="flex items-center gap-4 p-4 rounded-xl border border-[#e5e7eb]">
          <ProbabilityRing value={analysis.certProbability} />
          <div>
            <p className="text-sm font-semibold text-[#0f172a]">认定可能性评估</p>
            <p className="text-xs text-[#64748b] mt-0.5">
              {analysis.certProbability >= 80
                ? "综合条件良好，认定成功率高"
                : analysis.certProbability >= 60
                ? "基本满足条件，建议继续优化"
                : analysis.certProbability >= 40
                ? "存在明显差距，需重点培育"
                : "距认定标准较远，需系统性提升"}
            </p>
          </div>
        </div>

        {/* Strengths + Risks */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
              <TrendingUp size={12} />
              优势项
            </h4>
            {analysis.strengths.length > 0 ? (
              analysis.strengths.map((s, i) => (
                <div
                  key={i}
                  className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl"
                >
                  <p className="text-xs font-semibold text-emerald-800 mb-1">
                    {s.title}
                  </p>
                  <p className="text-xs text-emerald-700 leading-relaxed">{s.body}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#94a3b8] italic">暂无明显优势项</p>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-semibold text-red-600 flex items-center gap-1.5">
              <AlertTriangle size={12} />
              风险项
            </h4>
            {analysis.risks.length > 0 ? (
              analysis.risks.map((r, i) => (
                <div
                  key={i}
                  className="p-3 bg-red-50 border border-red-100 rounded-xl"
                >
                  <p className="text-xs font-semibold text-red-800 mb-1">
                    {r.title}
                  </p>
                  <p className="text-xs text-red-700 leading-relaxed">{r.body}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-[#94a3b8] italic">暂无明显风险项</p>
            )}
          </div>
        </div>

        {/* Roadmap */}
        <div>
          <h4 className="text-xs font-semibold text-[#0f172a] mb-3 flex items-center gap-1.5">
            <ListChecks size={13} className="text-blue-600" />
            行动路线图
          </h4>
          <div className="space-y-1">
            {analysis.roadmap.map((phase, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {i + 1}
                  </div>
                  {i < analysis.roadmap.length - 1 && (
                    <div className="w-px flex-1 bg-[#e2e8f0] my-1 min-h-[16px]" />
                  )}
                </div>
                <div className="pb-4">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs font-semibold text-[#0f172a]">
                      {phase.phase}
                    </span>
                    <span className="text-xs text-[#94a3b8] bg-[#f1f5f9] px-2 py-0.5 rounded-full">
                      {phase.timeframe}
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {phase.actions.map((action, j) => (
                      <li
                        key={j}
                        className="text-xs text-[#64748b] flex items-start gap-1.5"
                      >
                        <span className="text-blue-400 mt-0.5 flex-shrink-0">•</span>
                        {action}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function TabAssessment({ company }: { company: Company }) {
  const [completed, setCompleted] = useState<AssessmentRecord | null>(null);
  const [pending, setPending] = useState<AssessmentRecord | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    setCompleted(getLatestCompletedByCompany(company.id) ?? null);
    const p = getLatestPendingByCompany(company.id) ?? null;
    setPending(p);
    if (p) setShareUrl(buildShareUrl(p.token));
  }, [company.id]);

  function handleGenerate() {
    const token = generateToken();
    const record: AssessmentRecord = {
      id: `ar_${Date.now()}`,
      companyId: company.id,
      token,
      source: "enterprise_self",
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    saveAssessmentRecord(record);
    setPending(record);
    setShareUrl(buildShareUrl(token));
  }

  const score = completed?.score;
  const aiAnalysis =
    score && completed?.answers
      ? generateAiAnalysis(score, completed.answers)
      : null;

  return (
    <div className="space-y-6">
      {/* ── Status overview ── */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
          <ClipboardList size={15} className="text-blue-600" />
          测评状态
        </h3>

        {completed ? (
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-[#94a3b8] mb-1">发起时间</p>
              <p className="text-[#0f172a] font-medium text-xs">
                {completed.createdAt.slice(0, 10)}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8] mb-1">填写方式</p>
              <p className="text-[#0f172a] font-medium text-xs">
                {completed.source === "enterprise_self" ? "企业自填" : "工作人员代填"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8] mb-1">提交时间</p>
              <p className="text-[#0f172a] font-medium text-xs">
                {completed.submittedAt?.slice(0, 10) ?? "—"}
              </p>
            </div>
            <div>
              <p className="text-xs text-[#94a3b8] mb-1">状态</p>
              <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                已完成
              </span>
            </div>
          </div>
        ) : (
          <p className="text-sm text-[#94a3b8]">尚未发起测评，点击下方按钮生成测评链接</p>
        )}
      </div>

      {/* ── Share panel ── */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#0f172a]">发起测评</h3>
          {completed && (
            <span className="text-xs text-[#94a3b8]">已有测评结果，可重新生成链接发起新一轮</span>
          )}
        </div>

        {pending || completed ? (
          <SharePanel
            shareUrl={shareUrl || buildShareUrl(pending?.token ?? completed?.token ?? "")}
            onRegenerate={handleGenerate}
          />
        ) : (
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white rounded-xl py-3 text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <QrCode size={16} />
            生成测评链接
          </button>
        )}
      </div>

      {/* ── Results ── */}
      {score && (
        <>
          {/* Grade + gauge */}
          <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-[#0f172a]">测评结果</h3>
              <button
                onClick={() => setDrawerOpen(true)}
                className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Eye size={13} />
                查看答题详情
              </button>
            </div>
            <div className="flex items-center gap-6">
              <div className="w-48 flex-shrink-0">
                <ScoreGauge score={score.total} />
              </div>
              <div className="flex-1 space-y-3">
                <div>
                  <span
                    className={cn(
                      "inline-block px-3 py-1 rounded-full text-sm font-semibold border",
                      GRADE_META[score.grade].bg,
                      GRADE_META[score.grade].text,
                      GRADE_META[score.grade].border,
                    )}
                  >
                    {GRADE_META[score.grade].label}
                  </span>
                  <p className="text-xs text-[#94a3b8] mt-1">综合得分 {score.total} / 100</p>
                </div>

                <div className="space-y-2">
                  {score.dimensionScores.map((d) => (
                    <div key={d.dimension} className="flex items-center gap-3">
                      <span className="text-xs text-[#64748b] w-16 flex-shrink-0">{d.label}</span>
                      <div className="flex-1 bg-[#f1f5f9] rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${(d.score / d.maxScore) * 100}%`,
                            backgroundColor: DIM_COLORS[d.dimension],
                          }}
                        />
                      </div>
                      <span className="text-xs font-medium text-[#0f172a] w-12 text-right">
                        {d.score}/{d.maxScore}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* AI analysis */}
          {aiAnalysis && <AiAnalysisPanel analysis={aiAnalysis} />}

          {/* Cultivation suggestions */}
          {score.suggestions.length > 0 && (
            <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">培育建议</h3>
              {score.suggestions.map((s, i) => (
                <div
                  key={i}
                  className={cn(
                    "p-4 rounded-xl border",
                    s.urgent
                      ? "border-red-200 bg-red-50"
                      : "border-amber-200 bg-amber-50",
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
                    <span className="text-xs font-semibold text-[#0f172a]">
                      {s.title}
                    </span>
                  </div>
                  <p className="text-xs text-[#475569] leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Detail drawer ── */}
      {completed && (
        <AssessmentDrawer
          record={completed}
          company={company}
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
        />
      )}
    </div>
  );
}
