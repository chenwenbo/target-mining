"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import {
  ClipboardCheck,
  Plus,
  Copy,
  Trash2,
  ExternalLink,
  CheckCircle2,
  Clock,
  Search,
  X,
  ChevronDown,
  BarChart3,
  Star,
} from "lucide-react";
import KPICard from "@/components/ui/KPICard";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import {
  getAssessmentRecords,
  saveAssessmentRecord,
  generateToken,
  buildShareUrl,
} from "@/lib/assessment-store";
import type { AssessmentRecord, AssessmentSource, Company } from "@/lib/types";
import { cn } from "@/lib/cn";

// ─── Status meta ─────────────────────────────────────────────────
const STATUS_META = {
  pending: { label: "待完成", bg: "bg-amber-100", text: "text-amber-700", dot: "bg-amber-400" },
  completed: { label: "已完成", bg: "bg-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
};

const SOURCE_META = {
  enterprise_self: { label: "企业自填", bg: "bg-blue-50", text: "text-blue-700" },
  staff_agent:     { label: "工作人员代填", bg: "bg-purple-50", text: "text-purple-700" },
};

const GRADE_META = {
  "优秀": { bg: "bg-emerald-100", text: "text-emerald-700" },
  "符合": { bg: "bg-blue-100", text: "text-blue-700" },
  "待培育": { bg: "bg-amber-100", text: "text-amber-700" },
};

function StatusBadge({ status }: { status: AssessmentRecord["status"] }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${m.bg} ${m.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

function SourceBadge({ source }: { source: AssessmentSource }) {
  const m = SOURCE_META[source];
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${m.bg} ${m.text}`}>
      {m.label}
    </span>
  );
}

// ─── Initiate modal ───────────────────────────────────────────────
interface InitiateModalProps {
  companies: Company[];
  onClose: () => void;
  onCreated: (record: AssessmentRecord) => void;
}

function InitiateModal({ companies, onClose, onCreated }: InitiateModalProps) {
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [source, setSource] = useState<AssessmentSource>("enterprise_self");
  const [showDropdown, setShowDropdown] = useState(false);

  const filtered = useMemo(() => {
    if (!search) return companies.slice(0, 20);
    const q = search.toLowerCase();
    return companies
      .filter((c) => c.name.toLowerCase().includes(q) || c.creditCode.includes(q))
      .slice(0, 20);
  }, [companies, search]);

  const selected = companies.find((c) => c.id === selectedId);

  function handleCreate() {
    if (!selected) return;
    const token = generateToken();
    const now = new Date().toISOString();
    const record: AssessmentRecord = {
      id: "asr_" + Date.now(),
      companyId: selected.id,
      token,
      source,
      status: "pending",
      createdAt: now,
    };
    saveAssessmentRecord(record);
    onCreated(record);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
              <ClipboardCheck size={16} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-[#0f172a]">发起高企测评</h2>
              <p className="text-xs text-[#94a3b8]">为目标企业创建测评任务</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#475569] transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Company picker */}
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-2">选择企业</label>
            <div className="relative">
              <div
                className={cn(
                  "flex items-center gap-2 px-3 py-2.5 border rounded-lg cursor-pointer transition-colors",
                  showDropdown ? "border-blue-400 ring-1 ring-blue-400" : "border-[#e2e8f0] hover:border-[#cbd5e1]"
                )}
                onClick={() => setShowDropdown(!showDropdown)}
              >
                <Search size={14} className="text-[#94a3b8] flex-shrink-0" />
                <input
                  type="text"
                  placeholder="输入企业名称或统一社会信用代码..."
                  value={selected && !showDropdown ? selected.name : search}
                  onChange={(e) => { setSearch(e.target.value); setShowDropdown(true); setSelectedId(null); }}
                  onFocus={() => setShowDropdown(true)}
                  className="flex-1 text-sm outline-none placeholder:text-[#94a3b8]"
                />
                <ChevronDown size={14} className={cn("text-[#94a3b8] transition-transform", showDropdown && "rotate-180")} />
              </div>

              {showDropdown && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-lg max-h-52 overflow-y-auto">
                  {filtered.length === 0 ? (
                    <div className="py-8 text-center text-sm text-[#94a3b8]">未找到匹配企业</div>
                  ) : (
                    filtered.map((c) => (
                      <div
                        key={c.id}
                        className={cn(
                          "px-3 py-2.5 cursor-pointer hover:bg-[#f8fafc] transition-colors",
                          selectedId === c.id && "bg-blue-50"
                        )}
                        onClick={() => { setSelectedId(c.id); setSearch(""); setShowDropdown(false); }}
                      >
                        <div className="text-sm font-medium text-[#0f172a] leading-snug">{c.name}</div>
                        <div className="text-xs text-[#94a3b8] mt-0.5">{c.creditCode} · {c.street}</div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {selected && (
              <div className="mt-2 flex items-center gap-3 px-3 py-2 bg-[#f8fafc] rounded-lg">
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[#0f172a] truncate">{selected.name}</div>
                  <div className="text-xs text-[#94a3b8]">{selected.techField ?? "未填技术领域"} · {selected.street}</div>
                </div>
                {selected.alreadyCertified && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 font-medium whitespace-nowrap">已认定高企</span>
                )}
              </div>
            )}
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-[#0f172a] mb-2">测评方式</label>
            <div className="grid grid-cols-2 gap-3">
              {(["enterprise_self", "staff_agent"] as AssessmentSource[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setSource(s)}
                  className={cn(
                    "flex flex-col items-start gap-1.5 px-4 py-3 border rounded-xl text-left transition-all",
                    source === s
                      ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
                      : "border-[#e2e8f0] hover:border-[#cbd5e1] hover:bg-[#f8fafc]"
                  )}
                >
                  <span className="text-sm font-medium text-[#0f172a]">{SOURCE_META[s].label}</span>
                  <span className="text-xs text-[#94a3b8] leading-snug">
                    {s === "enterprise_self"
                      ? "生成专属链接，由企业自行填写并提交"
                      : "工作人员现场代为录入测评信息"}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {source === "enterprise_self" && (
            <div className="flex items-start gap-2 px-3 py-2.5 bg-amber-50 border border-amber-100 rounded-lg">
              <div className="text-amber-500 mt-0.5 flex-shrink-0">⚡</div>
              <p className="text-xs text-amber-700 leading-relaxed">
                创建后将生成专属测评链接，可复制后发送给企业联系人。链接有效，企业提交后系统自动记录结果。
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#f1f5f9]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-[#475569] border border-[#e2e8f0] rounded-lg hover:bg-[#f8fafc] transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleCreate}
            disabled={!selected}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2",
              selected
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed"
            )}
          >
            <Plus size={14} />
            发起测评
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Share link toast ─────────────────────────────────────────────
function CopyToast({ visible }: { visible: boolean }) {
  return (
    <div
      className={cn(
        "fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-[#0f172a] text-white text-sm rounded-full shadow-lg transition-all duration-300 pointer-events-none",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
      )}
    >
      链接已复制到剪贴板
    </div>
  );
}

// ─── Score bar ────────────────────────────────────────────────────
function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? "bg-emerald-500" : score >= 50 ? "bg-amber-400" : "bg-red-500";
  return (
    <div className="flex items-center gap-2">
      <div className="w-16 h-1.5 bg-[#f1f5f9] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${Math.min(score, 100)}%` }} />
      </div>
      <span className="text-sm tabular-nums text-[#475569] font-medium">{score}</span>
    </div>
  );
}

