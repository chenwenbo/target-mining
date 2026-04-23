"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { AlertTriangle, Clock, Calendar, ShieldCheck, ChevronRight, RefreshCcw } from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import type { RenewalKPI } from "@/lib/renewal";
import { scoreRenewalReadiness, monthsUntilExpiry } from "@/lib/renewal";
import type { RenewalStatus, CertifiedCompany } from "@/lib/types";
import type { STREETS } from "@/lib/types";

type KPI = RenewalKPI;

// ─── Status helpers ───────────────────────────────────────────
const STATUS_META: Record<RenewalStatus, { label: string; bg: string; text: string; dot: string }> = {
  overdue:    { label: "已过期",   bg: "bg-red-100",    text: "text-red-700",    dot: "bg-red-500" },
  critical:   { label: "紧急",     bg: "bg-orange-100", text: "text-orange-700", dot: "bg-orange-500" },
  approaching:{ label: "预警",     bg: "bg-amber-100",  text: "text-amber-700",  dot: "bg-amber-400" },
  active:     { label: "正常",     bg: "bg-emerald-100",text: "text-emerald-700",dot: "bg-emerald-500" },
};

function StatusBadge({ status }: { status: RenewalStatus }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

// ─── Readiness bar ────────────────────────────────────────────
function ReadinessBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
      </div>
      <span className="text-sm tabular-nums text-[#475569]">{score}</span>
    </div>
  );
}

// ─── Expiry timeline chart ────────────────────────────────────
function ExpiryChart({ expiryByYear }: { expiryByYear: Record<string, number> }) {
  const years = ["2025", "2026", "2027", "2028"].filter((y) => expiryByYear[y] !== undefined);
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: years.map((y) => y + "年"), axisLine: { lineStyle: { color: "#e2e8f0" } } },
    yAxis: { type: "value", minInterval: 1, axisLine: { show: false }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
    series: [
      {
        name: "到期企业数",
        type: "bar",
        data: years.map((y) => expiryByYear[y] || 0),
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const yr = years[params.dataIndex];
            if (yr === "2025") return "#ef4444";
            if (yr === "2026") return "#f97316";
            if (yr === "2027") return "#f59e0b";
            return "#10b981";
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: { show: true, position: "top", fontSize: 12, color: "#475569" },
      },
    ],
    grid: { left: 16, right: 16, top: 20, bottom: 24, containLabel: true },
  };
  return <EChartsWrapper option={option} height={200} />;
}

// ─── Status donut chart ───────────────────────────────────────
function StatusDonut({ kpi }: { kpi: KPI }) {
  const option = {
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: "#64748b" } },
    series: [
      {
        type: "pie",
        radius: ["50%", "75%"],
        data: [
          { name: "已过期", value: kpi.overdue, itemStyle: { color: "#ef4444" } },
          { name: "紧急", value: kpi.critical, itemStyle: { color: "#f97316" } },
          { name: "预警", value: kpi.approaching, itemStyle: { color: "#f59e0b" } },
          { name: "正常", value: kpi.active, itemStyle: { color: "#10b981" } },
        ].filter((d) => d.value > 0),
        label: { show: false },
        emphasis: { label: { show: false } },
      },
    ],
  };
  return <EChartsWrapper option={option} height={200} />;
}

// ─── Main component ───────────────────────────────────────────
type FilterStatus = "all" | RenewalStatus;

