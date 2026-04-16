"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Download, Send, Search, X } from "lucide-react";
import { getPotentialTargets } from "@/lib/mock-data";
import { scoreCompany } from "@/lib/scoring";
import { useWeightsStore } from "@/store/weights";
import TierBadge from "@/components/ui/TierBadge";
import ScoreBar from "@/components/ui/ScoreBar";
import { exportToCSV } from "@/lib/export";
import type { Tier, Street, TechField, ScoredCompany } from "@/lib/types";
import { STREETS, TECH_FIELDS } from "@/lib/types";
import { cn } from "@/lib/cn";

// ─── Filter state ────────────────────────────────────────────
interface Filters {
  q: string;
  tiers: Tier[];
  streets: Street[];
  fields: TechField[];
  ageRange: string[];
  minScore: number;
  maxScore: number;
  smeOnly: boolean;
  excludeRisk: boolean;
}

const ALL_AGE_RANGES = ["1-3 年", "3-5 年", "5-8 年", "8-15 年", "15 年+"];

function getAgeRange(est: string): string {
  const years = (new Date("2026-01-01").getTime() - new Date(est).getTime()) / (1000 * 60 * 60 * 24 * 365);
  if (years < 3) return "1-3 年";
  if (years < 5) return "3-5 年";
  if (years < 8) return "5-8 年";
  if (years < 15) return "8-15 年";
  return "15 年+";
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val];
}

