"use client";
import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  ClipboardList,
  Users,
  CheckCircle2,
  TrendingUp,
  Clock,
  MapPin,
  Activity,
  RotateCw,
} from "lucide-react";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import { getVisitRecords, getTaskStatusOverrides, initSeedVisitRecords } from "@/lib/mobile-mock";
import { useCurrentPCUser } from "@/lib/account-mock";
import type { Company, Street, Task, TaskStatus, VisitRecord } from "@/lib/types";
import {
  computeKPI,
  computeWillingnessDist,
  computeMethodDist,
  computeStreetBreakdown,
  computeVisitorRanking,
  computeFieldVerifiedDist,
  computeKeywordTop,
  WILLINGNESS_META,
  WILLINGNESS_ORDER,
} from "./aggregations";

interface Props {
  companies: Company[];
  tasks: Task[];
}

export default function SurveyStatsClient({ companies, tasks }: Props) {
  const [mounted, setMounted] = useState(false);
  const [version, setVersion] = useState(0);
  const [records, setRecords] = useState<VisitRecord[]>([]);
  const [taskStatusOverrides, setTaskStatusOverrides] = useState<Record<string, TaskStatus>>({});
  const { user, mounted: userMounted } = useCurrentPCUser();

  // 街道管理员视角：按 street 过滤数据；区域管理员视角：保持全量
  const lockedStreet: Street | null =
    userMounted && user.role === "street_admin" && user.street
      ? (user.street as Street)
      : null;

  useEffect(() => {
    initSeedVisitRecords();
    setRecords(getVisitRecords());
    setTaskStatusOverrides(getTaskStatusOverrides());
    setMounted(true);
  }, [version]);

  // 按街道范围裁剪原始输入；街道管理员只看本街道企业、任务、记录
  const scopedCompanies = useMemo(
    () => (lockedStreet ? companies.filter((c) => c.street === lockedStreet) : companies),
    [companies, lockedStreet],
  );
  const scopedTasks = useMemo(
    () => (lockedStreet ? tasks.filter((t) => t.street === lockedStreet) : tasks),
    [tasks, lockedStreet],
  );
  const scopedRecords = useMemo(() => {
    if (!lockedStreet) return records;
    const allowedCompanyIds = new Set(scopedCompanies.map((c) => c.id));
    const allowedTaskIds = new Set(scopedTasks.map((t) => t.id));
    return records.filter(
      (r) => allowedCompanyIds.has(r.companyId) || allowedTaskIds.has(r.taskId),
    );
  }, [records, scopedCompanies, scopedTasks, lockedStreet]);

  const inputs = useMemo(
    () => ({
      records: scopedRecords,
      companies: scopedCompanies,
      tasks: scopedTasks,
      taskStatusOverrides,
    }),
    [scopedRecords, scopedCompanies, scopedTasks, taskStatusOverrides],
  );

  const kpi = useMemo(() => computeKPI(inputs), [inputs]);
  const willingness = useMemo(() => computeWillingnessDist(scopedRecords), [scopedRecords]);
  const methods = useMemo(() => computeMethodDist(scopedRecords), [scopedRecords]);
  const streetBreakdown = useMemo(() => computeStreetBreakdown(inputs), [inputs]);
  const visitors = useMemo(() => computeVisitorRanking(scopedRecords), [scopedRecords]);
  const fieldDist = useMemo(() => computeFieldVerifiedDist(scopedRecords), [scopedRecords]);
  const obstacleKeywords = useMemo(
    () => computeKeywordTop(scopedRecords, "keyObstacles", 12),
    [scopedRecords]
  );
  const commitmentKeywords = useMemo(
    () => computeKeywordTop(scopedRecords, "companyCommitments", 12),
    [scopedRecords]
  );

  if (!mounted) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  const isEmpty = scopedRecords.length === 0;

  return (
    <div>
      {/* 头部 */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a] flex items-center gap-2">
            <ClipboardList size={20} className="text-blue-600" />
            摸排统计
            {lockedStreet && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-blue-50 border border-blue-100 rounded text-[11px] font-normal text-blue-700">
                <Building2 size={10} />
                {lockedStreet} · 仅本街道
              </span>
            )}
          </h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            走访摸排表数据汇总 · 共 {scopedRecords.length} 条记录
            {!lockedStreet && kpi.coveredStreets > 0 && ` · 覆盖 ${kpi.coveredStreets} 个街道`}
          </p>
        </div>
        <button
          onClick={() => setVersion((v) => v + 1)}
          className="flex items-center gap-1.5 px-3 py-2 text-sm text-[#475569] bg-white border border-[#e5e7eb] rounded-lg hover:bg-[#f7f8fa] transition-colors"
          title="重新读取最新摸排数据"
        >
          <RotateCw size={13} /> 刷新
        </button>
      </div>

      {isEmpty ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {/* ① KPI */}
          <KPIGrid kpi={kpi} />

          {/* ② / ③ 意愿 + 走访方式 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-2">
              <PanelCard title="申报意愿分布" subtitle={`基于 ${scopedRecords.length} 条走访记录`}>
                <WillingnessPie data={willingness} />
              </PanelCard>
            </div>
            <PanelCard title="走访方式构成" subtitle="上门 vs 线上沟通">
              <MethodPie data={methods} />
            </PanelCard>
          </div>

          {/* ④ 街道横向对比（街道管理员视角下仅一条街道，隐藏对比图表） */}
          {!lockedStreet && (
            <PanelCard title="按街道横向对比" subtitle="走访量 + 意愿层级堆叠">
              <StreetStackedBar rows={streetBreakdown} />
            </PanelCard>
          )}

          {/* ⑤ 走访员排行 */}
          <PanelCard title="走访员排行" subtitle="按走访次数排序,显示意愿转化率">
            <VisitorTable rows={visitors} />
          </PanelCard>

          {/* ⑥-⑧ 企业自述 */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <PanelCard title="企业规模(参保员工)" subtitle="按区间分布">
              <SimpleBar buckets={fieldDist.empBuckets} color="#3b82f6" />
            </PanelCard>
            <PanelCard title="研发投入比例" subtitle="研发费用占年营收比">
              <SimpleBar buckets={fieldDist.rdBuckets} color="#8b5cf6" />
            </PanelCard>
            <PanelCard title="年营收档位" subtitle="企业自述区间">
              <SimpleBar buckets={fieldDist.revBuckets} color="#10b981" />
            </PanelCard>
          </div>

          {/* ⑨ 关键词 */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <PanelCard title="高频企业障碍" subtitle="走访员记录的关键障碍词频 Top 12">
              <KeywordList items={obstacleKeywords} accent="amber" />
            </PanelCard>
            <PanelCard title="高频企业承诺/反馈" subtitle="企业表态及承诺词频 Top 12">
              <KeywordList items={commitmentKeywords} accent="emerald" />
            </PanelCard>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── 空状态 ────────────────────────────────────────────────
function EmptyState() {
  return (
    <div className="rounded-xl border-2 border-dashed border-[#e5e7eb] bg-white p-16 text-center">
      <div className="w-12 h-12 mx-auto rounded-xl bg-blue-50 flex items-center justify-center mb-4">
        <ClipboardList size={22} className="text-blue-600" />
      </div>
      <div className="text-base font-semibold text-[#0f172a] mb-1.5">暂无摸排数据</div>
      <p className="text-sm text-[#94a3b8] max-w-md mx-auto">
        请先在移动端 <code className="px-1.5 py-0.5 bg-[#f1f5f9] rounded text-xs">/mobile/login</code> 完成走访摸排,系统会自动汇总到本页面。
      </p>
    </div>
  );
}

// ─── KPI 卡片 ──────────────────────────────────────────────
function KPIGrid({
  kpi,
}: {
  kpi: ReturnType<typeof computeKPI>;
}) {
  const cards: { icon: typeof Users; label: string; value: string | number; unit?: string; iconColor: string; iconBg: string; sub?: string }[] = [
    {
      icon: Users,
      label: "已走访企业",
      value: kpi.visitedCompanies,
      unit: "家",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
      sub: `共 ${kpi.totalVisits} 次走访`,
    },
    {
      icon: CheckCircle2,
      label: "任务完成率",
      value: kpi.coverageRate,
      unit: "%",
      iconColor: "text-emerald-600",
      iconBg: "bg-emerald-50",
      sub: `${kpi.doneTasks} / ${kpi.totalTasks} 已完成`,
    },
    {
      icon: TrendingUp,
      label: "有意愿企业",
      value: kpi.willingCount,
      unit: "家",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
      sub: "意愿强烈 + 有一定意愿",
    },
    {
      icon: Clock,
      label: "平均走访时长",
      value: kpi.avgDurationMin ?? "—",
      unit: kpi.avgDurationMin != null ? "分钟" : undefined,
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
      sub: kpi.avgDurationMin != null ? "仅含已记录时长的走访" : "暂无时长记录",
    },
    {
      icon: MapPin,
      label: "覆盖街道",
      value: kpi.coveredStreets,
      unit: "个",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
      sub: "至少 1 次走访",
    },
    {
      icon: Activity,
      label: "走访总次数",
      value: kpi.totalVisits,
      unit: "次",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
      sub: `${kpi.visitedCompanies} 家企业累计`,
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
      {cards.map((c) => {
        const Icon = c.icon;
        return (
          <div
            key={c.label}
            className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] p-4 relative overflow-hidden"
          >
            <div className={`absolute top-3 right-3 w-7 h-7 rounded-lg ${c.iconBg} flex items-center justify-center`}>
              <Icon size={13} className={c.iconColor} />
            </div>
            <div className="text-[11px] text-[#94a3b8] font-medium mb-1.5">{c.label}</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-[#0f172a] tabular-nums leading-none">{c.value}</span>
              {c.unit && <span className="text-xs text-[#94a3b8]">{c.unit}</span>}
            </div>
            {c.sub && <div className="text-[10px] text-[#94a3b8] mt-1.5">{c.sub}</div>}
          </div>
        );
      })}
    </div>
  );
}

// ─── 面板卡片外壳 ──────────────────────────────────────────
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

// ─── 意愿饼图 ──────────────────────────────────────────────
function WillingnessPie({
  data,
}: {
  data: ReturnType<typeof computeWillingnessDist>;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} 条 ({d}%)" },
    legend: {
      bottom: 0,
      left: "center",
      icon: "circle",
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 12,
      textStyle: { color: "#475569", fontSize: 11 },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "76%"],
        center: ["50%", "44%"],
        avoidLabelOverlap: false,
        itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 4 },
        label: {
          show: true,
          position: "center",
          formatter: `{total|${total}}\n{sub|条记录}`,
          rich: {
            total: { fontSize: 22, color: "#0f172a", fontWeight: "bold" },
            sub: { fontSize: 11, color: "#94a3b8", padding: [4, 0, 0, 0] },
          },
        },
        labelLine: { show: false },
        data: data.map((s) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: s.color },
        })),
      },
    ],
  };
  return <EChartsWrapper option={option} height={260} />;
}

