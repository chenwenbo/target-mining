"use client";

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Copy,
  Check,
  QrCode,
  ClipboardList,
  RefreshCcw,
  X,
  Sparkles,
  Eye,
  Download,
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
  getAssessmentConfig,
  generateAiAnalysis,
  type AiAnalysis,
} from "@/lib/assessment";
import type {
  Company,
  AssessmentRecord,
  AssessmentScore,
} from "@/lib/types";
import { useQualStore } from "@/lib/qual-store";
import { cn } from "@/lib/cn";

const GRADE_META: Record<
  AssessmentScore["grade"],
  { label: string; bg: string; text: string; border: string }
> = {
  优秀:   { label: "条件优秀",    bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  符合:   { label: "符合申报条件", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  待培育: { label: "待重点培育",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
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

  const config = getAssessmentConfig(record.qualType);
  const dimColors = Object.fromEntries(
    config.dimensions.map((d) => [d.id, d.color]),
  );

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
          {config.dimensions.map((dimDef) => {
            const dim = dimDef.id;
            const dimQuestions = config.questions.filter(
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
                      style={{ backgroundColor: dimColors[dim] }}
                    />
                    {dimDef.label}
                  </h3>
                  {dimScore && (
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-[#f1f5f9] rounded-full h-1.5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${(dimScore.score / dimScore.maxScore) * 100}%`,
                            backgroundColor: dimColors[dim],
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

// ── AI analysis helpers ───────────────────────────────────────────

function aiAnalysisToMarkdown(analysis: AiAnalysis): string {
  const { summary, certProbability, strengths, risks, roadmap } = analysis;
  const NUMS = ["一", "二", "三", "四"];
  const lines: string[] = [];

  lines.push(summary);
  lines.push("");

  const probLabel =
    certProbability >= 80
      ? "综合条件良好，认定成功率高"
      : certProbability >= 60
      ? "基本满足条件，建议继续优化"
      : certProbability >= 40
      ? "存在明显差距，需重点培育"
      : "距认定标准较远，需系统性提升";
  lines.push(
    `> 认定可能性综合评估：**${certProbability}%** — ${probLabel}`,
  );
  lines.push("");

  if (strengths.length > 0) {
    lines.push("## ✅ 优势维度");
    lines.push("");
    for (const s of strengths) {
      lines.push(`**${s.title}**`);
      lines.push("");
      lines.push(s.body);
      lines.push("");
    }
  }

  if (risks.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## ⚠️ 风险维度");
    lines.push("");
    for (const r of risks) {
      lines.push(`**${r.title}**`);
      lines.push("");
      lines.push(r.body);
      lines.push("");
    }
  }

  if (roadmap.length > 0) {
    lines.push("---");
    lines.push("");
    lines.push("## 📋 行动路线图");
    lines.push("");
    roadmap.forEach((phase, i) => {
      lines.push(
        `**第${NUMS[i] ?? i + 1}阶段：${phase.phase}**（${phase.timeframe}）`,
      );
      lines.push("");
      for (const action of phase.actions) {
        lines.push(`- ${action}`);
      }
      lines.push("");
    });
  }

  return lines.join("\n");
}

function exportAssessmentReport(
  company: Company,
  record: AssessmentRecord,
  analysis: AiAnalysis,
) {
  const { score } = record;
  if (!score) return;

  const config = getAssessmentConfig(record.qualType);
  const markdown = aiAnalysisToMarkdown(analysis);

  const dimRows = score.dimensionScores
    .map(
      (d) => `
      <tr>
        <td>${d.label}</td>
        <td>${d.score} / ${d.maxScore}</td>
        <td>
          <div class="bar-track">
            <div class="bar-fill" style="width:${Math.round((d.score / d.maxScore) * 100)}%"></div>
          </div>
        </td>
      </tr>`,
    )
    .join("");

  const mdHtml = markdown
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^---$/gm, "<hr>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/^- (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/^(?!<[hublpi])/gm, "")
    .split("\n")
    .filter(Boolean)
    .map((l) =>
      l.startsWith("<") ? l : `<p>${l}</p>`,
    )
    .join("\n");

  const gradeMeta: Record<string, { label: string; color: string }> = {
    优秀:   { label: "条件优秀",    color: "#059669" },
    符合:   { label: "符合申报条件", color: "#2563eb" },
    待培育: { label: "待重点培育",   color: "#d97706" },
  };
  const gm = gradeMeta[score.grade] ?? { label: score.grade, color: "#64748b" };

  const suggestionHtml = score.suggestions
    .map(
      (s) => `
      <div class="suggestion ${s.urgent ? "urgent" : ""}">
        <strong>${s.urgent ? "⚠ 重要 · " : ""}${s.title}</strong>
        <p>${s.body}</p>
      </div>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<title>${config.reportTitle} · ${company.name}</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", "Helvetica Neue", sans-serif;
    color: #0f172a;
    background: #fff;
    padding: 48px 56px;
    max-width: 860px;
    margin: 0 auto;
    font-size: 14px;
    line-height: 1.7;
  }
  .report-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    border-bottom: 2px solid #0f172a;
    padding-bottom: 20px;
    margin-bottom: 28px;
  }
  .report-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
  .report-meta { font-size: 12px; color: #64748b; }
  .grade-badge {
    padding: 6px 14px;
    border-radius: 9999px;
    font-size: 13px;
    font-weight: 600;
    color: white;
    background: ${gm.color};
  }
  .score-section {
    display: flex;
    gap: 32px;
    align-items: center;
    padding: 20px 24px;
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    margin-bottom: 24px;
  }
  .score-total { font-size: 48px; font-weight: 800; color: ${gm.color}; line-height: 1; }
  .score-label { font-size: 12px; color: #64748b; margin-top: 4px; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 8px 0; font-size: 13px; }
  td:first-child { width: 80px; color: #475569; }
  td:nth-child(2) { width: 60px; font-weight: 600; color: #0f172a; text-align: right; padding-right: 12px; }
  .bar-track { background: #e2e8f0; border-radius: 99px; height: 6px; overflow: hidden; }
  .bar-fill { height: 100%; background: ${gm.color}; border-radius: 99px; }
  h2.section-title {
    font-size: 15px;
    font-weight: 700;
    color: #0f172a;
    margin: 28px 0 12px;
    padding-bottom: 8px;
    border-bottom: 1px solid #e2e8f0;
  }
  h2 { font-size: 14px; font-weight: 700; color: #0f172a; margin: 20px 0 8px; }
  hr { border: none; border-top: 1px solid #e2e8f0; margin: 16px 0; }
  blockquote {
    border-left: 4px solid #2563eb;
    background: #eff6ff;
    padding: 10px 14px;
    border-radius: 0 8px 8px 0;
    margin: 12px 0;
    font-size: 13px;
    color: #1e40af;
  }
  p { margin: 8px 0; color: #475569; }
  strong { color: #0f172a; }
  ul { margin: 8px 0 8px 16px; }
  li { color: #475569; margin: 4px 0; font-size: 13px; }
  .suggestion {
    padding: 12px 16px;
    border: 1px solid #fef3c7;
    background: #fffbeb;
    border-radius: 8px;
    margin-bottom: 10px;
  }
  .suggestion.urgent {
    border-color: #fecaca;
    background: #fef2f2;
  }
  .suggestion strong { display: block; margin-bottom: 4px; font-size: 13px; }
  .suggestion p { margin: 0; font-size: 13px; }
  .footer {
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    font-size: 11px;
    color: #94a3b8;
    display: flex;
    justify-content: space-between;
  }
  @media print {
    body { padding: 24px 32px; }
    .no-print { display: none; }
  }
</style>
</head>
<body>
  <div class="report-header">
    <div>
      <div class="report-title">${company.name}</div>
      <div class="report-meta">
        ${config.reportTitle} &nbsp;·&nbsp;
        测评日期：${record.submittedAt?.slice(0, 10) ?? record.createdAt.slice(0, 10)} &nbsp;·&nbsp;
        生成时间：${new Date().toLocaleDateString("zh-CN")}
      </div>
    </div>
    <div class="grade-badge">${gm.label}</div>
  </div>

  <div class="score-section">
    <div>
      <div class="score-total">${score.total}</div>
      <div class="score-label">综合得分（满分 100 分）</div>
    </div>
    <table>${dimRows}</table>
  </div>

  <h2 class="section-title">✦ AI 智能分析</h2>
  ${mdHtml}

  ${score.suggestions.length > 0 ? `<h2 class="section-title">✦ 培育建议</h2>${suggestionHtml}` : ""}

  <div class="footer">
    <span>本报告由 AI 辅助生成，仅供参考，不构成正式认定依据</span>
    <span>高企标的挖掘系统</span>
  </div>

  <script>setTimeout(() => window.print(), 300);</script>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ── AI analysis panel ─────────────────────────────────────────────

function AiAnalysisPanel({
  analysis,
  company,
  record,
}: {
  analysis: AiAnalysis;
  company: Company;
  record: AssessmentRecord;
}) {
  const markdown = aiAnalysisToMarkdown(analysis);

  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 bg-gradient-to-r from-blue-600 to-violet-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles size={15} className="text-white" />
          <span className="text-white font-semibold text-sm">AI 智能分析</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-blue-100 bg-white/20 px-2 py-0.5 rounded-full">
            由 AI 生成
          </span>
          <button
            onClick={() => exportAssessmentReport(company, record, analysis)}
            className="flex items-center gap-1.5 text-xs text-white bg-white/20 hover:bg-white/30 px-3 py-1 rounded-lg transition-colors"
          >
            <Download size={12} />
            导出报告
          </button>
        </div>
      </div>

      {/* Markdown content */}
      <div className="p-5">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h2({ children }) {
              return (
                <h2 className="text-sm font-semibold text-[#0f172a] mt-5 mb-2 first:mt-0">
                  {children}
                </h2>
              );
            },
            p({ children }) {
              return (
                <p className="text-sm text-[#475569] leading-relaxed mb-3">
                  {children}
                </p>
              );
            },
            strong({ children }) {
              return (
                <strong className="font-semibold text-[#0f172a]">
                  {children}
                </strong>
              );
            },
            ul({ children }) {
              return <ul className="mb-3 space-y-1.5 ml-1">{children}</ul>;
            },
            li({ children }) {
              return (
                <li className="flex items-start gap-2 text-sm text-[#475569]">
                  <span className="text-blue-400 mt-0.5 flex-shrink-0 select-none">
                    •
                  </span>
                  <span>{children}</span>
                </li>
              );
            },
            blockquote({ children }) {
              return (
                <div className="my-3 pl-4 py-3 pr-4 bg-blue-50 border-l-4 border-blue-400 rounded-r-xl">
                  <div className="text-sm text-blue-700 leading-relaxed">
                    {children}
                  </div>
                </div>
              );
            },
            hr() {
              return <hr className="my-4 border-[#f1f5f9]" />;
            },
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────

export default function TabAssessment({ company }: { company: Company }) {
  const activeQual = useQualStore((s) => s.activeQual);
  const [completed, setCompleted] = useState<AssessmentRecord | null>(null);
  const [pending, setPending] = useState<AssessmentRecord | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showSharePanel, setShowSharePanel] = useState(false);

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
      qualType: activeQual,
    };
    saveAssessmentRecord(record);
    setPending(record);
    setShareUrl(buildShareUrl(token));
  }

  const score = completed?.score;
  const aiAnalysis =
    score && completed?.answers
      ? generateAiAnalysis(completed.qualType, score, completed.answers)
      : null;
  const dimColors: Record<string, string> = completed
    ? Object.fromEntries(
        getAssessmentConfig(completed.qualType).dimensions.map((d) => [
          d.id,
          d.color,
        ]),
      )
    : {};

  return (
    <div className="space-y-6">
      {/* ── Status overview ── */}
      <div className="bg-white border border-[#e5e7eb] rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0f172a] flex items-center gap-2">
            <ClipboardList size={15} className="text-blue-600" />
            测评状态
          </h3>
          {completed && (
            <button
              onClick={() => setShowSharePanel((v) => !v)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-medium rounded-lg px-3 py-1.5 border transition-colors",
                showSharePanel
                  ? "bg-blue-50 text-blue-600 border-blue-200"
                  : "text-[#64748b] border-[#e5e7eb] hover:text-blue-600 hover:border-blue-200",
              )}
            >
              <RefreshCcw size={12} />
              重新发起测评
            </button>
          )}
        </div>

        {completed ? (
          <>
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

            {showSharePanel && (
              <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
                <SharePanel
                  shareUrl={shareUrl || buildShareUrl(pending?.token ?? completed.token)}
                  onRegenerate={handleGenerate}
                />
              </div>
            )}
          </>
        ) : (
          <p className="text-sm text-[#94a3b8]">尚未发起测评，点击下方按钮生成测评链接</p>
        )}
      </div>

      {/* ── Share panel (only when no results yet) ── */}
      {!completed && (
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-[#0f172a]">发起测评</h3>
          {pending ? (
            <SharePanel shareUrl={shareUrl} onRegenerate={handleGenerate} />
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
      )}

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
                            backgroundColor: dimColors[d.dimension],
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
          {aiAnalysis && completed && (
            <AiAnalysisPanel
              analysis={aiAnalysis}
              company={company}
              record={completed}
            />
          )}

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