// ─── Grade distribution chart ─────────────────────────────────────
function GradeChart({ records }: { records: AssessmentRecord[] }) {
  const completed = records.filter((r) => r.status === "completed" && r.score);
  const counts = { "优秀": 0, "符合": 0, "待培育": 0 };
  for (const r of completed) {
    if (r.score) counts[r.score.grade]++;
  }
  const option = {
    tooltip: { trigger: "item" },
    legend: { bottom: 0, textStyle: { fontSize: 12, color: "#64748b" } },
    series: [
      {
        type: "pie",
        radius: ["48%", "72%"],
        data: [
          { name: "优秀", value: counts["优秀"], itemStyle: { color: "#10b981" } },
          { name: "符合", value: counts["符合"], itemStyle: { color: "#3b82f6" } },
          { name: "待培育", value: counts["待培育"], itemStyle: { color: "#f59e0b" } },
        ].filter((d) => d.value > 0),
        label: { show: false },
      },
    ],
  };
  if (completed.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-[#94a3b8]">
        暂无已完成测评
      </div>
    );
  }
  return <EChartsWrapper option={option} height={180} />;
}

// ─── Score distribution chart ─────────────────────────────────────
function ScoreDistChart({ records }: { records: AssessmentRecord[] }) {
  const completed = records.filter((r) => r.status === "completed" && r.score);
  const buckets = ["0-30", "30-50", "50-70", "70-85", "85-100"];
  const counts = [0, 0, 0, 0, 0];
  for (const r of completed) {
    const s = r.score!.total;
    if (s < 30) counts[0]++;
    else if (s < 50) counts[1]++;
    else if (s < 70) counts[2]++;
    else if (s < 85) counts[3]++;
    else counts[4]++;
  }
  const option = {
    tooltip: { trigger: "axis" },
    xAxis: { type: "category", data: buckets, axisLine: { lineStyle: { color: "#e2e8f0" } }, axisLabel: { fontSize: 11, color: "#94a3b8" } },
    yAxis: { type: "value", minInterval: 1, axisLine: { show: false }, splitLine: { lineStyle: { color: "#f1f5f9" } } },
    series: [
      {
        type: "bar",
        data: counts,
        itemStyle: {
          color: (params: { dataIndex: number }) => {
            const colors = ["#ef4444", "#f97316", "#f59e0b", "#3b82f6", "#10b981"];
            return colors[params.dataIndex];
          },
          borderRadius: [4, 4, 0, 0],
        },
        label: { show: true, position: "top", fontSize: 11, color: "#475569" },
      },
    ],
    grid: { left: 8, right: 8, top: 20, bottom: 24, containLabel: true },
  };
  if (completed.length === 0) {
    return (
      <div className="h-[180px] flex items-center justify-center text-sm text-[#94a3b8]">
        暂无已完成测评
      </div>
    );
  }
  return <EChartsWrapper option={option} height={180} />;
}