// ─── 走访方式饼图 ──────────────────────────────────────────
function MethodPie({
  data,
}: {
  data: ReturnType<typeof computeMethodDist>;
}) {
  const total = data.reduce((a, b) => a + b.value, 0);
  const option = {
    tooltip: { trigger: "item", formatter: "{b}: {c} 条 ({d}%)" },
    legend: {
      bottom: 0,
      left: "center",
      icon: "circle",
      itemWidth: 7,
      itemHeight: 7,
      itemGap: 14,
      textStyle: { color: "#475569", fontSize: 11 },
    },
    series: [
      {
        type: "pie",
        radius: ["52%", "76%"],
        center: ["50%", "44%"],
        itemStyle: { borderColor: "#ffffff", borderWidth: 2, borderRadius: 4 },
        label: {
          show: true,
          position: "center",
          formatter: `{total|${total}}\n{sub|总走访}`,
          rich: {
            total: { fontSize: 22, color: "#0f172a", fontWeight: "bold" },
            sub: { fontSize: 11, color: "#94a3b8", padding: [4, 0, 0, 0] },
          },
        },
        labelLine: { show: false },
        data: data.map((s) => ({
          name: s.name,
          value: s.value,
          itemStyle: { color: s.color },
        })),
      },
    ],
  };
  return <EChartsWrapper option={option} height={260} />;
}

