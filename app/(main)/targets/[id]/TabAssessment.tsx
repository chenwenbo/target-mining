"use client";

import { useState, useEffect } from "react";
import { Copy, Check, QrCode, ClipboardList, RefreshCcw } from "lucide-react";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import {
  generateToken,
  buildShareUrl,
  saveAssessmentRecord,
  getLatestCompletedByCompany,
  getLatestPendingByCompany,
} from "@/lib/assessment-store";
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
  优秀:   { label: "条件优秀",   bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200" },
  符合:   { label: "符合申报条件", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200"    },
  待培育: { label: "待重点培育",  bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200"   },
};

const DIM_COLORS: Record<AssessmentDimension, string> = {
  rd_expense:     "#2563eb",
  rd_staff:       "#7c3aed",
  ip:             "#0891b2",
  hi_tech_revenue:"#059669",
  management:     "#d97706",
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
        {/* QR code */}
        <div className="flex-shrink-0 border border-[#e5e7eb] rounded-lg overflow-hidden w-[90px] h-[90px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={qrSrc} alt="测评二维码" className="w-full h-full" />
        </div>

        {/* URL + copy */}
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

export default function TabAssessment({ company }: { company: Company }) {
  const [completed, setCompleted] = useState<AssessmentRecord | null>(null);
  const [pending, setPending] = useState<AssessmentRecord | null>(null);
  const [shareUrl, setShareUrl] = useState("");

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
          <SharePanel shareUrl={shareUrl || buildShareUrl(pending?.token ?? completed?.token ?? "")} onRegenerate={handleGenerate} />
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
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">测评结果</h3>
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

                {/* Dimension bars */}
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
    </div>
  );
}
