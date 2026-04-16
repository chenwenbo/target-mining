"use client";
import { use, useMemo } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Phone, Mail, MapPin, CalendarDays, DollarSign, Users, CheckCircle2, XCircle, AlertTriangle, Send } from "lucide-react";
import { getCompanyById, getCertifiedBenchmarks } from "@/lib/mock-data";
import { scoreCompany } from "@/lib/scoring";
import { useWeightsStore } from "@/store/weights";
import TierBadge from "@/components/ui/TierBadge";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import { cn } from "@/lib/cn";
import type { ScoredCompany } from "@/lib/types";

// ─── Radar chart ─────────────────────────────────────────────
function RadarChart({ scored }: { scored: ScoredCompany }) {
  const dims = scored.score.dimensions;
  const option = {
    tooltip: { trigger: "item" },
    radar: {
      indicator: dims.map((d) => ({ name: d.name, max: 100 })),
      radius: "65%",
      axisName: { color: "#475569", fontSize: 11 },
      splitLine: { lineStyle: { color: "#f1f5f9" } },
      splitArea: { areaStyle: { color: ["rgba(241,245,249,0.5)", "rgba(255,255,255,0.5)"] } },
      axisLine: { lineStyle: { color: "#e5e7eb" } },
    },
    series: [{
      type: "radar",
      data: [{
        value: dims.map((d) => d.score),
        name: "评分",
        areaStyle: { color: "rgba(37,99,235,0.1)" },
        lineStyle: { color: "#2563eb", width: 2 },
        itemStyle: { color: "#2563eb" },
      }],
    }],
  };
  return <EChartsWrapper option={option} height={280} />;
}

