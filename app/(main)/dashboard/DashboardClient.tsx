"use client";
import { useState, useEffect, useRef } from "react";
import { Target, Users, AlertTriangle, Pencil, Check, X } from "lucide-react";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import type { getDashboardKPI, SMEDashboardKPI, LittleGiantDashboardKPI } from "@/lib/mock-data";
import { getRegionLabel, useCurrentPCUser, useRoleGuard } from "@/lib/account-mock";
import { useQualStore } from "@/lib/qual-store";
import { QUAL_TYPE_META, type QualificationType } from "@/lib/types";
import { INDUSTRIAL_SIX_CATEGORIES } from "@/lib/industrial-six";

type KPI = ReturnType<typeof getDashboardKPI>;

// ─── 顶部三张 KPI 卡（横排）─────────────────────────────────
function useEditableNumber(storageKey: string, defaultValue: number) {
  const [value, setValue] = useState(defaultValue);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(String(defaultValue));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) setValue(Number(saved));
  }, [storageKey]);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  function startEdit() { setDraft(String(value)); setEditing(true); }
  function cancel() { setEditing(false); }
  function commit() {
    const val = parseInt(draft, 10);
    if (!isNaN(val) && val > 0) { setValue(val); localStorage.setItem(storageKey, String(val)); }
    setEditing(false);
  }

  return { value, editing, draft, setDraft, inputRef, startEdit, commit, cancel };
}

