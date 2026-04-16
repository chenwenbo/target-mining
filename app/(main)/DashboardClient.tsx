"use client";
import Link from "next/link";
import { Target, CheckSquare, TrendingUp, Award, ArrowRight } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import TierBadge from "@/components/ui/TierBadge";
import ScoreBar from "@/components/ui/ScoreBar";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import type { ScoredCompany } from "@/lib/types";
import type { getDashboardKPI } from "@/lib/mock-data";

type KPI = ReturnType<typeof getDashboardKPI>;

// ─── Street Distribution ──────────────────────────────────────
function StreetDistribution({ byStreet }: { byStreet: Record<string, number> }) {
  const sorted = Object.entries(byStreet).sort((a, b) => b[1] - a[1]);
  const max = sorted[0]?.[1] ?? 1;
  return (
    <div className="space-y-2.5">
      {sorted.map(([street, count]) => (
        <div key={street} className="grid items-center gap-3" style={{ gridTemplateColumns: "130px 1fr 36px" }}>
          <span className="text-sm text-[#0f172a] font-medium truncate">{street}</span>
          <div className="h-2 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
              style={{ width: `${(count / max) * 100}%` }}
            />
          </div>
          <span className="text-sm font-semibold text-[#475569] tabular-nums text-right">{count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Tier Funnel ─────────────────────────────────────────────
function TierFunnel({ byTier }: { byTier: Record<string, number> }) {
  const total = Object.values(byTier).reduce((s, v) => s + v, 0);
  const tiers = [
    { key: "A", label: "A 类 · 可立即申报", desc: "≥ 80 分", bg: "bg-emerald-50", bar: "bg-emerald-500", text: "text-emerald-700", badge: "bg-emerald-500" },
    { key: "B", label: "B 类 · 缺 1-2 项", desc: "60-79 分", bg: "bg-blue-50", bar: "bg-blue-500", text: "text-blue-700", badge: "bg-blue-500" },
    { key: "C", label: "C 类 · 中远期培育", desc: "40-59 分", bg: "bg-amber-50", bar: "bg-amber-400", text: "text-amber-700", badge: "bg-amber-400" },
    { key: "D", label: "D 类 · 暂不推荐", desc: "< 40 分", bg: "bg-slate-50", bar: "bg-slate-300", text: "text-slate-500", badge: "bg-slate-300" },
  ] as const;

  return (
    <div className="space-y-3">
      {tiers.map(({ key, label, desc, bg, bar, text, badge }) => {
        const count = byTier[key] ?? 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={key} className={`rounded-lg p-3.5 border ${bg} relative overflow-hidden`}>
            <div
              className={`absolute inset-y-0 left-0 ${bar} opacity-10`}
              style={{ width: `${pct}%` }}
            />
            <div className="relative flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className={`w-7 h-7 rounded-md ${badge} flex items-center justify-center text-white font-bold text-xs`}>{key}</span>
                <div>
                  <div className={`text-sm font-semibold ${text}`}>{label}</div>
                  <div className="text-xs text-[#94a3b8]">{desc}</div>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xl font-bold text-[#0f172a] tabular-nums">{count}</span>
                <span className="text-xs text-[#94a3b8] ml-1">{pct}%</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Top 10 Table ─────────────────────────────────────────────
function Top10Table({ companies }: { companies: ScoredCompany[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-[#f7f8fa] border-t border-b border-[#e5e7eb]">
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-10">#</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">企业名称</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-44">综合评分</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-24">分档</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">领域</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">街道 / 园区</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-16">专利</th>
            <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-16">参保</th>
            <th className="px-3 py-3 w-16" />
          </tr>
        </thead>
        <tbody className="divide-y divide-[#f1f5f9]">
          {companies.map((c, i) => (
            <tr key={c.id} className="hover:bg-[#fafbfc] transition-colors group">
              <td className="px-3 py-3.5">
                <span className={`inline-block w-6 h-6 rounded text-center text-xs font-bold leading-6
                  ${i === 0 ? "bg-amber-100 text-amber-700" : i === 1 ? "bg-slate-100 text-slate-600" : i === 2 ? "bg-orange-100 text-orange-700" : "text-[#94a3b8]"}`}>
                  {i + 1}
                </span>
              </td>
              <td className="px-3 py-3.5">
                <span className="font-medium text-[#0f172a] group-hover:text-blue-600 transition-colors">{c.name}</span>
              </td>
              <td className="px-3 py-3.5">
                <ScoreBar score={c.score.total} size="sm" />
              </td>
              <td className="px-3 py-3.5">
                <TierBadge tier={c.score.tier} size="sm" />
              </td>
              <td className="px-3 py-3.5">
                <span className="inline-block px-2 py-0.5 bg-[#f1f5f9] text-[#475569] text-xs rounded">
                  {c.techField ?? "—"}
                </span>
              </td>
              <td className="px-3 py-3.5 text-[#475569]">{c.street}</td>
              <td className="px-3 py-3.5 text-[#475569] tabular-nums">
                {c.patents.invention + c.patents.utility + c.patents.design + c.software}
              </td>
              <td className="px-3 py-3.5 text-[#475569] tabular-nums">{c.employees}</td>
              <td className="px-3 py-3.5">
                <Link
                  href={`/targets/${c.id}`}
                  className="text-xs text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  详情 ↗
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────
export default function DashboardClient({ kpi }: { kpi: KPI }) {
  const donutOption = {
    tooltip: { trigger: "item", formatter: "{b}: {c} 家 ({d}%)" },
    legend: {
      orient: "vertical", right: 8, top: "middle",
      icon: "circle", itemWidth: 8, itemHeight: 8, itemGap: 10,
      textStyle: { color: "#475569", fontSize: 12 },
    },
    series: [{
      type: "pie",
      radius: ["55%", "80%"],
      center: ["34%", "50%"],
      avoidLabelOverlap: false,
      itemStyle: { borderColor: "#ffffff", borderWidth: 3, borderRadius: 4 },
      label: {
        show: true, position: "center",
        formatter: `{total|${kpi.total}}\n{sub|潜在标的}`,
        rich: {
          total: { fontSize: 26, color: "#0f172a", fontWeight: "bold" },
          sub: { fontSize: 12, color: "#94a3b8", padding: [6, 0, 0, 0] },
        },
      },
      emphasis: { label: { show: true } },
      labelLine: { show: false },
      data: Object.entries(kpi.byField).map(([name, value], i) => ({
        name, value,
        itemStyle: { color: ["#2563eb","#7c3aed","#0891b2","#10b981","#f59e0b","#f97316","#ec4899"][i % 7] },
      })),
    }],
  };

  const barOption = {
    grid: { left: 40, right: 16, top: 16, bottom: 30 },
    tooltip: { trigger: "axis" },
    xAxis: {
      type: "category",
      data: Object.keys(kpi.byAge),
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisTick: { show: false },
      axisLabel: { color: "#64748b", fontSize: 12 },
    },
    yAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#94a3b8", fontSize: 11 },
    },
    series: [{
      type: "bar",
      data: Object.values(kpi.byAge),
      barWidth: 36,
      itemStyle: {
        color: {
          type: "linear", x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: "#60a5fa" },
            { offset: 1, color: "#2563eb" },
          ],
        },
        borderRadius: [6, 6, 0, 0],
      },
      label: { show: true, position: "top", color: "#0f172a", fontSize: 12, fontWeight: "bold" },
    }],
  };

  return (
    <div>
      {/* Page header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">2026 年高企申报 · 全景概览</h1>
          <p className="text-sm text-[#94a3b8] mt-1">东西湖区 · 数据来源：工商 · 专利 · 招聘 · 税务</p>
        </div>
        <div className="flex gap-2">
          <button className="px-3.5 py-2 text-sm border border-[#e5e7eb] bg-white rounded-lg text-[#475569] hover:bg-[#f7f8fa] transition-colors">
            导出报告
          </button>
          <Link
            href="/targets"
            className="px-3.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5"
          >
            进入标的池 <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <KPICard
          label="本年度申报目标"
          value={kpi.yearGoal}
          unit="家"
          delta={`较去年 +20 家（+20%）`}
          icon={Target}
          iconColor="text-blue-600"
          iconBg="bg-blue-50"
        />
        <KPICard
          label="本年度已认定"
          value={kpi.certified}
          unit={`家 · ${((kpi.certified / kpi.yearGoal) * 100).toFixed(1)}%`}
          delta="本月新增认定 +6 家"
          icon={CheckSquare}
          iconColor="text-emerald-600"
          iconBg="bg-emerald-50"
        />
        <KPICard
          label="系统识别潜在标的"
          value={kpi.total}
          unit="家"
          delta="本月新识别 +34 家"
          icon={Award}
          iconColor="text-purple-600"
          iconBg="bg-purple-50"
        />
        <KPICard
          label="预计年度完成率"
          value={kpi.estimatedCompletion}
          unit="% · 超额 23 家"
          delta="依赖 B 类标的转化 36 家"
          deltaUp={false}
          icon={TrendingUp}
          iconColor="text-amber-600"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Street + Tier */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0f172a]">街道 / 园区分布</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">按潜在标的数量排序 · 共 10 个辖区</p>
            </div>
            <Link href="/targets" className="text-xs text-blue-600 hover:underline">查看全部 ▸</Link>
          </div>
          <div className="p-5">
            <StreetDistribution byStreet={kpi.byStreet} />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-start justify-between">
            <div>
              <h2 className="text-sm font-semibold text-[#0f172a]">置信度分档</h2>
              <p className="text-xs text-[#94a3b8] mt-0.5">A / B / C / D 四档评级</p>
            </div>
            <Link href="/model" className="text-xs text-blue-600 hover:underline">调整规则 ▸</Link>
          </div>
          <div className="p-5">
            <TierFunnel byTier={kpi.byTier} />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 mb-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e7eb]">
            <h2 className="text-sm font-semibold text-[#0f172a]">八大领域分布</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">国家重点支持高新技术领域</p>
          </div>
          <div className="p-4">
            <EChartsWrapper option={donutOption} height={260} />
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
          <div className="px-5 py-4 border-b border-[#e5e7eb]">
            <h2 className="text-sm font-semibold text-[#0f172a]">成立年限分布</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">高企认定偏好 3-8 年期企业</p>
          </div>
          <div className="p-4">
            <EChartsWrapper option={barOption} height={260} />
          </div>
        </div>
      </div>

      {/* Top 10 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-start justify-between">
          <div>
            <h2 className="text-sm font-semibold text-[#0f172a]">高置信标的 · Top 10</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">按综合评分降序排列 · 点击查看详情与打分依据</p>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 text-xs border border-[#e5e7eb] bg-white rounded-md text-[#475569] hover:bg-[#f7f8fa] transition-colors">
              批量派发
            </button>
            <button className="px-3 py-1.5 text-xs border border-[#e5e7eb] bg-white rounded-md text-[#475569] hover:bg-[#f7f8fa] transition-colors">
              导出 CSV
            </button>
          </div>
        </div>
        <Top10Table companies={kpi.top10 as ScoredCompany[]} />
      </div>
    </div>
  );
}