// ─── 街道堆叠柱状 ─────────────────────────────────────────
function StreetStackedBar({
  rows,
}: {
  rows: ReturnType<typeof computeStreetBreakdown>;
}) {
  if (rows.length === 0) {
    return <div className="text-xs text-[#94a3b8] text-center py-6">暂无街道数据</div>;
  }
  const categories = rows.map((r) => r.street);
  const series = WILLINGNESS_ORDER.map((key) => ({
    name: WILLINGNESS_META[key].label,
    type: "bar",
    stack: "total",
    barWidth: 18,
    itemStyle: { color: WILLINGNESS_META[key].color, borderRadius: [0, 2, 2, 0] },
    emphasis: { focus: "series" },
    data: rows.map((r) => r[key]),
  }));
  const option = {
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" } },
    legend: {
      top: 0,
      right: 0,
      icon: "circle",
      itemWidth: 7,
      itemHeight: 7,
      textStyle: { color: "#475569", fontSize: 11 },
    },
    grid: { left: 92, right: 24, top: 32, bottom: 12, containLabel: false },
    xAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#94a3b8", fontSize: 10 },
    },
    yAxis: {
      type: "category",
      data: categories,
      inverse: true,
      axisLine: { lineStyle: { color: "#e5e7eb" } },
      axisTick: { show: false },
      axisLabel: { color: "#475569", fontSize: 11 },
    },
    series,
  };
  const dynamicHeight = Math.max(220, rows.length * 36 + 60);
  return <EChartsWrapper option={option} height={dynamicHeight} />;
}

