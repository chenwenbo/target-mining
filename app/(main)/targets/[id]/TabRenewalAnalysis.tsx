"use client";
import { CheckCircle2, XCircle, AlertTriangle, RefreshCcw } from "lucide-react";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import { scoreRenewalReadiness, getRenewalStatus, monthsUntilExpiry } from "@/lib/renewal";
import type { CertifiedCompany, RenewalStatus } from "@/lib/types";
import { cn } from "@/lib/cn";

const STATUS_META: Record<RenewalStatus, { label: string; bg: string; text: string; border: string }> = {
  overdue:    { label: "已过期",   bg: "bg-red-100",    text: "text-red-700",    border: "border-red-300" },
  critical:   { label: "紧急",     bg: "bg-orange-100", text: "text-orange-700", border: "border-orange-300" },
  approaching:{ label: "预警",     bg: "bg-amber-100",  text: "text-amber-700",  border: "border-amber-300" },
  active:     { label: "正常",     bg: "bg-emerald-100",text: "text-emerald-700",border: "border-emerald-300" },
};

// ─── Three-year trend line chart ──────────────────────────────
function TrendChart({
  title, values, threshold, unit, goodAbove,
}: {
  title: string;
  values: [number, number, number];
  threshold: number;
  unit: string;
  goodAbove: boolean;
}) {
  const option = {
    tooltip: { trigger: "axis", formatter: `{b}: {c}${unit}` },
    grid: { left: 36, right: 12, top: 24, bottom: 24 },
    xAxis: { type: "category", data: ["第1年", "第2年", "第3年"], axisLine: { lineStyle: { color: "#e2e8f0" } }, axisTick: { show: false }, axisLabel: { fontSize: 11, color: "#94a3b8" } },
    yAxis: { type: "value", splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { fontSize: 10, color: "#94a3b8" } },
    series: [
      {
        type: "line",
        data: values,
        smooth: true,
        symbol: "circle",
        symbolSize: 6,
        lineStyle: { color: "#2563eb", width: 2 },
        itemStyle: { color: "#2563eb" },
        areaStyle: { color: "rgba(37,99,235,0.08)" },
      },
      {
        type: "line",
        data: [threshold, threshold, threshold],
        lineStyle: { color: "#ef4444", type: "dashed", width: 1.5 },
        symbol: "none",
        tooltip: { show: false },
      },
    ],
  };
  return (
    <div className="bg-white border border-[#e5e7eb] rounded-xl p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[#0f172a]">{title}</span>
        <span className="text-xs text-[#94a3b8]">要求≥{threshold}{unit}</span>
      </div>
      <EChartsWrapper option={option} height={120} />
      <div className="flex items-center gap-1 mt-1">
        {values.map((v, i) => {
          const ok = goodAbove ? v >= threshold : v <= threshold;
          return (
            <span key={i} className={cn("flex-1 text-center text-xs font-medium", ok ? "text-emerald-600" : "text-red-500")}>
              {v.toFixed(1)}{unit}
            </span>
          );
        })}
      </div>
    </div>
  );
}

// ─── Readiness gauge ─────────────────────────────────────────
function ReadinessGauge({ score }: { score: number }) {
  const color = score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const option = {
    series: [{
      type: "gauge",
      startAngle: 200,
      endAngle: -20,
      min: 0,
      max: 100,
      splitNumber: 4,
      pointer: { length: "60%", width: 4, itemStyle: { color } },
      axisLine: { lineStyle: { width: 12, color: [[0.5, "#ef4444"], [0.7, "#f59e0b"], [1, "#10b981"]] } },
      axisTick: { show: false },
      splitLine: { show: false },
      axisLabel: { show: false },
      detail: { fontSize: 26, fontWeight: "bold", color: "#0f172a", offsetCenter: [0, "30%"], formatter: "{value}" },
      data: [{ value: score }],
    }],
  };
  return <EChartsWrapper option={option} height={160} />;
}