// ─── Rule hit list ────────────────────────────────────────────
function RuleHitList({ scored }: { scored: ScoredCompany }) {
  return (
    <div className="space-y-5">
      {scored.score.dimensions.map((dim) => (
        <div key={dim.name}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-[#0f172a]">{dim.name}</span>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#94a3b8]">权重 {Math.round(dim.weight * 100)}%</span>
              <span className="font-bold text-[#0f172a]">{dim.score} 分</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {dim.hits.map((hit) => (
              <div
                key={hit.label}
                className={cn(
                  "flex items-center justify-between px-3 py-2 rounded-lg text-xs",
                  hit.passed ? "bg-emerald-50 border border-emerald-100" : "bg-red-50 border border-red-100"
                )}
              >
                <div className="flex items-center gap-2">
                  {hit.passed
                    ? <CheckCircle2 size={12} className="text-emerald-600 flex-shrink-0" />
                    : <XCircle size={12} className="text-red-400 flex-shrink-0" />}
                  <span className={hit.passed ? "text-emerald-800" : "text-red-700"}>{hit.label}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[#475569]">{hit.value}</span>
                  <span className={cn(
                    "font-semibold tabular-nums",
                    hit.points > 0 ? "text-emerald-700" : hit.points < 0 ? "text-red-600" : "text-[#94a3b8]"
                  )}>
                    {hit.points > 0 ? `+${hit.points}` : hit.points} 分
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Gap list ────────────────────────────────────────────────
function GapList({ scored }: { scored: ScoredCompany }) {
  const { gaps } = scored.score;
  if (gaps.length === 0) {
    return (
      <div className="flex items-center gap-2 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
        <CheckCircle2 size={16} className="text-emerald-600" />
        <span className="text-sm text-emerald-800 font-medium">各项指标均已达标，建议尽快推动申报</span>
      </div>
    );
  }
  return (
    <div className="space-y-3">
      {gaps.map((gap, i) => (
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
                )}>{gap.dimension}</span>
                {gap.urgent && <span className="text-xs text-red-600 font-semibold">⚠ 申报硬性要求</span>}
              </div>
              <p className="text-sm text-[#0f172a] mb-1.5">{gap.description}</p>
              <p className="text-xs text-[#475569]">
                <span className="font-medium text-blue-700">建议：</span>{gap.suggestion}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Benchmark cards ──────────────────────────────────────────
function BenchmarkCards({ company, scored }: { company: ReturnType<typeof getCompanyById>; scored: ScoredCompany }) {
  const benchmarks = useMemo(() => {
    return getCertifiedBenchmarks()
      .filter((b) => b.techField === company!.techField)
      .slice(0, 3);
  }, [company]);

  if (benchmarks.length === 0) return null;

  return (
    <div className="grid grid-cols-3 gap-3">
      {benchmarks.map((b) => {
        const similarity = Math.round(
          70 + Math.random() * 20 // simplified; real version would use cosine similarity
        );
        return (
          <div key={b.id} className="p-4 bg-[#f7f8fa] border border-[#e5e7eb] rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-medium">已认定</span>
              <span className="text-xs text-blue-600 font-semibold">相似度 {similarity}%</span>
            </div>
            <p className="text-xs font-medium text-[#0f172a] leading-snug mb-2">{b.name}</p>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-[#64748b]">
              <span>专利 {b.patents.invention + b.patents.utility}</span>
              <span>参保 {b.employees}</span>
              <span>{b.street}</span>
              <span>{b.techField}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { weights } = useWeightsStore();

  const company = getCompanyById(id);
  if (!company) notFound();

  const scored = useMemo(() => ({
    ...company,
    score: scoreCompany(company, weights),
  }), [company, weights]);

  const yearsSince = ((new Date("2026-01-01").getTime() - new Date(company.establishedAt).getTime()) / (1000 * 60 * 60 * 24 * 365)).toFixed(1);

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/targets" className="flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-blue-600 transition-colors">
          <ArrowLeft size={14} /> 标的池
        </Link>
        <span className="text-[#cbd5e1]">/</span>
        <span className="text-sm text-[#475569] truncate max-w-xs">{company.name}</span>
      </div>

      <div className="grid gap-5" style={{ gridTemplateColumns: "1fr 320px" }}>
        {/* ─── Left column ─── */}
        <div className="space-y-4">
          {/* Header card */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3 mb-1.5">
                  <h1 className="text-xl font-bold text-[#0f172a]">{company.name}</h1>
                  <TierBadge tier={scored.score.tier} showDesc />
                </div>
                <div className="flex items-center gap-4 text-xs text-[#94a3b8]">
                  <span className="font-mono">{company.creditCode}</span>
                  <span>{company.industry}</span>
                  {company.techField && (
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full">{company.techField}</span>
                  )}
                </div>
              </div>
              <div className="text-center px-5 py-3 bg-gradient-to-b from-[#f8faff] to-[#eef3ff] border border-blue-100 rounded-xl">
                <div className="text-4xl font-bold text-[#0f172a] tabular-nums leading-none">{scored.score.total}</div>
                <div className="text-xs text-[#94a3b8] mt-1">综合评分</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 pt-4 border-t border-[#f1f5f9]">
              {[
                { icon: MapPin, label: "所在地", value: company.street },
                { icon: CalendarDays, label: "成立年限", value: `${yearsSince} 年` },
                { icon: DollarSign, label: "注册资本", value: `${company.registeredCapital} 万元` },
                { icon: Users, label: "参保人数", value: `${company.employees} 人` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#f7f8fa] flex items-center justify-center flex-shrink-0">
                    <Icon size={13} className="text-[#94a3b8]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#94a3b8]">{label}</div>
                    <div className="text-sm font-medium text-[#0f172a]">{value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Radar + Rule hits side by side */}
          <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.4fr" }}>
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
              <h2 className="text-sm font-semibold text-[#0f172a] mb-1">六维评估雷达</h2>
              <p className="text-xs text-[#94a3b8] mb-3">各维度 0-100 分</p>
              <RadarChart scored={scored} />
            </div>
            <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 overflow-y-auto max-h-[420px]">
              <h2 className="text-sm font-semibold text-[#0f172a] mb-1">规则命中清单</h2>
              <p className="text-xs text-[#94a3b8] mb-4">每一分都有出处 · 点击查看详情</p>
              <RuleHitList scored={scored} />
            </div>
          </div>

          {/* Gap analysis */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-1">缺项提示</h2>
            <p className="text-xs text-[#94a3b8] mb-4">距离正式申报还需补齐以下事项</p>
            <GapList scored={scored} />
          </div>

          {/* Benchmarks */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-1">同领域已认定企业对标</h2>
            <p className="text-xs text-[#94a3b8] mb-4">参考这些企业的申报路径可缩短培育周期</p>
            <BenchmarkCards company={company} scored={scored} />
          </div>
        </div>

        {/* ─── Right column ─── */}
        <div className="space-y-4">
          {/* Actions */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">操作</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors font-medium">
                <Send size={13} /> 派发给街道经办人
              </button>
              <button className="w-full px-4 py-2.5 border border-[#e5e7eb] text-sm rounded-lg text-[#475569] hover:bg-[#f7f8fa] transition-colors">
                标记为跟进中
              </button>
              <button className="w-full px-4 py-2.5 border border-[#e5e7eb] text-sm rounded-lg text-[#475569] hover:bg-[#f7f8fa] transition-colors">
                加入白名单
              </button>
              <button className="w-full px-4 py-2.5 border border-[#e5e7eb] text-sm rounded-lg text-[#475569] hover:bg-[#f7f8fa] transition-colors">
                导出企业报告 PDF
              </button>
            </div>
          </div>

          {/* Company details */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">企业档案</h3>
            <div className="space-y-3">
              {[
                { label: "联系人", value: company.contact.name },
                { label: "联系电话", value: company.contact.phone },
                { label: "联系邮箱", value: company.contact.email },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <span className="text-xs text-[#94a3b8] w-16 flex-shrink-0 pt-0.5">{label}</span>
                  <span className="text-xs text-[#0f172a] font-medium break-all">{value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* IP breakdown */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">知识产权详情</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "发明专利", value: company.patents.invention, color: "text-blue-700 bg-blue-50" },
                { label: "实用新型", value: company.patents.utility, color: "text-purple-700 bg-purple-50" },
                { label: "外观设计", value: company.patents.design, color: "text-teal-700 bg-teal-50" },
                { label: "软件著作权", value: company.software, color: "text-amber-700 bg-amber-50" },
              ].map(({ label, value, color }) => (
                <div key={label} className={cn("rounded-lg p-3 text-center", color.split(" ")[1])}>
                  <div className={cn("text-2xl font-bold tabular-nums", color.split(" ")[0])}>{value}</div>
                  <div className="text-[11px] text-[#64748b] mt-0.5">{label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk + SME */}
          <div className="bg-white rounded-xl border border-[#e5e7eb] p-5">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">资质 & 风险</h3>
            <div className="space-y-2.5">
              {[
                { label: "科技型中小企业入库", ok: company.inSMEDatabase },
                { label: "经营状态正常", ok: !company.risk.abnormal },
                { label: "无行政处罚记录", ok: !company.risk.penalty },
              ].map(({ label, ok }) => (
                <div key={label} className="flex items-center gap-2 text-sm">
                  {ok
                    ? <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                    : <XCircle size={14} className="text-red-400 flex-shrink-0" />}
                  <span className={ok ? "text-[#0f172a]" : "text-red-600"}>{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
