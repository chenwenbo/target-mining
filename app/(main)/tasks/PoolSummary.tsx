"use client";
import Link from "next/link";
import { ArrowRight, TrendingUp, Users, Layers } from "lucide-react";

type Props = {
  funnelPatentGrowth: number;
  funnelEmployeeGrowth: number;
  funnelGrowthUnion: number;
};

export default function PoolSummary({
  funnelPatentGrowth,
  funnelEmployeeGrowth,
  funnelGrowthUnion,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
      <div className="px-5 py-3.5 border-b border-[#e5e7eb] flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-[#0f172a]">标的池来源</h2>
          <p className="text-xs text-[#94a3b8] mt-0.5">
            企业漏斗·近三年专利与人数增长 → 形成挖掘候选池
          </p>
        </div>
        <Link
          href="/targets"
          className="flex items-center gap-1 px-3.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          前往标的池筛选并派发 <ArrowRight size={13} />
        </Link>
      </div>

      <div className="grid grid-cols-3 divide-x divide-[#e5e7eb]">
        <Block
          icon={<TrendingUp size={20} className="text-blue-600" />}
          iconBg="bg-blue-50"
          label="近三年专利增长"
          value={funnelPatentGrowth}
          sub="近三年专利数有增长的企业"
        />
        <Block
          icon={<Users size={20} className="text-purple-600" />}
          iconBg="bg-purple-50"
          label="近三年企业人数增长"
          value={funnelEmployeeGrowth}
          sub="近三年参保人数增长的企业"
        />
        <Block
          icon={<Layers size={20} className="text-emerald-600" />}
          iconBg="bg-emerald-50"
          label="合计标的池"
          value={funnelGrowthUnion}
          sub="去重合集 · 形成挖掘候选池"
          highlighted
        />
      </div>

      <div className="px-5 py-3 bg-[#f7f8fa] border-t border-[#e5e7eb] text-xs text-[#64748b] leading-relaxed">
        ☝ 这一阶段是任务管理流程的<span className="font-semibold text-[#0f172a]">起点</span>。
        从合计 <span className="font-semibold text-emerald-600 tabular-nums">{funnelGrowthUnion}</span> 家候选企业中筛选符合条件的标的，派发到对应街道，进入下一阶段「已派发·待摸排」。
      </div>
    </div>
  );
}

function Block({
  icon,
  iconBg,
  label,
  value,
  sub,
  highlighted = false,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
  sub: string;
  highlighted?: boolean;
}) {
  return (
    <div className="px-6 py-6 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center shrink-0`}>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-[#94a3b8] font-medium">{label}</div>
        <div className="flex items-baseline gap-1.5 mt-1">
          <span
            className={`text-3xl font-bold tabular-nums leading-none ${
              highlighted ? "text-emerald-600" : "text-[#0f172a]"
            }`}
          >
            {value.toLocaleString()}
          </span>
          <span className="text-sm text-[#94a3b8]">家</span>
        </div>
        <div className="text-[11px] text-[#94a3b8] mt-1.5 leading-snug">{sub}</div>
      </div>
    </div>
  );
}
