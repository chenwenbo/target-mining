"use client";
import { useMemo } from "react";
import Link from "next/link";
import { useWeightsStore } from "@/store/weights";
import { getPotentialTargets } from "@/lib/mock-data";
import { scoreCompany } from "@/lib/scoring";
import { DEFAULT_WEIGHTS } from "@/lib/types";
import TierBadge from "@/components/ui/TierBadge";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import { RotateCcw, ChevronRight, Info } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Tier } from "@/lib/types";

const DIMENSION_META = [
  {
    key: "ip" as const,
    label: "知识产权",
    en: "Intellectual Property",
    desc: "发明专利、实用新型、外观设计、软件著作权的数量与质量",
    detail: "发明专利 ×10 + 实用新型 ×3 + 外观设计 ×1 + 软著 ×2，封顶 85 分后归一化",
    basis: "《高新技术企业认定管理工作指引》第四条：核心自主知识产权是认定的基本要件",
    color: "text-blue-700",
    bg: "bg-blue-50",
    border: "border-blue-200",
    barColor: "bg-blue-500",
  },
  {
    key: "scale" as const,
    label: "规模与成长",
    en: "Scale & Growth",
    desc: "企业参保人数、注册资本、成立年限、是否入库科技型中小企业",
    detail: "参保人数 0-35 分 + 注册资本 0-30 分 + 成立年限 0-25 分 + 入库加成 10 分",
    basis: "认定指引要求企业具备持续研发投入能力，规模是能力的代理指标",
    color: "text-purple-700",
    bg: "bg-purple-50",
    border: "border-purple-200",
    barColor: "bg-purple-500",
  },
  {
    key: "field" as const,
    label: "领域匹配",
    en: "Field Match",
    desc: "经营范围与专利 IPC 是否命中国家重点支持八大高新技术领域",
    detail: "命中八大领域 100 分，未命中 0 分；边缘行业给 50 分",
    basis: "《高新技术企业认定管理办法》第十一条：产品（服务）须属于八大领域",
    color: "text-teal-700",
    bg: "bg-teal-50",
    border: "border-teal-200",
    barColor: "bg-teal-500",
  },
  {
    key: "rd" as const,
    label: "研发强度",
    en: "R&D Intensity",
    desc: "研发人员占全员比例（招聘数据推算）",
    detail: "≥30% → 100分，≥20% → 80分，≥10% → 55分，≥5% → 30分，<5% → 10分",
    basis: "认定硬性要求：研发人员占企业当年职工总数比例不低于 10%",
    color: "text-emerald-700",
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    barColor: "bg-emerald-500",
  },
  {
    key: "compliance" as const,
    label: "合规状态",
    en: "Compliance",
    desc: "近一年是否存在经营异常或行政处罚记录",
    detail: "无任何记录 100 分；存在经营异常 -50 分；存在行政处罚 -50 分",
    basis: "认定要求：近一年内无重大安全、质量、环境违法行为，且无严重失信情形",
    color: "text-red-700",
    bg: "bg-red-50",
    border: "border-red-200",
    barColor: "bg-red-400",
  },
  {
    key: "growth" as const,
    label: "成长性",
    en: "Growth",
    desc: "知识产权总量作为技术积累与成长能力的代理指标",
    detail: "知识产权总数 ≥20 → 100，≥10 → 80，≥5 → 60，≥2 → 40，<2 → 20",
    basis: "综合成长性反映企业创新持续性，是申报评审的重要软性指标",
    color: "text-amber-700",
    bg: "bg-amber-50",
    border: "border-amber-200",
    barColor: "bg-amber-400",
  },
];