// ─── Filter Panel ────────────────────────────────────────────
function FilterPanel({ filters, onChange }: { filters: Filters; onChange: (f: Filters) => void }) {
  function pill(label: string, active: boolean, onClick: () => void) {
    return (
      <button
        key={label}
        onClick={onClick}
        className={cn(
          "px-2.5 py-1 text-xs rounded-full border transition-colors",
          active
            ? "bg-blue-600 text-white border-blue-600"
            : "bg-white text-[#475569] border-[#e5e7eb] hover:border-blue-300"
        )}
      >
        {label}
      </button>
    );
  }

  const section = (title: string, children: React.ReactNode) => (
    <div className="mb-5">
      <div className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wide mb-2">{title}</div>
      {children}
    </div>
  );

  return (
    <aside className="w-56 flex-shrink-0 bg-white border-r border-[#e5e7eb] p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-semibold text-[#0f172a] flex items-center gap-1.5">
          <SlidersHorizontal size={13} /> 筛选条件
        </span>
        <button
          onClick={() => onChange({
            q: "", tiers: [], streets: [], fields: [], ageRange: [],
            minScore: 0, maxScore: 100, smeOnly: false, excludeRisk: true,
          })}
          className="text-xs text-[#94a3b8] hover:text-blue-600"
        >
          重置
        </button>
      </div>

      {section("置信度分档", (
        <div className="flex flex-wrap gap-1.5">
          {(["A","B","C","D"] as Tier[]).map((t) =>
            pill(t + " 类", filters.tiers.includes(t), () =>
              onChange({ ...filters, tiers: toggle(filters.tiers, t) })
            )
          )}
        </div>
      ))}

      {section("所属领域", (
        <div className="flex flex-wrap gap-1.5">
          {TECH_FIELDS.map((f) =>
            pill(f.length > 6 ? f.slice(0, 6) + "…" : f, filters.fields.includes(f), () =>
              onChange({ ...filters, fields: toggle(filters.fields, f) })
            )
          )}
        </div>
      ))}

      {section("所在街道 / 园区", (
        <div className="space-y-1">
          {STREETS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer hover:text-[#0f172a]">
              <input
                type="checkbox"
                className="accent-blue-600"
                checked={filters.streets.includes(s)}
                onChange={() => onChange({ ...filters, streets: toggle(filters.streets, s) })}
              />
              {s}
            </label>
          ))}
        </div>
      ))}

      {section("成立年限", (
        <div className="flex flex-wrap gap-1.5">
          {ALL_AGE_RANGES.map((r) =>
            pill(r, filters.ageRange.includes(r), () =>
              onChange({ ...filters, ageRange: toggle(filters.ageRange, r) })
            )
          )}
        </div>
      ))}

      {section("其他", (
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
            <input type="checkbox" className="accent-blue-600"
              checked={filters.smeOnly}
              onChange={(e) => onChange({ ...filters, smeOnly: e.target.checked })} />
            仅显示已入库科技型中小企业
          </label>
          <label className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer">
            <input type="checkbox" className="accent-blue-600"
              checked={filters.excludeRisk}
              onChange={(e) => onChange({ ...filters, excludeRisk: e.target.checked })} />
            排除风险企业
          </label>
        </div>
      ))}
    </aside>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function TargetsPage() {
  const searchParams = useSearchParams();
  const { weights } = useWeightsStore();

  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get("q") ?? "",
    tiers: [],
    streets: [],
    fields: [],
    ageRange: [],
    minScore: 0,
    maxScore: 100,
    smeOnly: false,
    excludeRisk: true,
  });
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"score" | "name" | "employees">("score");

  // Score all companies
  const allScored = useMemo(() => {
    const raw = getPotentialTargets();
    return raw.map((c) => ({ ...c, score: scoreCompany(c, weights) }));
  }, [weights]);

  // Apply filters
  const filtered = useMemo(() => {
    return allScored
      .filter((c) => {
        if (filters.q && !c.name.includes(filters.q) && !c.creditCode.includes(filters.q)) return false;
        if (filters.tiers.length > 0 && !filters.tiers.includes(c.score.tier)) return false;
        if (filters.streets.length > 0 && !filters.streets.includes(c.street)) return false;
        if (filters.fields.length > 0 && (!c.techField || !filters.fields.includes(c.techField))) return false;
        if (filters.ageRange.length > 0 && !filters.ageRange.includes(getAgeRange(c.establishedAt))) return false;
        if (filters.smeOnly && !c.inSMEDatabase) return false;
        if (filters.excludeRisk && (c.risk.abnormal || c.risk.penalty)) return false;
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "score") return b.score.total - a.score.total;
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "employees") return b.employees - a.employees;
        return 0;
      });
  }, [allScored, filters, sortBy]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map((c) => c.id)));
    }
  }

  function handleExport() {
    const toExport = selected.size > 0
      ? (filtered.filter((c) => selected.has(c.id)) as ScoredCompany[])
      : (filtered as ScoredCompany[]);
    exportToCSV(toExport);
  }

  const activeFilterCount = [
    filters.tiers.length, filters.streets.length, filters.fields.length,
    filters.ageRange.length, filters.smeOnly ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  return (
    <div className="-m-6 lg:-m-8 flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>
      <FilterPanel filters={filters} onChange={setFilters} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Toolbar */}
        <div className="bg-white border-b border-[#e5e7eb] px-5 py-3 flex items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
              <input
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                placeholder="搜索企业名称…"
                className="pl-7 pr-3 py-1.5 text-sm bg-[#f7f8fa] border border-[#e5e7eb] rounded-md w-52 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
              />
              {filters.q && (
                <button onClick={() => setFilters({ ...filters, q: "" })} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X size={12} className="text-[#94a3b8]" />
                </button>
              )}
            </div>
            <span className="text-sm text-[#94a3b8]">
              共 <span className="font-semibold text-[#0f172a]">{filtered.length}</span> 家
              {activeFilterCount > 0 && <span className="ml-1 text-blue-600">· {activeFilterCount} 项筛选</span>}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              className="px-2.5 py-1.5 text-xs bg-[#f7f8fa] border border-[#e5e7eb] rounded-md text-[#475569] focus:outline-none"
            >
              <option value="score">按评分排序</option>
              <option value="name">按名称排序</option>
              <option value="employees">按参保人数</option>
            </select>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
                已选 {selected.size} 家
                <button className="flex items-center gap-1 hover:text-blue-900">
                  <Send size={11} /> 派发
                </button>
                <button onClick={handleExport} className="flex items-center gap-1 hover:text-blue-900">
                  <Download size={11} /> 导出
                </button>
                <button onClick={() => setSelected(new Set())}><X size={11} /></button>
              </div>
            )}
            <button
              onClick={handleExport}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-[#e5e7eb] bg-white rounded-md text-[#475569] hover:bg-[#f7f8fa] transition-colors"
            >
              <Download size={12} /> 导出 CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="sticky top-0 bg-[#f7f8fa] z-10">
              <tr className="border-b border-[#e5e7eb]">
                <th className="pl-5 pr-2 py-3 w-10">
                  <input
                    type="checkbox"
                    className="accent-blue-600"
                    checked={selected.size === filtered.length && filtered.length > 0}
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">企业名称</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-44">综合评分</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-24">分档</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">领域</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">街道 / 园区</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-20">专利总数</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-16">参保</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-16">注册资本</th>
                <th className="px-3 py-3 w-16" />
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {filtered.map((c) => {
                const totalPatents = c.patents.invention + c.patents.utility + c.patents.design + c.software;
                const isSelected = selected.has(c.id);
                return (
                  <tr
                    key={c.id}
                    className={cn("hover:bg-[#fafbfc] transition-colors group", isSelected && "bg-blue-50/50")}
                  >
                    <td className="pl-5 pr-2 py-3">
                      <input
                        type="checkbox"
                        className="accent-blue-600"
                        checked={isSelected}
                        onChange={() => toggleSelect(c.id)}
                      />
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-[#0f172a] group-hover:text-blue-600 transition-colors">
                        {c.name}
                      </div>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">{c.industry}</div>
                    </td>
                    <td className="px-3 py-3"><ScoreBar score={c.score.total} size="sm" /></td>
                    <td className="px-3 py-3"><TierBadge tier={c.score.tier} size="sm" /></td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 bg-[#f1f5f9] text-[#475569] text-xs rounded">
                        {c.techField ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#475569] text-xs">{c.street}</td>
                    <td className="px-3 py-3 tabular-nums text-[#475569]">
                      {totalPatents}
                      {c.patents.invention > 0 && (
                        <span className="ml-1 text-[10px] text-blue-500">发{c.patents.invention}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-[#475569]">{c.employees}</td>
                    <td className="px-3 py-3 tabular-nums text-[#475569] text-xs">{c.registeredCapital}万</td>
                    <td className="px-3 py-3 text-right pr-4">
                      <Link
                        href={`/targets/${c.id}`}
                        className="text-xs text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        详情 ↗
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-20 text-center text-[#94a3b8] text-sm">
              未找到符合条件的企业，请调整筛选条件
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
