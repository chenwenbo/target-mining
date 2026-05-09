"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Building2,
  Users,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import TenantStatusBadge from "@/components/ops/TenantStatusBadge";
import { getTenants, type Tenant } from "@/lib/ops-mock";
import {
  getPlatformKPI,
  getLast6MonthLabels,
  sortTenantsByActivity,
} from "@/lib/ops-stats";

function formatRelativeTime(isoStr: string | null): string {
  if (!isoStr) return "从未登录";
  const diff = Date.now() - new Date(isoStr).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "刚刚";
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

export default function OpsDashboardClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTenants(getTenants());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  const kpi = getPlatformKPI(tenants);
  const monthLabels = getLast6MonthLabels();
  const activeTenants = sortTenantsByActivity(tenants).slice(0, 6);

  // 月度新增租户柱图
  const onboardingOption = {
    tooltip: { trigger: "axis" as const },
    xAxis: { type: "category" as const, data: monthLabels, axisLine: { lineStyle: { color: "#e5e7eb" } }, axisLabel: { color: "#94a3b8", fontSize: 11 } },
    yAxis: { type: "value" as const, minInterval: 1, axisLabel: { color: "#94a3b8", fontSize: 11 }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
    series: [
      {
        type: "bar",
        data: kpi.monthlyOnboarding,
        itemStyle: { color: "#f59e0b", borderRadius: [4, 4, 0, 0] },
        barMaxWidth: 40,
        name: "新增租户",
      },
    ],
    grid: { top: 16, right: 16, bottom: 20, left: 36 },
  };

  // 企业分布环图
  const distributeOption = {
    tooltip: { trigger: "item" as const, formatter: "{b}: {c} 家 ({d}%)" },
    legend: { orient: "vertical" as const, right: 10, top: "center", textStyle: { fontSize: 11, color: "#475569" } },
    series: [
      {
        type: "pie",
        radius: ["45%", "70%"],
        center: ["38%", "50%"],
        data: tenants.map((t) => ({ name: t.district, value: t.stats.companyCount })),
        label: { show: false },
        itemStyle: { borderRadius: 4, borderWidth: 2, borderColor: "#fff" },
      },
    ],
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">平台概览</h1>
        <p className="text-sm text-[#64748b] mt-1">全平台租户与资源数据汇总</p>
      </div>

      {/* KPI 卡片行 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="总租户数"
          value={kpi.totalTenants}
          unit="个"
          icon={Building2}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          subItems={[
            { label: "活跃", value: kpi.activeTenants },
            { label: "试用", value: kpi.trialTenants },
          ]}
        />
        <KPICard
          label="活跃租户"
          value={kpi.activeTenants}
          unit="个"
          icon={TrendingUp}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          subItems={[
            { label: "到期", value: kpi.expiredTenants },
            { label: "禁用", value: kpi.disabledTenants },
          ]}
        />
        <KPICard
          label="平台总企业数"
          value={kpi.totalCompanies.toLocaleString()}
          unit="家"
          icon={Users}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
        />
        <KPICard
          label="平台总任务数"
          value={kpi.totalTasks.toLocaleString()}
          unit="条"
          icon={BarChart3}
          iconBg="bg-violet-50"
          iconColor="text-violet-600"
          subItems={[
            { label: "走访", value: kpi.totalVisits },
            { label: "评估", value: kpi.totalAssessments },
          ]}
        />
      </div>

      {/* 图表行 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 月度新增趋势 */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">月度新增租户趋势</h3>
          <EChartsWrapper option={onboardingOption} height={200} />
        </div>

        {/* 企业分布 */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">企业分布（各租户占比）</h3>
          <EChartsWrapper option={distributeOption} height={200} />
        </div>
      </div>

      {/* 租户活跃度排行 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#f1f5f9]">
          <h3 className="text-sm font-semibold text-[#0f172a]">租户活跃度排行</h3>
          <Link
            href="/ops/tenants"
            className="text-xs text-amber-600 hover:text-amber-700 transition-colors font-medium"
          >
            查看全部 →
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9]">
                <th className="text-left text-xs text-[#94a3b8] font-medium px-5 py-3">租户</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">状态</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-3 py-3">企业数</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-3 py-3">任务数</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-5 py-3">最近登录</th>
              </tr>
            </thead>
            <tbody>
              {activeTenants.map((t) => (
                <tr key={t.id} className="border-b border-[#f7f8fa] last:border-0 hover:bg-[#fafafa] transition-colors">
                  <td className="px-5 py-3">
                    <Link
                      href={`/ops/tenants/${t.id}`}
                      className="font-medium text-[#0f172a] hover:text-amber-700 transition-colors"
                    >
                      {t.name}
                    </Link>
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">{t.adminUsername}</div>
                  </td>
                  <td className="px-3 py-3">
                    <TenantStatusBadge status={t.status} />
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-[#475569]">
                    {t.stats.companyCount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3 text-right tabular-nums text-[#475569]">
                    {t.stats.taskCount}
                  </td>
                  <td className="px-5 py-3 text-right text-[#94a3b8] text-xs">
                    {formatRelativeTime(t.stats.lastLoginAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