// ─── Weight Slider ────────────────────────────────────────────
function WeightSlider({
  meta,
  value,
  onChange,
}: {
  meta: (typeof DIMENSION_META)[0];
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = Math.round(value * 100);
  return (
    <div className={cn("rounded-xl border p-5", meta.border, meta.bg)}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className={cn("text-base font-semibold", meta.color)}>{meta.label}</div>
          <div className="text-xs text-[#94a3b8] mt-0.5">{meta.en}</div>
        </div>
        <div className={cn("text-2xl font-bold tabular-nums", meta.color)}>{pct}%</div>
      </div>
      <input
        type="range"
        min={0}
        max={50}
        step={1}
        value={pct}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/60"
        style={{
          background: `linear-gradient(to right, ${meta.barColor.replace("bg-", "").includes("500") ? "#3b82f6" : "#a78bfa"} 0%, ${meta.barColor.replace("bg-", "").includes("500") ? "#3b82f6" : "#a78bfa"} ${pct * 2}%, #e2e8f0 ${pct * 2}%, #e2e8f0 100%)`,
        }}
      />
      <div className="mt-3 text-xs text-[#475569]">{meta.desc}</div>
      <details className="mt-2">
        <summary className="text-[11px] text-[#94a3b8] cursor-pointer hover:text-blue-600 flex items-center gap-1">
          <Info size={10} /> 计算规则 & 政策依据
        </summary>
        <div className="mt-2 space-y-1.5 text-[11px] text-[#64748b] pl-1 border-l-2 border-[#e5e7eb]">
          <p><span className="font-medium text-[#0f172a]">计算方式：</span>{meta.detail}</p>
          <p><span className="font-medium text-[#0f172a]">政策依据：</span>{meta.basis}</p>
        </div>
      </details>
    </div>
  );
}

// ─── Tier Distribution Preview ────────────────────────────────
function TierPreview({ byTier }: { byTier: Record<Tier, number> }) {
  const total = Object.values(byTier).reduce((s, v) => s + v, 0);
  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} 家" },
    series: [{
      type: "pie",
      radius: ["50%", "75%"],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: "#fff", borderWidth: 3 },
      label: {
        show: true, position: "center",
        formatter: `{t|${total}}\n{s|潜在标的}`,
        rich: {
          t: { fontSize: 22, color: "#0f172a", fontWeight: "bold" },
          s: { fontSize: 11, color: "#94a3b8" },
        },
      },
      labelLine: { show: false },
      data: [
        { value: byTier.A, name: "A 类 · 可立即申报", itemStyle: { color: "#10b981" } },
        { value: byTier.B, name: "B 类 · 缺 1-2 项", itemStyle: { color: "#2563eb" } },
        { value: byTier.C, name: "C 类 · 中远期培育", itemStyle: { color: "#f59e0b" } },
        { value: byTier.D, name: "D 类 · 暂不推荐", itemStyle: { color: "#cbd5e1" } },
      ],
    }],
    legend: {
      orient: "vertical", right: 0, top: "middle",
      icon: "circle", itemWidth: 8, itemHeight: 8,
      textStyle: { color: "#475569", fontSize: 11 },
    },
  };
  return <EChartsWrapper option={option} height={180} />;
}