function TopKPI({
  yearGoal,
  willingDefault,
  renewalTotal,
  newDeclTargets,
  storagePrefix = "dashboard",
}: {
  yearGoal: number;
  willingDefault: number;
  renewalTotal: number;
  newDeclTargets: number;
  storagePrefix?: string;
}) {
  const goal = useEditableNumber(`${storagePrefix}_yearGoal`, yearGoal);
  const certified = useEditableNumber(`${storagePrefix}_certified`, willingDefault);

  const totalTargets = newDeclTargets + renewalTotal;
  const gapValue = goal.value - totalTargets;
  const hasGap = gapValue > 0;
  const progressPct = Math.min(100, Math.round((certified.value / goal.value) * 100));

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {/* ① 本年度申报目标 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
          <Target size={22} className="text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#94a3b8] font-medium">本年度申报目标</span>
            {!goal.editing && (
              <button onClick={goal.startEdit} className="text-[#cbd5e1] hover:text-blue-500 transition-colors" title="修改目标">
                <Pencil size={11} />
              </button>
            )}
          </div>
          {goal.editing ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                ref={goal.inputRef}
                type="number"
                min={1}
                value={goal.draft}
                onChange={e => goal.setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") goal.commit(); if (e.key === "Escape") goal.cancel(); }}
                className="w-20 text-2xl font-bold text-[#0f172a] tabular-nums leading-none border-b-2 border-blue-500 outline-none bg-transparent"
              />
              <span className="text-sm text-[#94a3b8]">家</span>
              <button onClick={goal.commit} className="text-emerald-500 hover:text-emerald-600 transition-colors ml-0.5"><Check size={14} /></button>
              <button onClick={goal.cancel} className="text-[#94a3b8] hover:text-red-400 transition-colors"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold text-[#0f172a] tabular-nums leading-none">{goal.value}</span>
              <span className="text-sm text-[#94a3b8]">家</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="flex items-center gap-1 justify-end">
            <span className="text-[11px] text-[#94a3b8]">有申报意愿</span>
          </div>
          <div className="text-base font-semibold text-emerald-600 tabular-nums leading-tight">{certified.value} 家</div>
          <div className="mt-1.5 w-20 h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-1 tabular-nums">完成 {progressPct}%</div>
        </div>
      </div>

      {/* ② 潜在标的总数（复审 / 新增） */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Users size={22} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#94a3b8] font-medium">潜在标的总数</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-bold text-[#0f172a] tabular-nums leading-none">{totalTargets}</span>
            <span className="text-sm text-[#94a3b8]">家</span>
          </div>
        </div>
        <div className="flex items-stretch gap-3 shrink-0 border-l border-[#e5e7eb] pl-4">
          <div className="text-center">
            <div className="text-[11px] text-[#94a3b8]">复审</div>
            <div className="text-lg font-semibold text-purple-600 tabular-nums leading-tight">{renewalTotal}</div>
            <div className="text-[10px] text-[#94a3b8]">家</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[#94a3b8]">新增</div>
            <div className="text-lg font-semibold text-blue-600 tabular-nums leading-tight">{newDeclTargets}</div>
            <div className="text-[10px] text-[#94a3b8]">家</div>
          </div>
        </div>
      </div>

      {/* ③ 目标缺口数量 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <AlertTriangle size={22} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#94a3b8] font-medium">目标缺口数量</div>
          {hasGap ? (
            <>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-bold text-[#0f172a] tabular-nums leading-none">{gapValue}</span>
                <span className="text-sm text-[#94a3b8]">家</span>
              </div>
              <div className="text-[11px] text-[#64748b] mt-1.5">
                需在年内再挖掘 <span className="font-semibold text-amber-700 tabular-nums">{gapValue}</span> 家方可达标
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-bold text-emerald-600 leading-none">无缺口</span>
              </div>
              <div className="text-[11px] text-[#64748b] mt-1.5">
                潜在标的已满足年度申报目标
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── 企业漏斗（保留原有 SVG 设计，缩小适配窄列）──────────────
type FunnelStage =
  | { type: "single"; name: string; value: number; basis?: number }
  | {
      type: "split";
      left: { name: string; value: number; basis: number };
      right: { name: string; value: number; basis: number };
      mergedBasis: number;
    };

function EnterpriseFunnel({ kpi }: { kpi: KPI }) {
  const stages: FunnelStage[] = [
    { type: "single", name: "企业总数", value: kpi.funnelEnterpriseTotal },
    { type: "single", name: "泛科技企业总数", value: kpi.funnelEnterpriseTech, basis: kpi.funnelEnterpriseTotal },
    { type: "single", name: "潜在标的企业", value: kpi.funnelGrowthUnion, basis: kpi.funnelEnterpriseTech },
    { type: "single", name: "有意愿的企业", value: kpi.funnelWilling, basis: kpi.funnelGrowthUnion },
    { type: "single", name: "认定成功的企业", value: kpi.funnelCertifiedFinal, basis: kpi.funnelWilling },
  ];

  const VW = 660;
  const VH = 300;
  const CENTER = 230;
  const W_TOP = 380;
  const W_BOT = 110;
  const Y_START = 16;
  const LAYER_H = 50;
  const GAP = 4;
  const LC = stages.length;

  const widthAt = (i: number) => W_TOP - (i / LC) * (W_TOP - W_BOT);
  const yAt = (i: number) => Y_START + i * (LAYER_H + GAP);

  const palette = [
    { from: "#bae6fd", to: "#7dd3fc" },
    { from: "#7dd3fc", to: "#38bdf8" },
    { from: "#38bdf8", to: "#0ea5e9" },
    { from: "#0ea5e9", to: "#0284c7" },
    { from: "#0284c7", to: "#075985" },
  ];

  const fmtPct = (num: number, den: number) =>
    den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "—";

  const RIGHT_COL_X = 470;

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-[#e5e7eb]">
        <h2 className="text-sm font-semibold text-[#0f172a]">企业漏斗</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">企业总数 → 泛科技 → 近三年增长 → 意愿 → 认定</p>
      </div>
      <div className="px-3 pt-3 pb-2 flex-1 min-h-0">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full" role="img" aria-label="企业漏斗">
          <defs>
            {palette.map((p, i) => (
              <linearGradient key={i} id={`fn-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.from} />
                <stop offset="100%" stopColor={p.to} />
              </linearGradient>
            ))}
            <linearGradient id="fn-shine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>

          {stages.map((stage, i) => {
            const yT = yAt(i);
            const yB = yT + LAYER_H;
            const wT = widthAt(i);
            const wB = widthAt(i + 1);
            const xLT = CENTER - wT / 2;
            const xRT = CENTER + wT / 2;
            const xLB = CENTER - wB / 2;
            const xRB = CENTER + wB / 2;
            const fill = `url(#fn-grad-${i})`;
            const splitGap = 5;

            return (
              <g key={i}>
                {stage.type === "split" ? (
                  <>
                    <polygon
                      points={`${xLT},${yT} ${CENTER - splitGap},${yT} ${CENTER - splitGap},${yB} ${xLB},${yB}`}
                      fill={fill}
                    />
                    <polygon
                      points={`${CENTER + splitGap},${yT} ${xRT},${yT} ${xRB},${yB} ${CENTER + splitGap},${yB}`}
                      fill={fill}
                    />
                    <polygon
                      points={`${xLT},${yT} ${CENTER - splitGap},${yT} ${CENTER - splitGap - (xLT - xLB) * 0.18},${yT + LAYER_H * 0.36} ${xLT + (xLT - xLB) * 0.18},${yT + LAYER_H * 0.36}`}
                      fill="url(#fn-shine)"
                    />
                    <polygon
                      points={`${CENTER + splitGap},${yT} ${xRT},${yT} ${xRT - (xRT - xRB) * 0.18},${yT + LAYER_H * 0.36} ${CENTER + splitGap + (xRT - xRB) * 0.18},${yT + LAYER_H * 0.36}`}
                      fill="url(#fn-shine)"
                    />
                    <text x={(xLT + CENTER) / 2 + 1} y={yT + LAYER_H / 2 - 3} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
                      {stage.left.name}
                    </text>
                    <text x={(xLT + CENTER) / 2 + 1} y={yT + LAYER_H / 2 + 13} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
                      {stage.left.value.toLocaleString()}
                    </text>
                    <text x={(CENTER + xRT) / 2 - 1} y={yT + LAYER_H / 2 - 3} textAnchor="middle" fill="#fff" fontSize="10" fontWeight="600">
                      {stage.right.name}
                    </text>
                    <text x={(CENTER + xRT) / 2 - 1} y={yT + LAYER_H / 2 + 13} textAnchor="middle" fill="#fff" fontSize="13" fontWeight="700">
                      {stage.right.value.toLocaleString()}
                    </text>
                  </>
                ) : (
                  <>
                    <polygon
                      points={`${xLT},${yT} ${xRT},${yT} ${xRB},${yB} ${xLB},${yB}`}
                      fill={fill}
                    />
                    <polygon
                      points={`${xLT},${yT} ${xRT},${yT} ${xRT - (xRT - xRB) * 0.2},${yT + LAYER_H * 0.36} ${xLT + (xLT - xLB) * 0.2},${yT + LAYER_H * 0.36}`}
                      fill="url(#fn-shine)"
                    />
                    <text x={CENTER} y={yT + LAYER_H / 2 - 2} textAnchor="middle" fill="#fff" fontSize="11" fontWeight="600">
                      {stage.name}
                    </text>
                    <text x={CENTER} y={yT + LAYER_H / 2 + 15} textAnchor="middle" fill="#fff" fontSize="15" fontWeight="700">
                      {stage.value.toLocaleString()}
                    </text>
                  </>
                )}
              </g>
            );
          })}

          {stages.map((stage, i) => {
            const yT = yAt(i);
            const yB = yT + LAYER_H;
            const yMid = (yT + yB) / 2;
            const wT = widthAt(i);
            const wB = widthAt(i + 1);
            const rightEdge = CENTER + Math.max(wT, wB) / 2;

            if (stage.type === "split") {
              return (
                <g key={`a${i}`}>
                  <line x1={rightEdge} y1={yMid} x2={RIGHT_COL_X - 6} y2={yMid} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" />
                  <circle cx={rightEdge} cy={yMid} r="3" fill="#0ea5e9" />
                  <rect x={RIGHT_COL_X} y={yMid - 18} width="160" height="16" rx="3" fill="#e0f2fe" />
                  <text x={RIGHT_COL_X + 8} y={yMid - 6} fill="#0369a1" fontSize="10" fontWeight="600">
                    专利转化 {fmtPct(stage.left.value, stage.left.basis)}
                  </text>
                  <rect x={RIGHT_COL_X} y={yMid + 2} width="160" height="16" rx="3" fill="#e0f2fe" />
                  <text x={RIGHT_COL_X + 8} y={yMid + 14} fill="#0369a1" fontSize="10" fontWeight="600">
                    人数转化 {fmtPct(stage.right.value, stage.right.basis)}
                  </text>
                </g>
              );
            }

            const conv = stage.basis ? fmtPct(stage.value, stage.basis) : null;
            return (
              <g key={`a${i}`}>
                <line x1={rightEdge} y1={yMid} x2={RIGHT_COL_X - 6} y2={yMid} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx={rightEdge} cy={yMid} r="3" fill="#0ea5e9" />
                <rect x={RIGHT_COL_X} y={yMid - 10} width="70" height="20" rx="10" fill="#fff" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x={RIGHT_COL_X + 35} y={yMid + 4} textAnchor="middle" fill="#0369a1" fontSize="12" fontWeight="700">
                  {stage.value.toLocaleString()}
                </text>
                {conv && (
                  <text x={RIGHT_COL_X + 78} y={yMid + 4} fill="#0284c7" fontSize="10" fontWeight="600">
                    转化 {conv}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── 卡片外壳 ────────────────────────────────────────────────
function PanelCard({
  title,
  subtitle,
  action,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-start justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#0f172a]">{title}</h2>
          {subtitle && <p className="text-xs text-[#94a3b8] mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4 flex-1 flex flex-col">{children}</div>
    </div>
  );
}

// ─── 街道乡镇分布 ────────────────────────────────────────────
function StreetDistribution({ byStreet }: { byStreet: Record<string, number> }) {
  const sorted = Object.entries(byStreet).sort((a, b) => b[1] - a[1]).slice(0, 10);
  const max = sorted[0]?.[1] ?? 1;
  return (
    <PanelCard
      title="街道 / 乡镇分布"
      subtitle="按潜在标的数量排序"
    >
      <div className="flex flex-col justify-between flex-1">
        {sorted.map(([street, count]) => (
          <div key={street} className="grid items-center gap-3" style={{ gridTemplateColumns: "100px 1fr 32px" }}>
            <span className="text-sm text-[#0f172a] font-medium truncate">{street}</span>
            <div className="h-2.5 bg-[#f1f5f9] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-[#475569] tabular-nums text-right">{count}</span>
          </div>
        ))}
      </div>
    </PanelCard>
  );
}

// ─── 八大领域分布（紧凑环形图）────────────────────────────────
function FieldDonut({ kpi }: { kpi: KPI }) {
  const colors = ["#2563eb", "#7c3aed", "#0891b2", "#10b981", "#f59e0b", "#f97316", "#ec4899", "#14b8a6"];
  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} 家 ({d}%)" },
    legend: {
      bottom: 0,
      left: "center",
      icon: "circle",
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 6,
      textStyle: { color: "#475569", fontSize: 10 },
      type: "scroll",
    },
    series: [{
      type: "pie",
      radius: ["52%", "76%"],
      center: ["50%", "42%"],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 4 },
      label: {
        show: true,
        position: "center",
        formatter: `{total|${kpi.total}}\n{sub|潜在标的}`,
        rich: {
          total: { fontSize: 22, color: "#0f172a", fontWeight: "bold" },
          sub: { fontSize: 11, color: "#94a3b8", padding: [4, 0, 0, 0] },
        },
      },
      labelLine: { show: false },
      data: Object.entries(kpi.byField).map(([name, value], i) => ({
        name,
        value,
        itemStyle: { color: colors[i % colors.length] },
      })),
    }],
  };
  return (
    <PanelCard title="八大领域分布" subtitle="国家重点支持高新技术领域">
      <EChartsWrapper option={option} height={260} />
    </PanelCard>
  );
}

// ─── 成立年限分布（紧凑柱状）────────────────────────────────
function AgeBar({ kpi }: { kpi: KPI }) {
  const option = {
    grid: { left: 36, right: 12, top: 24, bottom: 28 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: Object.keys(kpi.byAge),
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 10, interval: 0 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#94a3b8", fontSize: 10 },
    },
    series: [{
      type: "bar",
      data: Object.values(kpi.byAge),
      barWidth: 22,
      itemStyle: {
        color: {
          type: "linear",
          x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#60a5fa" },
            { offset: 1, color: "#2563eb" },
          ],
        },
        borderRadius: [4, 4, 0, 0],
      },
      label: { show: true, position: "top", color: "#0f172a", fontSize: 11, fontWeight: "bold" },
    }],
  };
  return (
    <PanelCard title="成立年限分布" subtitle="高企认定偏好 3-8 年期企业">
      <EChartsWrapper option={option} height={260} />
    </PanelCard>
  );
}

// ─── SME 模块 KPI 卡（三张横排）─────────────────────────────────
function SMETopKPI({ kpi, qualType }: { kpi: SMEDashboardKPI; qualType: Exclude<QualificationType, "high_tech"> }) {
  const meta = QUAL_TYPE_META[qualType];
  const goal = useEditableNumber(`sme_goal_${qualType}`, kpi.yearGoal);
  const certified = useEditableNumber(`sme_certified_${qualType}`, kpi.certified);
  const progressPct = Math.min(100, Math.round((certified.value / goal.value) * 100));
  const gapValue = Math.max(0, goal.value - kpi.criteriaMetCount);

  const goalLabel = qualType === "innovative_sme" ? "入库目标" : qualType === "specialized_sme" ? "认定目标" : "培育目标";
  const certLabel = qualType === "innovative_sme" ? "已入库" : qualType === "specialized_sme" ? "已认定" : "已获批";
  const potentialLabel = qualType === "innovative_sme" ? "潜力企业数" : qualType === "specialized_sme" ? "符合条件企业" : "已专精特新认定";

  return (
    <div className="grid grid-cols-3 gap-4 mb-4">
      {/* ① 目标 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] p-5 flex items-center gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${meta.color === "violet" ? "bg-violet-50" : meta.color === "amber" ? "bg-amber-50" : "bg-rose-50"}`}>
          <Target size={22} className={meta.color === "violet" ? "text-violet-600" : meta.color === "amber" ? "text-amber-600" : "text-rose-600"} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-[#94a3b8] font-medium">本年度{goalLabel}</span>
            {!goal.editing && (
              <button onClick={goal.startEdit} className="text-[#cbd5e1] hover:text-violet-500 transition-colors" title="修改目标">
                <Pencil size={11} />
              </button>
            )}
          </div>
          {goal.editing ? (
            <div className="flex items-center gap-1.5 mt-1">
              <input
                ref={goal.inputRef}
                type="number"
                min={1}
                value={goal.draft}
                onChange={(e) => goal.setDraft(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") goal.commit(); if (e.key === "Escape") goal.cancel(); }}
                className="w-20 text-2xl font-bold text-[#0f172a] tabular-nums leading-none border-b-2 border-violet-500 outline-none bg-transparent"
              />
              <span className="text-sm text-[#94a3b8]">家</span>
              <button onClick={goal.commit} className="text-emerald-500 hover:text-emerald-600 transition-colors ml-0.5"><Check size={14} /></button>
              <button onClick={goal.cancel} className="text-[#94a3b8] hover:text-red-400 transition-colors"><X size={14} /></button>
            </div>
          ) : (
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="text-3xl font-bold text-[#0f172a] tabular-nums leading-none">{goal.value}</span>
              <span className="text-sm text-[#94a3b8]">家</span>
            </div>
          )}
        </div>
        <div className="flex flex-col items-end shrink-0">
          <div className="text-[11px] text-[#94a3b8]">{certLabel}</div>
          <div className="text-base font-semibold text-emerald-600 tabular-nums leading-tight">{certified.value} 家</div>
          <div className="mt-1.5 w-20 h-1.5 rounded-full bg-[#f1f5f9] overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400" style={{ width: `${progressPct}%` }} />
          </div>
          <div className="text-[10px] text-[#94a3b8] mt-1 tabular-nums">完成 {progressPct}%</div>
        </div>
      </div>

      {/* ② 潜力企业 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center shrink-0">
          <Users size={22} className="text-indigo-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#94a3b8] font-medium">{potentialLabel}</div>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-3xl font-bold text-[#0f172a] tabular-nums leading-none">{kpi.potentialCount}</span>
            <span className="text-sm text-[#94a3b8]">家</span>
          </div>
        </div>
        <div className="flex items-stretch gap-3 shrink-0 border-l border-[#e5e7eb] pl-4">
          <div className="text-center">
            <div className="text-[11px] text-[#94a3b8]">条件达标</div>
            <div className="text-lg font-semibold text-violet-600 tabular-nums leading-tight">{kpi.criteriaMetCount}</div>
            <div className="text-[10px] text-[#94a3b8]">家</div>
          </div>
          <div className="text-center">
            <div className="text-[11px] text-[#94a3b8]">有意愿</div>
            <div className="text-lg font-semibold text-blue-600 tabular-nums leading-tight">{kpi.willingCount}</div>
            <div className="text-[10px] text-[#94a3b8]">家</div>
          </div>
        </div>
      </div>

      {/* ③ 缺口 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
          <AlertTriangle size={22} className="text-amber-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-xs text-[#94a3b8] font-medium">目标缺口</div>
          {gapValue > 0 ? (
            <>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-bold text-[#0f172a] tabular-nums leading-none">{gapValue}</span>
                <span className="text-sm text-[#94a3b8]">家</span>
              </div>
              <div className="text-[11px] text-[#64748b] mt-1.5">
                需再培育 <span className="font-semibold text-amber-700 tabular-nums">{gapValue}</span> 家方可达目标
              </div>
            </>
          ) : (
            <>
              <div className="flex items-baseline gap-1.5 mt-1">
                <span className="text-3xl font-bold text-emerald-600 leading-none">无缺口</span>
              </div>
              <div className="text-[11px] text-[#64748b] mt-1.5">条件达标企业已满足年度目标</div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── SME 企业漏斗 ────────────────────────────────────────────
function SMEFunnel({ kpi, qualType }: { kpi: SMEDashboardKPI; qualType: string }) {
  const stageNames = qualType === "innovative_sme"
    ? ["全区企业", "中小企业", "潜力企业", "条件达标", "成功入库"]
    : qualType === "specialized_sme"
    ? ["全区企业", "中小企业", "潜力企业", "条件达标", "成功认定"]
    : ["全区企业", "中小企业", "潜力企业", "条件达标", "获批小巨人"];

  const stageValues = [
    kpi.funnelEnterpriseTotal,
    kpi.funnelSME,
    kpi.funnelPotential,
    kpi.funnelCriteriaMet,
    kpi.willingCount,
  ];

  const VW = 660;
  const VH = 300;
  const CENTER = 230;
  const W_TOP = 380;
  const W_BOT = 110;
  const Y_START = 16;
  const LAYER_H = 50;
  const GAP = 4;
  const LC = stageValues.length;
  const widthAt = (i: number) => W_TOP - (i / LC) * (W_TOP - W_BOT);
  const yAt = (i: number) => Y_START + i * (LAYER_H + GAP);
  const palette = [
    { from: "#ddd6fe", to: "#c4b5fd" },
    { from: "#c4b5fd", to: "#a78bfa" },
    { from: "#a78bfa", to: "#8b5cf6" },
    { from: "#8b5cf6", to: "#7c3aed" },
    { from: "#7c3aed", to: "#6d28d9" },
  ];
  const fmtPct = (num: number, den: number) =>
    den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "—";
  const RIGHT_COL_X = 470;

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-[#e5e7eb]">
        <h2 className="text-sm font-semibold text-[#0f172a]">企业漏斗</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">全区企业 → 中小企业 → 潜力企业 → 条件达标 → 认定成功</p>
      </div>
      <div className="px-3 pt-3 pb-2 flex-1 min-h-0">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full" role="img" aria-label="SME企业漏斗">
          <defs>
            {palette.map((p, i) => (
              <linearGradient key={i} id={`sme-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.from} />
                <stop offset="100%" stopColor={p.to} />
              </linearGradient>
            ))}
            <linearGradient id="sme-shine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {stageValues.map((val, i) => {
            const yT = yAt(i);
            const yB = yT + LAYER_H;
            const wT = widthAt(i);
            const wB = widthAt(i + 1);
            const xLT = CENTER - wT / 2;
            const xRT = CENTER + wT / 2;
            const xLB = CENTER - wB / 2;
            const xRB = CENTER + wB / 2;
            return (
              <g key={i}>
                <polygon points={`${xLT},${yT} ${xRT},${yT} ${xRB},${yB} ${xLB},${yB}`} fill={`url(#sme-grad-${i})`} />
                <polygon points={`${xLT},${yT} ${xRT},${yT} ${xRT - (xRT - xRB) * 0.2},${yT + LAYER_H * 0.36} ${xLT + (xLT - xLB) * 0.2},${yT + LAYER_H * 0.36}`} fill="url(#sme-shine)" />
                <text x={CENTER} y={yT + LAYER_H / 2 - 2} textAnchor="middle" fill={i < 2 ? "#4c1d95" : "#fff"} fontSize="11" fontWeight="600">{stageNames[i]}</text>
                <text x={CENTER} y={yT + LAYER_H / 2 + 15} textAnchor="middle" fill={i < 2 ? "#4c1d95" : "#fff"} fontSize="15" fontWeight="700">{val.toLocaleString()}</text>
              </g>
            );
          })}
          {stageValues.map((val, i) => {
            const yT = yAt(i);
            const yB = yT + LAYER_H;
            const yMid = (yT + yB) / 2;
            const wT = widthAt(i);
            const wB = widthAt(i + 1);
            const rightEdge = CENTER + Math.max(wT, wB) / 2;
            const conv = i > 0 ? fmtPct(val, stageValues[i - 1]) : null;
            return (
              <g key={`a${i}`}>
                <line x1={rightEdge} y1={yMid} x2={RIGHT_COL_X - 6} y2={yMid} stroke="#7c3aed" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx={rightEdge} cy={yMid} r="3" fill="#7c3aed" />
                <rect x={RIGHT_COL_X} y={yMid - 10} width="70" height="20" rx="10" fill="#fff" stroke="#7c3aed" strokeWidth="1.5" />
                <text x={RIGHT_COL_X + 35} y={yMid + 4} textAnchor="middle" fill="#6d28d9" fontSize="12" fontWeight="700">{val.toLocaleString()}</text>
                {conv && <text x={RIGHT_COL_X + 78} y={yMid + 4} fill="#7c3aed" fontSize="10" fontWeight="600">转化 {conv}</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── 小巨人五层阶梯漏斗 ──────────────────────────────────────
// 高新技术企业 → 创新型中小企业 → 专精特新中小企业 → 潜在标的 → 认定成功
function LadderFunnel({ stages }: { stages: { name: string; value: number }[] }) {
  const stageNames = stages.map((s) => s.name);
  const stageValues = stages.map((s) => s.value);

  const VW = 660;
  const VH = 300;
  const CENTER = 230;
  const W_TOP = 380;
  const W_BOT = 110;
  const Y_START = 16;
  const LAYER_H = 50;
  const GAP = 4;
  const LC = stageValues.length;
  const widthAt = (i: number) => W_TOP - (i / LC) * (W_TOP - W_BOT);
  const yAt = (i: number) => Y_START + i * (LAYER_H + GAP);
  const palette = [
    { from: "#bae6fd", to: "#7dd3fc" },
    { from: "#7dd3fc", to: "#38bdf8" },
    { from: "#38bdf8", to: "#0ea5e9" },
    { from: "#0ea5e9", to: "#0284c7" },
    { from: "#0284c7", to: "#075985" },
  ];
  const fmtPct = (num: number, den: number) =>
    den > 0 ? `${((num / den) * 100).toFixed(1)}%` : "—";
  const RIGHT_COL_X = 470;

  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden flex flex-col">
      <div className="px-5 py-3.5 border-b border-[#e5e7eb]">
        <h2 className="text-sm font-semibold text-[#0f172a]">企业漏斗</h2>
        <p className="text-xs text-[#94a3b8] mt-0.5">高新技术企业 → 创新型 → 专精特新 → 潜在标的 → 认定成功</p>
      </div>
      <div className="px-3 pt-3 pb-2 flex-1 min-h-0">
        <svg viewBox={`0 0 ${VW} ${VH}`} className="w-full h-full" role="img" aria-label="小巨人企业漏斗">
          <defs>
            {palette.map((p, i) => (
              <linearGradient key={i} id={`lg-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={p.from} />
                <stop offset="100%" stopColor={p.to} />
              </linearGradient>
            ))}
            <linearGradient id="lg-shine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          {stageValues.map((val, i) => {
            const yT = yAt(i);
            const yB = yT + LAYER_H;
            const wT = widthAt(i);
            const wB = widthAt(i + 1);
            const xLT = CENTER - wT / 2;
            const xRT = CENTER + wT / 2;
            const xLB = CENTER - wB / 2;
            const xRB = CENTER + wB / 2;
            return (
              <g key={i}>
                <polygon points={`${xLT},${yT} ${xRT},${yT} ${xRB},${yB} ${xLB},${yB}`} fill={`url(#lg-grad-${i})`} />
                <polygon points={`${xLT},${yT} ${xRT},${yT} ${xRT - (xRT - xRB) * 0.2},${yT + LAYER_H * 0.36} ${xLT + (xLT - xLB) * 0.2},${yT + LAYER_H * 0.36}`} fill="url(#lg-shine)" />
                <text x={CENTER} y={yT + LAYER_H / 2 - 2} textAnchor="middle" fill={i === 0 ? "#0c4a6e" : "#fff"} fontSize="11" fontWeight="600">{stageNames[i]}</text>
                <text x={CENTER} y={yT + LAYER_H / 2 + 15} textAnchor="middle" fill={i === 0 ? "#0c4a6e" : "#fff"} fontSize="15" fontWeight="700">{val.toLocaleString()}</text>
              </g>
            );
          })}
          {stageValues.map((val, i) => {
            const yT = yAt(i);
            const yB = yT + LAYER_H;
            const yMid = (yT + yB) / 2;
            const wT = widthAt(i);
            const wB = widthAt(i + 1);
            const rightEdge = CENTER + Math.max(wT, wB) / 2;
            const conv = i > 0 ? fmtPct(val, stageValues[i - 1]) : null;
            return (
              <g key={`a${i}`}>
                <line x1={rightEdge} y1={yMid} x2={RIGHT_COL_X - 6} y2={yMid} stroke="#0ea5e9" strokeWidth="1.5" strokeDasharray="3 3" />
                <circle cx={rightEdge} cy={yMid} r="3" fill="#0ea5e9" />
                <rect x={RIGHT_COL_X} y={yMid - 10} width="70" height="20" rx="10" fill="#fff" stroke="#0ea5e9" strokeWidth="1.5" />
                <text x={RIGHT_COL_X + 35} y={yMid + 4} textAnchor="middle" fill="#0369a1" fontSize="12" fontWeight="700">{val.toLocaleString()}</text>
                {conv && <text x={RIGHT_COL_X + 78} y={yMid + 4} fill="#0284c7" fontSize="10" fontWeight="600">转化 {conv}</text>}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

// ─── 工业六基分布（第一层 6 大类环形图）──────────────────────────
function SixBaseDonut({ byBase, total }: { byBase: Record<string, number>; total: number }) {
  const colors = ["#2563eb", "#0891b2", "#7c3aed", "#10b981", "#f59e0b", "#ec4899"];
  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} 家 ({d}%)" },
    legend: {
      bottom: 0,
      left: "center",
      icon: "circle",
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 6,
      textStyle: { color: "#475569", fontSize: 10 },
      type: "scroll",
    },
    series: [{
      type: "pie",
      radius: ["52%", "76%"],
      center: ["50%", "42%"],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 4 },
      label: {
        show: true,
        position: "center",
        formatter: `{total|${total}}\n{sub|标的池}`,
        rich: {
          total: { fontSize: 22, color: "#0f172a", fontWeight: "bold" },
          sub: { fontSize: 11, color: "#94a3b8", padding: [4, 0, 0, 0] },
        },
      },
      labelLine: { show: false },
      data: INDUSTRIAL_SIX_CATEGORIES.map((name, i) => ({
        name,
        value: byBase[name] ?? 0,
        itemStyle: { color: colors[i % colors.length] },
      })),
    }],
  };
  return (
    <PanelCard title="工业六基分布" subtitle="工业基础能力六大方向（申报核心领域）">
      <EChartsWrapper option={option} height={260} />
    </PanelCard>
  );
}

// ─── 主组件 ───────────────────────────────────────────────────
export default function DashboardClient({ kpi: initialKpi }: { kpi: KPI }) {
  const allowed = useRoleGuard("region_admin");
  const { user, mounted } = useCurrentPCUser();
  const activeQual = useQualStore((s) => s.activeQual);
  const [kpi, setKpi] = useState<KPI>(initialKpi);
  const [smeKpi, setSmeKpi] = useState<SMEDashboardKPI | null>(null);
  const [lgKpi, setLgKpi] = useState<LittleGiantDashboardKPI | null>(null);

  // 登录用户的 city/district 在客户端才能拿到，因此 mount 后按权限重新计算
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    import("@/lib/mock-data").then(({ getDashboardKPI, getSMEDashboardKPI, getLittleGiantDashboardKPI }) => {
      if (cancelled) return;
      setKpi(getDashboardKPI());
      if (activeQual === "little_giant") {
        setLgKpi(getLittleGiantDashboardKPI());
      } else if (activeQual !== "high_tech") {
        setSmeKpi(getSMEDashboardKPI(activeQual as Exclude<typeof activeQual, "high_tech">));
      }
    });
    return () => { cancelled = true; };
  }, [mounted, user.tenantId, activeQual]);

  if (!allowed) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  const qualMeta = QUAL_TYPE_META[activeQual];
  const titleMap: Record<string, string> = {
    high_tech: "2026 年高企申报 · 全景概览",
    innovative_sme: "创新型中小企业 · 入库工作全景",
    specialized_sme: "专精特新中小企业 · 认定工作全景",
    little_giant: '专精特新"小巨人" · 培育工作全景',
  };

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">{titleMap[activeQual]}</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            {getRegionLabel(user)} · {qualMeta.ministry} · 数据来源：工商 · 专利 · 招聘 · 税务
          </p>
        </div>
      </div>

      {activeQual === "high_tech" ? (
        <>
          {/* 第一行：3 张 KPI 卡横排 */}
          <TopKPI
            key="topkpi-high_tech"
            yearGoal={kpi.yearGoal}
            willingDefault={kpi.certified}
            renewalTotal={kpi.renewalTotal}
            newDeclTargets={kpi.newDeclTargets}
          />

          {/* 第二行：企业漏斗 + 街道乡镇分布 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <EnterpriseFunnel kpi={kpi} />
            <StreetDistribution byStreet={kpi.byStreet} />
          </div>

          {/* 第三行：2 列分析卡 */}
          <div className="grid grid-cols-2 gap-4">
            <FieldDonut kpi={kpi} />
            <AgeBar kpi={kpi} />
          </div>
        </>
      ) : activeQual === "little_giant" ? (
        lgKpi ? (
          <>
            {/* 第一行：沿用高企模块的 3 张 KPI 卡结构 */}
            <TopKPI
              key="topkpi-little_giant"
              yearGoal={lgKpi.yearGoal}
              willingDefault={lgKpi.willing}
              renewalTotal={lgKpi.renewalTotal}
              newDeclTargets={lgKpi.newDeclTargets}
              storagePrefix="lg_dash"
            />

            {/* 第二行：五层阶梯漏斗 + 街道乡镇分布 */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <LadderFunnel stages={lgKpi.funnelStages} />
              <StreetDistribution byStreet={lgKpi.byStreet} />
            </div>

            {/* 第三行：工业六基分布 + 成立年限分布 */}
            <div className="grid grid-cols-2 gap-4">
              <SixBaseDonut byBase={lgKpi.byBase} total={lgKpi.poolTotal} />
              <PanelCard title="成立年限分布" subtitle="标的池企业成立年限">
                <EChartsWrapper option={{
                  grid: { left: 36, right: 12, top: 24, bottom: 28 },
                  tooltip: { trigger: "axis" },
                  xAxis: { type: "category", data: Object.keys(lgKpi.byAge), axisLine: { lineStyle: { color: "#e5e7eb" } }, axisTick: { show: false }, axisLabel: { color: "#64748b", fontSize: 10, interval: 0 } },
                  yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8", fontSize: 10 } },
                  series: [{ type: "bar", data: Object.values(lgKpi.byAge), barWidth: 22, itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#60a5fa" }, { offset: 1, color: "#2563eb" }] }, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: "top", color: "#0f172a", fontSize: 11, fontWeight: "bold" } }],
                }} height={260} />
              </PanelCard>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center py-32 text-sm text-[#94a3b8]">加载中…</div>
        )
      ) : smeKpi ? (
        <>
          {/* SME KPI 卡 */}
          <SMETopKPI kpi={smeKpi} qualType={activeQual as Exclude<typeof activeQual, "high_tech">} />

          {/* 第二行：SME 漏斗 + 街道分布 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <SMEFunnel kpi={smeKpi} qualType={activeQual} />
            <StreetDistribution byStreet={smeKpi.byStreet} />
          </div>

          {/* 第三行：领域 + 年限 */}
          <div className="grid grid-cols-2 gap-4">
            <PanelCard title="八大领域分布" subtitle="潜力企业技术领域">
              <EChartsWrapper option={{
                tooltip: { trigger: "item", formatter: "{b}: {c} 家 ({d}%)" },
                legend: { bottom: 0, left: "center", icon: "circle", itemWidth: 7, itemHeight: 7, itemGap: 6, textStyle: { color: "#475569", fontSize: 10 }, type: "scroll" },
                series: [{ type: "pie", radius: ["52%", "76%"], center: ["50%", "42%"], avoidLabelOverlap: false, itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 4 }, label: { show: true, position: "center", formatter: `{total|${smeKpi.potentialCount}}\n{sub|潜力企业}`, rich: { total: { fontSize: 22, color: "#0f172a", fontWeight: "bold" }, sub: { fontSize: 11, color: "#94a3b8", padding: [4, 0, 0, 0] } } }, labelLine: { show: false }, data: Object.entries(smeKpi.byField).map(([name, value], i) => ({ name, value, itemStyle: { color: ["#2563eb","#7c3aed","#0891b2","#10b981","#f59e0b","#f97316","#ec4899","#14b8a6"][i % 8] } })) }],
              }} height={260} />
            </PanelCard>
            <PanelCard title="成立年限分布" subtitle="潜力企业成立年限">
              <EChartsWrapper option={{
                grid: { left: 36, right: 12, top: 24, bottom: 28 },
                tooltip: { trigger: "axis" },
                xAxis: { type: "category", data: Object.keys(smeKpi.byAge), axisLine: { lineStyle: { color: "#e5e7eb" } }, axisTick: { show: false }, axisLabel: { color: "#64748b", fontSize: 10, interval: 0 } },
                yAxis: { type: "value", axisLine: { show: false }, axisTick: { show: false }, splitLine: { lineStyle: { color: "#f1f5f9" } }, axisLabel: { color: "#94a3b8", fontSize: 10 } },
                series: [{ type: "bar", data: Object.values(smeKpi.byAge), barWidth: 22, itemStyle: { color: { type: "linear", x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: "#c4b5fd" }, { offset: 1, color: "#7c3aed" }] }, borderRadius: [4, 4, 0, 0] }, label: { show: true, position: "top", color: "#0f172a", fontSize: 11, fontWeight: "bold" } }],
              }} height={260} />
            </PanelCard>
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center py-32 text-sm text-[#94a3b8]">加载中…</div>
      )}
    </div>
  );
}