// ─── Main component ───────────────────────────────────────────────
type FilterTab = "all" | "pending" | "completed";

interface Props {
  companies: Company[];
}

export default function HiEvalClient({ companies }: Props) {
  const [records, setRecords] = useState<AssessmentRecord[]>([]);
  const [filterTab, setFilterTab] = useState<FilterTab>("all");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"createdAt" | "score" | "company">("createdAt");
  const [showModal, setShowModal] = useState(false);
  const [copyToastVisible, setCopyToastVisible] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const loadRecords = useCallback(() => {
    setRecords(getAssessmentRecords());
  }, []);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const companyMap = useMemo(
    () => new Map(companies.map((c) => [c.id, c])),
    [companies]
  );

  const filtered = useMemo(() => {
    let list = [...records];
    if (filterTab !== "all") list = list.filter((r) => r.status === filterTab);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) => {
        const c = companyMap.get(r.companyId);
        return c?.name.toLowerCase().includes(q) || c?.creditCode.includes(q);
      });
    }
    return list.sort((a, b) => {
      if (sortBy === "createdAt") return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sortBy === "score") return (b.score?.total ?? -1) - (a.score?.total ?? -1);
      const ca = companyMap.get(a.companyId)?.name ?? "";
      const cb = companyMap.get(b.companyId)?.name ?? "";
      return ca.localeCompare(cb);
    });
  }, [records, filterTab, search, sortBy, companyMap]);

  // KPIs
  const totalCount = records.length;
  const pendingCount = records.filter((r) => r.status === "pending").length;
  const completedCount = records.filter((r) => r.status === "completed").length;
  const completedWithScore = records.filter((r) => r.status === "completed" && r.score);
  const avgScore = completedWithScore.length
    ? Math.round(completedWithScore.reduce((s, r) => s + r.score!.total, 0) / completedWithScore.length)
    : 0;

  const filterTabs: { key: FilterTab; label: string; count: number }[] = [
    { key: "all", label: "全部", count: totalCount },
    { key: "pending", label: "待完成", count: pendingCount },
    { key: "completed", label: "已完成", count: completedCount },
  ];

  function handleCopyLink(token: string) {
    const url = buildShareUrl(token);
    navigator.clipboard.writeText(url).catch(() => {});
    setCopyToastVisible(true);
    setTimeout(() => setCopyToastVisible(false), 2000);
  }

  function handleDelete(id: string) {
    const updated = records.filter((r) => r.id !== id);
    localStorage.setItem("assessment_records", JSON.stringify(updated));
    setRecords(updated);
    setDeleteConfirmId(null);
  }

  function handleCreated(record: AssessmentRecord) {
    setRecords((prev) => [record, ...prev]);
    setShowModal(false);
    if (record.source === "enterprise_self") {
      handleCopyLink(record.token);
    }
  }

  function formatDate(iso: string) {
    const d = new Date(iso);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">高企测评</h1>
          <p className="text-sm text-[#64748b] mt-0.5">
            共 {totalCount} 条测评记录 · {pendingCount} 条待完成 · {completedCount} 条已完成
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          发起测评
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4">
        <KPICard
          label="测评总数"
          value={totalCount}
          unit="条"
          icon={ClipboardCheck}
          iconBg="bg-blue-50"
          iconColor="text-blue-600"
          delta="累计发起"
          deltaUp={true}
        />
        <KPICard
          label="待完成"
          value={pendingCount}
          unit="条"
          icon={Clock}
          iconBg="bg-amber-50"
          iconColor="text-amber-600"
          delta="等待企业填写"
          deltaUp={false}
        />
        <KPICard
          label="已完成"
          value={completedCount}
          unit="条"
          icon={CheckCircle2}
          iconBg="bg-emerald-50"
          iconColor="text-emerald-600"
          delta="企业已提交"
          deltaUp={true}
        />
        <KPICard
          label="平均得分"
          value={avgScore || "—"}
          unit={avgScore ? "分" : ""}
          icon={Star}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          delta={completedWithScore.length > 0 ? `基于 ${completedWithScore.length} 条` : "暂无数据"}
          deltaUp={avgScore >= 70}
        />
      </div>

      {/* Charts */}
      {(completedCount > 0 || records.length > 0) && (
        <div className="grid gap-4" style={{ gridTemplateColumns: "1fr 1.5fr" }}>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-1">测评等级分布</h2>
            <p className="text-xs text-[#94a3b8] mb-3">已完成测评的评级占比</p>
            <GradeChart records={records} />
          </div>
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-5">
            <h2 className="text-sm font-semibold text-[#0f172a] mb-1">得分区间分布</h2>
            <p className="text-xs text-[#94a3b8] mb-3">企业综合得分的区间统计</p>
            <ScoreDistChart records={records} />
          </div>
        </div>
      )}

      {/* Records table */}
      <div className="bg-white rounded-xl border border-[#e2e8f0]">
        {/* Toolbar */}
        <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#f1f5f9]">
          <div className="flex items-center gap-1.5">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilterTab(tab.key)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                  filterTab === tab.key
                    ? "bg-blue-600 text-white"
                    : "bg-[#f8fafc] text-[#64748b] hover:bg-[#f1f5f9]"
                }`}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span className={`ml-1 ${filterTab === tab.key ? "text-blue-100" : "text-[#94a3b8]"}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          <div className="flex-1" />

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="搜索企业名称..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-7 pr-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg bg-[#f8fafc] w-44 placeholder:text-[#94a3b8] focus:outline-none focus:ring-1 focus:ring-blue-400"
            />
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-1.5 text-sm border border-[#e2e8f0] rounded-lg bg-[#f8fafc] text-[#475569] focus:outline-none"
          >
            <option value="createdAt">按发起时间</option>
            <option value="score">按得分</option>
            <option value="company">按企业名称</option>
          </select>

          <span className="text-xs text-[#94a3b8]">共 {filtered.length} 条</span>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="py-20 flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#f8fafc] flex items-center justify-center">
              <BarChart3 size={20} className="text-[#94a3b8]" />
            </div>
            <div className="text-sm text-[#94a3b8]">
              {totalCount === 0 ? "尚未发起任何测评，点击「发起测评」开始" : "暂无符合条件的记录"}
            </div>
            {totalCount === 0 && (
              <button
                onClick={() => setShowModal(true)}
                className="mt-1 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                发起第一条测评
              </button>
            )}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#f8fafc]">
                <th className="px-5 py-3 text-left text-xs font-medium text-[#94a3b8]">企业名称</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8]">测评方式</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">状态</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">发起时间</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-[#94a3b8]">完成时间</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[#94a3b8]">得分 / 等级</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-[#94a3b8]">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f8fafc]">
              {filtered.map((record) => {
                const company = companyMap.get(record.companyId);
                const isDeleting = deleteConfirmId === record.id;
                return (
                  <tr key={record.id} className="hover:bg-[#f8fafc] transition-colors group">
                    {/* Company */}
                    <td className="px-5 py-3.5">
                      <div className="font-medium text-[#0f172a] leading-snug">
                        {company?.name ?? <span className="text-[#94a3b8]">未知企业</span>}
                      </div>
                      <div className="text-xs text-[#94a3b8] mt-0.5">
                        {company?.street} · {company?.techField ?? "—"}
                      </div>
                    </td>

                    {/* Source */}
                    <td className="px-4 py-3.5">
                      <SourceBadge source={record.source} />
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 text-center">
                      <StatusBadge status={record.status} />
                    </td>

                    {/* Created at */}
                    <td className="px-4 py-3.5 text-center text-xs text-[#64748b]">
                      {formatDate(record.createdAt)}
                    </td>

                    {/* Submitted at */}
                    <td className="px-4 py-3.5 text-center text-xs text-[#64748b]">
                      {record.submittedAt ? formatDate(record.submittedAt) : <span className="text-[#cbd5e1]">—</span>}
                    </td>

                    {/* Score / Grade */}
                    <td className="px-4 py-3.5">
                      {record.score ? (
                        <div className="flex items-center gap-3">
                          <ScoreBar score={record.score.total} />
                          <span
                            className={`text-xs font-medium px-2 py-0.5 rounded ${
                              GRADE_META[record.score.grade].bg
                            } ${GRADE_META[record.score.grade].text}`}
                          >
                            {record.score.grade}
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-[#cbd5e1]">待填写</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        {record.status === "pending" && (
                          <button
                            onClick={() => handleCopyLink(record.token)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-colors font-medium"
                            title="复制测评链接"
                          >
                            <Copy size={12} />
                            复制链接
                          </button>
                        )}

                        {record.status === "completed" && (
                          <a
                            href={`/assessment/${record.token}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-md transition-colors font-medium"
                          >
                            <ExternalLink size={12} />
                            查看结果
                          </a>
                        )}

                        {isDeleting ? (
                          <div className="flex items-center gap-1 ml-1">
                            <span className="text-xs text-red-600">确认删除？</span>
                            <button
                              onClick={() => handleDelete(record.id)}
                              className="px-2 py-0.5 text-xs text-white bg-red-500 hover:bg-red-600 rounded transition-colors"
                            >
                              确认
                            </button>
                            <button
                              onClick={() => setDeleteConfirmId(null)}
                              className="px-2 py-0.5 text-xs text-[#64748b] border border-[#e2e8f0] rounded hover:bg-[#f8fafc] transition-colors"
                            >
                              取消
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirmId(record.id)}
                            className="p-1.5 text-[#cbd5e1] hover:text-red-400 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100"
                            title="删除记录"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <InitiateModal
          companies={companies}
          onClose={() => setShowModal(false)}
          onCreated={handleCreated}
        />
      )}

      {/* Copy toast */}
      <CopyToast visible={copyToastVisible} />
    </div>
  );
}