// ─── 走访员排行表 ─────────────────────────────────────────
function VisitorTable({
  rows,
}: {
  rows: ReturnType<typeof computeVisitorRanking>;
}) {
  if (rows.length === 0) {
    return <div className="text-xs text-[#94a3b8] text-center py-6">暂无走访员数据</div>;
  }
  const maxVisits = Math.max(1, ...rows.map((r) => r.visits));
  return (
    <div className="overflow-hidden">
      <div className="grid items-center gap-3 px-2 py-2 text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide border-b border-[#f1f5f9]"
        style={{ gridTemplateColumns: "30px 1fr 80px 1fr 90px" }}>
        <span>#</span>
        <span>走访员</span>
        <span className="text-right tabular-nums">走访次数</span>
        <span>占比</span>
        <span className="text-right tabular-nums">意愿转化</span>
      </div>
      <div className="divide-y divide-[#f1f5f9]">
        {rows.map((r, i) => (
          <div
            key={r.visitorId}
            className="grid items-center gap-3 px-2 py-2.5 text-sm"
            style={{ gridTemplateColumns: "30px 1fr 80px 1fr 90px" }}
          >
            <span className="text-[11px] font-semibold text-[#94a3b8] tabular-nums">{i + 1}</span>
            <span className="font-medium text-[#0f172a]">{r.visitorName}</span>
            <span className="text-right tabular-nums text-[#0f172a]">{r.visits}</span>
            <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-600 to-blue-400"
                style={{ width: `${(r.visits / maxVisits) * 100}%` }}
              />
            </div>
            <span className="text-right tabular-nums">
              <span className={`font-semibold ${r.willingRate >= 50 ? "text-emerald-600" : r.willingRate >= 25 ? "text-blue-600" : "text-[#94a3b8]"}`}>
                {r.willingRate}%
              </span>
              <span className="text-[10px] text-[#94a3b8] ml-1">({r.willingCount})</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── 简单柱状图 ───────────────────────────────────────────
function SimpleBar({
  buckets,
  color,
}: {
  buckets: { label: string; value: number }[];
  color: string;
}) {
  const total = buckets.reduce((a, b) => a + b.value, 0);
  if (total === 0) {
    return <div className="text-xs text-[#94a3b8] text-center py-6">暂无填报</div>;
  }
  const option = {
    grid: { left: 86, right: 32, top: 8, bottom: 8, containLabel: false },
    tooltip: { trigger: "axis", axisPointer: { type: "shadow" }, formatter: "{b}: {c} 条" },
    xAxis: {
      type: "value",
      axisLine: { show: false },
      axisTick: { show: false },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      axisLabel: { color: "#94a3b8", fontSize: 10 },
    },
    yAxis: {
      type: "category",
      data: buckets.map((b) => b.label),
      inverse: true,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: "#475569", fontSize: 11 },
    },
    series: [
      {
        type: "bar",
        barWidth: 16,
        data: buckets.map((b) => b.value),
        itemStyle: { color, borderRadius: [0, 4, 4, 0] },
        label: { show: true, position: "right", color: "#0f172a", fontSize: 11, fontWeight: "bold" },
      },
    ],
  };
  return <EChartsWrapper option={option} height={200} />;
}

// ─── 关键词列表 ───────────────────────────────────────────
function KeywordList({
  items,
  accent,
}: {
  items: { word: string; count: number }[];
  accent: "amber" | "emerald";
}) {
  if (items.length === 0) {
    return <div className="text-xs text-[#94a3b8] text-center py-6">暂无关键词</div>;
  }
  const accentMap = {
    amber:   { bg: "bg-amber-50",   text: "text-amber-700",   bar: "from-amber-500 to-amber-400" },
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "from-emerald-500 to-emerald-400" },
  };
  const a = accentMap[accent];
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-2">
      {items.map((it) => (
        <div
          key={it.word}
          className="grid items-center gap-3"
          style={{ gridTemplateColumns: "minmax(0,1fr) 1fr 36px" }}
        >
          <span className={`px-2 py-1 rounded-md text-xs font-medium ${a.bg} ${a.text} truncate w-fit`}>
            {it.word}
          </span>
          <div className="h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full bg-gradient-to-r ${a.bar}`}
              style={{ width: `${(it.count / max) * 100}%` }}
            />
          </div>
          <span className="text-xs tabular-nums text-[#475569] text-right">{it.count}</span>
        </div>
      ))}
    </div>
  );
}