// ─── Main component ───────────────────────────────────────────
export default function TabRenewalAnalysis({ company }: { company: CertifiedCompany }) {
  const status = getRenewalStatus(company);
  const months = monthsUntilExpiry(company.expiryYear);
  const readiness = scoreRenewalReadiness(company);
  const m = company.threeYearMetrics;
  const statusMeta = STATUS_META[status];

  const allAudit = m.annualAuditPassedY1 && m.annualAuditPassedY2 && m.annualAuditPassedY3;

  return (
    <div className="space-y-6">
      {/* Status bar */}
      <div className={cn("flex items-center gap-4 p-4 rounded-xl border", statusMeta.bg, statusMeta.border)}>
        <div className="flex-1 grid grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-xs text-[#64748b] mb-0.5">证书编号</div>
            <div className="font-mono text-xs text-[#0f172a]">{company.certNo}</div>
          </div>
          <div>
            <div className="text-xs text-[#64748b] mb-0.5">认定年份</div>
            <div className="font-semibold text-[#0f172a]">{company.certifiedYear} 年</div>
          </div>
          <div>
            <div className="text-xs text-[#64748b] mb-0.5">到期年份</div>
            <div className="font-semibold text-[#0f172a]">{company.expiryYear} 年</div>
          </div>
          <div>
            <div className="text-xs text-[#64748b] mb-0.5">剩余时间</div>
            <div className={cn("font-semibold", months < 0 ? "text-red-600" : "text-[#0f172a]")}>
              {months < 0 ? `已过期 ${Math.abs(months)} 个月` : `${months} 个月`}
            </div>
          </div>
        </div>
        <span className={cn("px-3 py-1 rounded-full text-sm font-semibold", statusMeta.bg, statusMeta.text)}>
          {statusMeta.label}
        </span>
      </div>

      {/* Readiness score */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "200px 1fr" }}>
        <div className="bg-white border border-[#e5e7eb] rounded-xl p-4 flex flex-col items-center">
          <div className="text-xs font-semibold text-[#0f172a] mb-1">复审准备度</div>
          <ReadinessGauge score={readiness.total} />
          <div className={cn(
            "w-full mt-2 py-2 text-center text-xs font-semibold rounded-lg",
            readiness.readyToRenew ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
          )}>
            {readiness.readyToRenew ? "✓ 可启动复审申报" : "✗ 尚有关键缺项"}
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "研发投入比", score: readiness.rdRatioScore, max: 30 },
            { label: "高新收入比", score: readiness.hiTechRevenueScore, max: 30 },
            { label: "知识产权增长", score: readiness.ipGrowthScore, max: 20 },
            { label: "合规与审计", score: readiness.complianceScore, max: 20 },
          ].map((dim) => {
            const pct = (dim.score / dim.max) * 100;
            const color = pct >= 80 ? "bg-emerald-500" : pct >= 50 ? "bg-amber-400" : "bg-red-500";
            return (
              <div key={dim.label} className="bg-white border border-[#e5e7eb] rounded-xl p-4">
                <div className="text-xs text-[#64748b] mb-2">{dim.label}</div>
                <div className="text-2xl font-bold text-[#0f172a] tabular-nums">{dim.score}</div>
                <div className="text-xs text-[#94a3b8] mb-2">/ {dim.max} 分</div>
                <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Four trend charts */}
      <div className="grid grid-cols-2 gap-4">
        <TrendChart
          title="三年研发投入占比"
          values={[m.rdExpenseRatioY1, m.rdExpenseRatioY2, m.rdExpenseRatioY3]}
          threshold={6}
          unit="%"
          goodAbove={true}
        />
        <TrendChart
          title="高新产品（服务）收入占比"
          values={[m.hiTechRevenueRatioY1, m.hiTechRevenueRatioY2, m.hiTechRevenueRatioY3]}
          threshold={60}
          unit="%"
          goodAbove={true}
        />
        <TrendChart
          title="研发人员占比"
          values={[m.rdStaffRatioY1, m.rdStaffRatioY2, m.rdStaffRatioY3]}
          threshold={10}
          unit="%"
          goodAbove={true}
        />
        <TrendChart
          title="年度新增专利数"
          values={[m.newPatentsY1, m.newPatentsY2, m.newPatentsY3]}
          threshold={1}
          unit=" 项"
          goodAbove={true}
        />
      </div>

      {/* Gap list */}
      {readiness.gaps.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">问题清单</h3>
          <div className="space-y-3">
            {readiness.gaps.map((gap, i) => (
              <div key={i} className={cn(
                "p-4 rounded-lg border",
                gap.urgent ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"
              )}>
                <div className="flex items-start gap-2">
                  <AlertTriangle size={14} className={cn("flex-shrink-0 mt-0.5", gap.urgent ? "text-red-500" : "text-amber-500")} />
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn("text-xs font-semibold px-1.5 py-0.5 rounded",
                        gap.urgent ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"
                      )}>{gap.criterion}</span>
                      {gap.urgent && <span className="text-xs text-red-600 font-semibold">⚠ 复审硬性要求</span>}
                    </div>
                    <div className="flex gap-4 text-xs text-[#475569] mb-1.5">
                      <span>当前：<strong className="text-red-600">{gap.currentValue}</strong></span>
                      <span>要求：<strong className="text-emerald-700">{gap.requiredValue}</strong></span>
                    </div>
                    <p className="text-xs text-[#475569]">
                      <span className="font-medium text-blue-700">建议：</span>{gap.suggestion}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {readiness.gaps.length === 0 && (
        <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <CheckCircle2 size={16} className="text-emerald-600" />
          <span className="text-sm text-emerald-800 font-medium">各项复审指标均达标，建议尽快启动复审申报材料准备</span>
        </div>
      )}

      {/* Audit & compliance */}
      <div>
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">年度审计与合规状态</h3>
        <div className="grid grid-cols-3 gap-3">
          {[
            { year: `${company.certifiedYear}年（第1年）`, audit: m.annualAuditPassedY1 },
            { year: `${company.certifiedYear + 1}年（第2年）`, audit: m.annualAuditPassedY2 },
            { year: `${company.certifiedYear + 2}年（第3年）`, audit: m.annualAuditPassedY3 },
          ].map((row) => (
            <div key={row.year} className="bg-white border border-[#e5e7eb] rounded-xl p-4">
              <div className="text-xs font-medium text-[#0f172a] mb-3">{row.year}</div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748b]">年度财务审计</span>
                  {row.audit
                    ? <CheckCircle2 size={14} className="text-emerald-500" />
                    : <XCircle size={14} className="text-red-500" />}
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#64748b]">合规无违规</span>
                  {m.complianceClean
                    ? <CheckCircle2 size={14} className="text-emerald-500" />
                    : <XCircle size={14} className="text-red-500" />}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="bg-[#f7f8fa] rounded-lg p-4 border border-[#e5e7eb]">
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">操作</h3>
        <div className="flex flex-wrap gap-2">
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
            <RefreshCcw size={13} /> 新建复审任务
          </button>
          <button className="px-4 py-2 border border-[#e5e7eb] bg-white text-sm rounded-lg text-[#475569] hover:bg-white/80 transition-colors">
            导出复审分析报告 PDF
          </button>
        </div>
      </div>
    </div>
  );
}