// ─── Main ─────────────────────────────────────────────────────
export default function ModelPage() {
  const { weights, setWeight, resetWeights } = useWeightsStore();

  const totalWeight = Math.round(
    Object.values(weights).reduce((s, v) => s + v, 0) * 100
  );
  const weightOk = Math.abs(totalWeight - 100) <= 1;

  // Recompute tier distribution when weights change
  const byTier = useMemo((): Record<Tier, number> => {
    const companies = getPotentialTargets();
    const result = { A: 0, B: 0, C: 0, D: 0 } as Record<Tier, number>;
    for (const c of companies) {
      const tier = scoreCompany(c, weights).tier;
      result[tier]++;
    }
    return result;
  }, [weights]);

  // Top 5 after reweight
  const top5 = useMemo(() => {
    return getPotentialTargets()
      .map((c) => ({ ...c, score: scoreCompany(c, weights) }))
      .sort((a, b) => b.score.total - a.score.total)
      .slice(0, 5);
  }, [weights]);

  return (
    <div>
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">算法模型说明</h1>
          <p className="text-sm text-[#94a3b8] mt-1">调整各维度权重，全站评分实时重算 · 可保存为本地配置</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={resetWeights}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm border border-[#e5e7eb] bg-white rounded-lg text-[#475569] hover:bg-[#f7f8fa] transition-colors"
          >
            <RotateCcw size={12} /> 恢复默认
          </button>
          <Link
            href="/targets"
            className="flex items-center gap-1 px-3.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            应用到标的池 <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <div className="grid gap-6" style={{ gridTemplateColumns: "1fr 340px" }}>
        {/* ─── Left: sliders ─── */}
        <div>
          {/* Weight sum indicator */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3 rounded-lg border mb-5 text-sm",
            weightOk ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-red-50 border-red-200 text-red-800"
          )}>
            <span>
              {weightOk ? "✓ 权重配置有效" : "⚠ 权重合计应为 100%"}
            </span>
            <span className="font-bold tabular-nums">当前合计：{totalWeight}%</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {DIMENSION_META.map((meta) => (
              <WeightSlider
                key={meta.key}
                meta={meta}
                value={weights[meta.key]}
                onChange={(v) => setWeight(meta.key, v)}
              />
            ))}
          </div>

          {/* Default weights comparison */}
          <div className="mt-5 bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-4">与默认权重对比</h3>
            <div className="space-y-3">
              {DIMENSION_META.map((meta) => {
                const current = Math.round(weights[meta.key] * 100);
                const def = Math.round(DEFAULT_WEIGHTS[meta.key] * 100);
                const diff = current - def;
                return (
                  <div key={meta.key} className="flex items-center gap-3 text-xs">
                    <span className={cn("w-20 font-medium", meta.color)}>{meta.label}</span>
                    <div className="flex-1 h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full", meta.barColor)} style={{ width: `${current * 2}%` }} />
                    </div>
                    <span className="w-10 text-right tabular-nums text-[#475569]">{current}%</span>
                    {diff !== 0 && (
                      <span className={cn("w-12 text-right tabular-nums font-semibold", diff > 0 ? "text-blue-600" : "text-red-500")}>
                        {diff > 0 ? `+${diff}` : diff}%
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ─── Right: live preview ─── */}
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-1">实时分档预览</h3>
            <p className="text-xs text-[#94a3b8] mb-3">拖动左侧滑块后即时更新</p>
            <TierPreview byTier={byTier} />
            <div className="grid grid-cols-2 gap-2 mt-3">
              {(["A","B","C","D"] as Tier[]).map((t) => (
                <div key={t} className="flex items-center justify-between px-3 py-2 bg-[#f7f8fa] rounded-lg">
                  <TierBadge tier={t} size="sm" />
                  <span className="text-sm font-bold text-[#0f172a] tabular-nums">{byTier[t]}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">当前权重下 Top 5</h3>
            <div className="space-y-3">
              {top5.map((c, i) => (
                <Link
                  key={c.id}
                  href={`/targets/${c.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[#f7f8fa] transition-colors group"
                >
                  <span className="w-5 text-xs font-bold text-[#94a3b8] tabular-nums">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[#0f172a] truncate group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </div>
                    <div className="text-[11px] text-[#94a3b8]">{c.street}</div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-bold text-[#0f172a] tabular-nums">{c.score.total}</div>
                    <TierBadge tier={c.score.tier} size="sm" />
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800">
            <p className="font-semibold mb-1">💡 权重调整提示</p>
            <ul className="space-y-1 list-disc list-inside text-amber-700">
              <li>权重合计须为 100%，否则评分将自动归一化</li>
              <li>调整保存在浏览器本地，刷新后依然有效</li>
              <li>建议与街道经办人、政府部门充分讨论后再固化权重</li>
              <li>不同区域、不同年度可保存不同配置方案</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