export default function RenewalClient({ kpi }: { kpi: KPI }) {
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"expiry" | "score" | "name">("expiry");

  const companies = kpi.companies;

  const filtered = useMemo(() => {
    let list = companies as (CertifiedCompany & { renewalStatus: RenewalStatus })[];

    if (filterStatus !== "all") list = list.filter((c) => c.renewalStatus === filterStatus);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.creditCode.includes(q));
    }

    return [...list].sort((a, b) => {
      if (sortBy === "expiry") return a.expiryYear - b.expiryYear;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      // score: descending
      const sa = scoreRenewalReadiness(a).total;
      const sb = scoreRenewalReadiness(b).total;
      return sb - sa;
    });
  }, [companies, filterStatus, search, sortBy]);

  const filterTabs: { key: FilterStatus; label: string; count: number }[] = [
    { key: "all",        label: "全部",   count: kpi.total },
    { key: "overdue",    label: "已过期", count: kpi.overdue },
    { key: "critical",   label: "紧急",   count: kpi.critical },
    { key: "approaching",label: "预警",   count: kpi.approaching },
    { key: "active",     label: "正常",   count: kpi.active },
  ];

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">复审管理</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            {kpi.total} 家已认定高企 · 共 {kpi.overdue + kpi.critical} 家需立即启动复审
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
          <RefreshCcw className="w-4 h-4" />
          新建复审任务
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="已过期未复审"
          value={kpi.overdue}
          unit="家"
          icon={AlertTriangle}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          delta="须立即处理"
          deltaUp={false}
        />
        <KPICard
          label="紧急（≤6个月）"
          value={kpi.critical}
          unit="家"
          icon={Clock}
          iconBg="bg-orange-50"
          iconColor="text-orange-600"
          delta="2026年内到期"
          deltaUp={false}
        />
        <KPICard
          label="预警（6-12个月）"
          value={kpi.approaching}
          unit="家"
          icon={Calendar}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          delta="2027年到期"
          deltaUp={true}
        />
        <KPICard
          label="状态良好"
          value={kpi.active}
          unit="家"
          icon={ShieldCheck}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          delta="2028年后到期"
          deltaUp={true}
        />
      </div>

      {/* Charts row */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "1.5fr 1fr" }}>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">证书到期年份分布</h2>
          <ExpiryChart expiryByYear={kpi.expiryByYear} />
        </div>
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
          <h2 className="text-sm font-semibold text-[#0f172a] mb-4">复审状态总览</h2>
          <StatusDonut kpi={kpi} />
        </div>
      </div>

      {/* Company list */}
      <div className="bg-white rounded-xl border border-[#e2e8f0]">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f1f5f9]">
          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterStatus === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 ${filterStatus === tab.key ? "text-blue-100" : "text-[#94a3b8]"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          {/* Search */}
          <input
            type="text"
            placeholder="搜索企业名称..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-44 px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg bg-[#f8fafc] placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-blue-400"
          />

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#475569] focus:outline-none"
          >
            <option value="expiry">按到期时间</option>
            <option value="score">按准备度得分</option>
            <option value="name">按名称</option>
          </select>

          <span className="text-xs text-[#94a3b8]">共 {filtered.length} 家</span>
        </div>

        {/* Table */}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
              <th className="px-5 py-3 text-left text-xs font-medium text-[#94a3b8] w-[220px]">企业名称</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">认定年份</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">到期年份</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">紧迫度</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8]">复审准备度</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">高新收入比</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">研发投入比</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">街道</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-[#94a3b8]">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f8fafc]">
            {filtered.map((c) => {
              const score = scoreRenewalReadiness(c);
              const months = monthsUntilExpiry(c.expiryYear);
              const m = c.threeYearMetrics;
              const avgHt = ((m.hiTechRevenueRatioY1 + m.hiTechRevenueRatioY2 + m.hiTechRevenueRatioY3) / 3).toFixed(1);
              const avgRd = ((m.rdExpenseRatioY1 + m.rdExpenseRatioY2 + m.rdExpenseRatioY3) / 3).toFixed(1);
              return (
                <tr key={c.id} className="hover:bg-[#f8fafc] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-[#0f172a] leading-snug">{c.name}</div>
                    <div className="text-xs text-[#94a3b8] mt-0.5">{c.certNo}</div>
                  </td>
                  <td className="px-4 py-3.5 text-center text-[#475569]">{c.certifiedYear}</td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={months < 0 ? "text-red-600 font-semibold" : "text-[#475569]"}>
                      {c.expiryYear}
                    </span>
                    {months < 0 && (
                      <div className="text-xs text-red-500">已过期 {Math.abs(months)} 月</div>
                    )}
                    {months >= 0 && (
                      <div className="text-xs text-[#94a3b8]">剩 {months} 个月</div>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <StatusBadge status={c.renewalStatus} />
                  </td>
                  <td className="px-4 py-3.5">
                    <ReadinessBar score={score.total} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={+avgHt >= 60 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                      {avgHt}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <span className={+avgRd >= 6 ? "text-emerald-600 font-medium" : "text-red-500 font-medium"}>
                      {avgRd}%
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-center text-xs text-[#64748b]">{c.street}</td>
                  <td className="px-4 py-3.5 text-right">
                    <Link
                      href={`/targets/${c.id}`}
                      className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      复审分析 <ChevronRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center text-sm text-[#94a3b8]">暂无符合条件的企业</div>
        )}
      </div>
    </div>
  );
}
