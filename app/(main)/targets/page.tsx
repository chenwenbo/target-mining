"use client";
import { useEffect, useMemo, useState, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { SlidersHorizontal, Download, Send, Search, X, Building2 } from "lucide-react";
import { getPotentialTargets } from "@/lib/mock-data";
import DispatchModal from "@/components/ui/DispatchModal";
import { exportToCSV } from "@/lib/export";
import { saveDispatchedTask } from "@/lib/mobile-mock";
import { useCurrentPCUser } from "@/lib/account-mock";
import type { Street, TechField, Company, DeclarationWillingness, Visitor } from "@/lib/types";
import { STREETS, TECH_FIELDS, DECLARATION_WILLINGNESS_LABELS } from "@/lib/types";
import { cn } from "@/lib/cn";

// ─── Filter state ────────────────────────────────────────────
type PoolTier = "all" | "patent_growth" | "employee_growth" | "willing";

const POOL_TIERS: { id: PoolTier; label: string; desc: string }[] = [
  { id: "all",            label: "泛科技企业",       desc: "全部泛科技企业" },
  { id: "patent_growth",  label: "近三年有专利增长",  desc: "近三年新增专利的企业" },
  { id: "employee_growth",label: "近三年企业人数增长", desc: "近三年参保人数持续增长的企业" },
  { id: "willing",        label: "有意愿的企业",      desc: "申报意愿强烈或基本有意愿的企业" },
];

interface Filters {
  q: string;
  streets: Street[];
  fields: TechField[];
  ageRange: string[];
  smeOnly: boolean;
  excludeRisk: boolean;
  willingness: DeclarationWillingness[];
  declarationType: ("新申报" | "复审")[];
  poolTier: PoolTier;
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

// Semantic colors for willingness pills — mirrors the badge palette used elsewhere
const WILLINGNESS_PILL: Record<DeclarationWillingness, { active: string; inactive: string }> = {
  strong:   { active: "bg-emerald-600 text-white border-emerald-600", inactive: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:border-emerald-400" },
  moderate: { active: "bg-blue-600 text-white border-blue-600",       inactive: "bg-blue-50 text-blue-700 border-blue-200 hover:border-blue-400" },
  hesitant: { active: "bg-amber-500 text-white border-amber-500",     inactive: "bg-amber-50 text-amber-700 border-amber-200 hover:border-amber-400" },
  refused:  { active: "bg-red-500 text-white border-red-500",         inactive: "bg-red-50 text-red-700 border-red-200 hover:border-red-400" },
  unknown:  { active: "bg-slate-500 text-white border-slate-500",     inactive: "bg-slate-50 text-slate-600 border-slate-200 hover:border-slate-400" },
};

function FilterPanel({
  filters,
  onChange,
  lockedStreet,
}: {
  filters: Filters;
  onChange: (f: Filters) => void;
  lockedStreet?: Street | null;
}) {
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

  function willingnessPill(key: DeclarationWillingness, label: string, active: boolean, onClick: () => void) {
    const colors = WILLINGNESS_PILL[key];
    return (
      <button
        key={key}
        onClick={onClick}
        className={cn(
          "px-2.5 py-1 text-xs rounded-full border transition-colors",
          active ? colors.active : colors.inactive
        )}
      >
        {label}
      </button>
    );
  }

  // accent: Tailwind border-l color class, e.g. "border-l-blue-400"
  const section = (title: string, accent: string, children: React.ReactNode) => (
    <div className={cn("mb-5 pl-2.5 border-l-2", accent)}>
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
            q: "", streets: lockedStreet ? [lockedStreet] : [], fields: [], ageRange: [],
            smeOnly: false, excludeRisk: true,
            willingness: [], declarationType: [], poolTier: "all",
          })}
          className="text-xs text-[#94a3b8] hover:text-blue-600"
        >
          重置
        </button>
      </div>

      {lockedStreet && (
        <div className="mb-5 px-3 py-2 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-2">
          <Building2 size={12} className="text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="text-[11px] text-[#475569] leading-relaxed">
            当前视图：<span className="font-semibold text-blue-700">{lockedStreet}</span>
            <br />
            仅本街道企业
          </div>
        </div>
      )}

      {section("所属领域", "border-l-blue-400", (
        <div className="flex flex-wrap gap-1.5">
          {TECH_FIELDS.map((f) =>
            pill(f.length > 6 ? f.slice(0, 6) + "…" : f, filters.fields.includes(f), () =>
              onChange({ ...filters, fields: toggle(filters.fields, f) })
            )
          )}
        </div>
      ))}

      {!lockedStreet && section("所在街道 / 园区", "border-l-slate-400", (
        <div className="space-y-1">
          {STREETS.map((s) => (
            <label key={s} className="flex items-center gap-2 text-xs text-[#475569] cursor-pointer hover:text-[#0f172a]">
              <input
                type="checkbox"
                className="accent-slate-500"
                checked={filters.streets.includes(s)}
                onChange={() => onChange({ ...filters, streets: toggle(filters.streets, s) })}
              />
              {s}
            </label>
          ))}
        </div>
      ))}


      {section("申报类型", "border-l-teal-400", (
        <div className="flex flex-wrap gap-1.5">
          {(["新申报", "复审"] as const).map((t) =>
            pill(t, filters.declarationType.includes(t), () =>
              onChange({ ...filters, declarationType: toggle(filters.declarationType, t) })
            )
          )}
        </div>
      ))}

      {section("申报意愿", "border-l-amber-400", (
        <div className="flex flex-wrap gap-1.5">
          {(Object.keys(DECLARATION_WILLINGNESS_LABELS) as DeclarationWillingness[]).map((w) =>
            willingnessPill(w, DECLARATION_WILLINGNESS_LABELS[w], filters.willingness.includes(w), () =>
              onChange({ ...filters, willingness: toggle(filters.willingness, w) })
            )
          )}
        </div>
      ))}

    </aside>
  );
}

// ─── Main Page ───────────────────────────────────────────────
function TargetsPageContent() {
  const searchParams = useSearchParams();
  const { user, mounted } = useCurrentPCUser();
  const lockedStreet: Street | null =
    mounted && user.role === "street_admin" && user.street ? (user.street as Street) : null;

  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get("q") ?? "",
    streets: [],
    fields: [],
    ageRange: [],
    smeOnly: false,
    excludeRisk: true,
    willingness: [],
    declarationType: [],
    poolTier: "all",
  });

  // 街道管理员视角：强制把街道筛选锁定为本街道
  useEffect(() => {
    if (lockedStreet && (filters.streets.length !== 1 || filters.streets[0] !== lockedStreet)) {
      setFilters((f) => ({ ...f, streets: [lockedStreet] }));
    }
  }, [lockedStreet, filters.streets]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"name" | "employees">("name");
  const [dispatchTargets, setDispatchTargets] = useState<{ id: string; name: string; street: string }[] | null>(null);

  const allCompanies = useMemo(() => getPotentialTargets(), []);

  // Apply filters
  const filtered = useMemo(() => {
    return allCompanies
      .filter((c) => {
        if (filters.q && !c.name.includes(filters.q) && !c.creditCode.includes(filters.q)) return false;
        if (filters.streets.length > 0 && !filters.streets.includes(c.street)) return false;
        if (filters.fields.length > 0 && (!c.techField || !filters.fields.includes(c.techField))) return false;
        if (filters.ageRange.length > 0 && !filters.ageRange.includes(getAgeRange(c.establishedAt))) return false;
        if (filters.smeOnly && !c.inSMEDatabase) return false;
        if (filters.excludeRisk && (c.risk.abnormal || c.risk.penalty)) return false;
        if (filters.willingness.length > 0 && !filters.willingness.includes(c.declarationWillingness)) return false;
        const dtype = c.alreadyCertified ? "复审" : "新申报";
        if (filters.declarationType.length > 0 && !filters.declarationType.includes(dtype)) return false;
        // Pool tier quick-filter
        if (filters.poolTier === "patent_growth") {
          const totalPatents = c.patents.invention + c.patents.utility + c.patents.design + c.software;
          if (totalPatents === 0) return false;
        }
        if (filters.poolTier === "employee_growth") {
          if (c.employees < 30 && c.rdEmployees < 10) return false;
        }
        if (filters.poolTier === "willing") {
          if (!["strong", "moderate"].includes(c.declarationWillingness)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortBy === "name") return a.name.localeCompare(b.name);
        if (sortBy === "employees") return b.employees - a.employees;
        return 0;
      });
  }, [allCompanies, filters, sortBy]);

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

  function openDispatch(companies: Company[]) {
    setDispatchTargets(companies.map((c) => ({
      id: c.id,
      name: c.name,
      street: c.street,
    })));
  }

  function handleDispatchConfirm(assignee: Visitor, notes: string) {
    if (!dispatchTargets) return;
    const today = new Date().toISOString().slice(0, 10);
    const deadline = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    dispatchTargets.forEach((t, i) => {
      saveDispatchedTask({
        id: `dispatch_${Date.now()}_${i}`,
        companyId: t.id,
        companyName: t.name,
        assignee: assignee.name,
        street: (assignee.street ?? t.street) as import("@/lib/types").Street,
        status: "pending",
        createdAt: today,
        deadline,
        notes,
      });
    });
  }

  function handleExport() {
    const toExport = selected.size > 0
      ? filtered.filter((c) => selected.has(c.id))
      : filtered;
    exportToCSV(toExport);
  }

  const activeFilterCount = [
    filters.streets.length, filters.fields.length,
    filters.ageRange.length, filters.smeOnly ? 1 : 0,
    filters.willingness.length, filters.declarationType.length,
  ].reduce((a, b) => a + b, 0);

  return (
    <>
    <div className="-m-6 lg:-m-8 flex h-full" style={{ minHeight: "calc(100vh - 56px)" }}>
      <FilterPanel filters={filters} onChange={setFilters} lockedStreet={lockedStreet} />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Pool tier quick-filter bar */}
        <div className="bg-[#f0f6ff] border-b border-[#d1e3fa] px-5 py-2.5 flex items-center gap-2 flex-shrink-0 overflow-x-auto">
          <span className="text-[11px] font-semibold text-[#64748b] whitespace-nowrap mr-1">标的池</span>
          {POOL_TIERS.map((tier, idx) => {
            const isActive = filters.poolTier === tier.id;
            return (
              <button
                key={tier.id}
                title={tier.desc}
                onClick={() => setFilters((f) => ({ ...f, poolTier: tier.id }))}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border transition-all whitespace-nowrap",
                  isActive
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-white text-[#475569] border-[#c5d9f5] hover:border-blue-400 hover:text-blue-600"
                )}
              >
                {idx > 0 && <span className={cn("text-[10px]", isActive ? "text-blue-200" : "text-[#94a3b8]")}>▸</span>}
                {tier.label}
              </button>
            );
          })}
        </div>

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
              <option value="name">按名称排序</option>
              <option value="employees">按参保人数</option>
            </select>
            {selected.size > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-700">
                已选 {selected.size} 家
                <button
                  onClick={() => openDispatch(filtered.filter((c) => selected.has(c.id)))}
                  className="flex items-center gap-1 hover:text-blue-900"
                >
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
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">领域</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8]">街道 / 园区</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-20">成立年限</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-20">专利总数</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-16">参保</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-16">注册资本</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-20">申报类型</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-24">申报意愿</th>
                <th className="px-3 py-3 text-left text-xs font-medium text-[#94a3b8] w-20">操作</th>
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
                      <Link href={`/targets/${c.id}`} className="block">
                        <div className="font-medium text-[#0f172a] group-hover:text-blue-600 transition-colors">
                          {c.name}
                        </div>
                        <div className="text-[11px] text-[#94a3b8] mt-0.5">{c.industry}</div>
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-block px-2 py-0.5 bg-[#f1f5f9] text-[#475569] text-xs rounded">
                        {c.techField ?? "—"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-[#475569] text-xs">{c.street}</td>
                    <td className="px-3 py-3 text-[#475569] text-xs">{getAgeRange(c.establishedAt)}</td>
                    <td className="px-3 py-3 tabular-nums text-[#475569]">
                      {totalPatents}
                      {c.patents.invention > 0 && (
                        <span className="ml-1 text-[10px] text-blue-500">发{c.patents.invention}</span>
                      )}
                    </td>
                    <td className="px-3 py-3 tabular-nums text-[#475569]">{c.employees}</td>
                    <td className="px-3 py-3 tabular-nums text-[#475569] text-xs">{c.registeredCapital}万</td>
                    <td className="px-3 py-3">
                      <span className={cn(
                        "inline-block px-2 py-0.5 text-xs rounded-full font-medium",
                        c.alreadyCertified
                          ? "bg-purple-50 text-purple-700 border border-purple-200"
                          : "bg-blue-50 text-blue-700 border border-blue-200"
                      )}>
                        {c.alreadyCertified ? "复审" : "新申报"}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      {(() => {
                        const w = c.declarationWillingness;
                        const styles: Record<string, string> = {
                          strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
                          moderate: "bg-teal-50 text-teal-700 border-teal-200",
                          hesitant: "bg-amber-50 text-amber-700 border-amber-200",
                          refused: "bg-red-50 text-red-600 border-red-200",
                          unknown: "bg-[#f1f5f9] text-[#94a3b8] border-[#e5e7eb]",
                        };
                        return (
                          <span className={cn("inline-block px-2 py-0.5 text-xs rounded-full border", styles[w])}>
                            {DECLARATION_WILLINGNESS_LABELS[w]}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-3 py-3 text-right pr-4">
                      <span
                        onClick={() => openDispatch([c])}
                        className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 cursor-pointer whitespace-nowrap"
                      >
                        <Send size={11} /> 派发
                      </span>
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

    {dispatchTargets && (
      <DispatchModal
        targets={dispatchTargets}
        onClose={() => setDispatchTargets(null)}
        onConfirm={(assignee, notes) => {
          handleDispatchConfirm(assignee, notes);
        }}
      />
    )}
    </>
  );
}

export default function TargetsPage() {
  return (
    <Suspense>
      <TargetsPageContent />
    </Suspense>
  );
}
