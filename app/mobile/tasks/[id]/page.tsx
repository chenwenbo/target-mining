"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getAllTasks, getCompanyById, getIPItems } from "@/lib/mock-data";
import {
  getCurrentVisitor,
  getVisitRecords,
  getTaskStatusOverrides,
  getDispatchedTasks,
  getCustomTasks,
} from "@/lib/mobile-mock";
import {
  generateToken,
  buildShareUrl,
  saveAssessmentRecord,
  getLatestCompletedByCompany,
  getLatestPendingByCompany,
} from "@/lib/assessment-store";
import {
  LG_REVENUE_MAP,
  LG_GROWTH_MAP,
  LG_MAINBIZ_RATIO_MAP,
  LG_DEBT_MAP,
  LG_YEARS_MAP,
  LG_RD_RATIO_MAP,
  LG_RD_STAFF_MAP,
  LG_STANDARDS_MAP,
  LG_MARKET_SHARE_MAP,
  bool3Map,
} from "@/app/(main)/tasks/lifecycle";
import { getAssessmentConfig } from "@/lib/assessment";
import type {
  TaskStatus,
  Company,
  VisitRecord,
  IPItem,
  IPType,
  AssessmentRecord,
  AssessmentScore,
  QualificationType,
} from "@/lib/types";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Users,
  Award,
  Shield,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
  CheckCircle,
  FileText,
  Link2,
  Copy,
  Check,
  ClipboardList,
  PenLine,
  RefreshCcw,
  QrCode,
  X,
  Clock,
  XCircle,
} from "lucide-react";

const WILLINGNESS_LABELS: Record<string, { label: string; color: string }> = {
  strong:      { label: "意愿强烈",   color: "bg-emerald-100 text-emerald-700" },
  moderate:    { label: "有一定意愿", color: "bg-blue-100 text-blue-700" },
  hesitant:    { label: "态度观望",   color: "bg-amber-100 text-amber-700" },
  refused:     { label: "明确拒绝",   color: "bg-red-100 text-red-700" },
  unreachable: { label: "无法联系",   color: "bg-gray-100 text-gray-500" },
};

const METHOD_LABELS: Record<string, string> = {
  in_person: "上门拜访",
  online:    "线上沟通",
};

const REVENUE_LABELS: Record<string, string> = {
  under_500w:   "500万以下",
  "500w_2000w": "500万–2000万",
  "2000w_1yi":  "2000万–1亿",
  above_1yi:    "1亿以上",
};
const RD_RATIO_LABELS: Record<string, string> = {
  under_3pct:  "3%以下",
  "3_5pct":    "3%–5%",
  "5_10pct":   "5%–10%",
  above_10pct: "10%以上",
};
const RD_SOURCE_LABELS: Record<string, string> = {
  self_invested:    "自投",
  government_grant: "政府资助",
  both:             "自投+政府资助",
  none:             "无",
};

const GRADE_META: Record<
  AssessmentScore["grade"],
  { label: string; bg: string; text: string; scoreBg: string }
> = {
  优秀:   { label: "条件优秀",     bg: "bg-emerald-50", text: "text-emerald-700", scoreBg: "text-emerald-600" },
  符合:   { label: "符合申报条件", bg: "bg-blue-50",    text: "text-blue-700",   scoreBg: "text-blue-600"    },
  待培育: { label: "待重点培育",   bg: "bg-amber-50",   text: "text-amber-700",  scoreBg: "text-amber-600"   },
};


export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") === "assessment" || searchParams.get("tab") === "history")
    ? (searchParams.get("tab") as "history" | "assessment")
    : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "history" | "assessment">(initialTab);

  useEffect(() => {
    if (!getCurrentVisitor()) router.replace("/mobile/login");
  }, [router]);

  const overrides = getTaskStatusOverrides();
  const task = [...getAllTasks(), ...getDispatchedTasks(), ...getCustomTasks()].find((t) => t.id === id);
  if (!task) return <div className="p-6 text-gray-400 text-sm">任务不存在</div>;

  const status = (overrides[id] ?? task.status) as TaskStatus;
  const company = getCompanyById(task.companyId);
  if (!company) return <div className="p-6 text-gray-400 text-sm">企业数据不存在</div>;
  const records = getVisitRecords()
    .filter((r) => r.companyId === company.id)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));


  const STATUS_STYLES: Record<TaskStatus, string> = {
    pending:     "bg-gray-100 text-gray-500",
    done:        "bg-emerald-100 text-emerald-600",
  };
  const STATUS_LABELS: Record<TaskStatus, string> = {
    pending: "待摸排", done: "摸排完成",
  };

  const TAB_LABELS = {
    overview:   "企业概况",
    history:    `走访历史(${records.length})`,
    assessment: "企业测评",
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部 Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-3 pb-0">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <h1 className="font-semibold text-gray-800 text-sm flex-1 truncate">{company.name}</h1>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* 荣誉资质 */}
        {(company.alreadyCertified || company.inSMEDatabase) && (
          <div className="flex gap-2 flex-wrap pb-3">
            {company.alreadyCertified && (
              <span className="flex items-center gap-1 bg-amber-50 border border-amber-200 rounded-full px-2.5 py-1 text-xs font-medium text-amber-700">
                <AlertTriangle size={10} />
                已认定高企（复审池）
              </span>
            )}
            {company.inSMEDatabase && (
              <span className="flex items-center gap-1 bg-blue-50 border border-blue-100 rounded-full px-2.5 py-1 text-xs font-medium text-blue-600">
                <CheckCircle size={10} />
                科技型中小企业
              </span>
            )}
          </div>
        )}

        {/* Tab 栏 */}
        <div className="flex -mx-4 px-4 border-t border-gray-100">
          {(["overview", "history", "assessment"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400"
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview"    && <OverviewTab company={company} />}
        {activeTab === "history"     && <HistoryTab records={records} />}
        {activeTab === "assessment"  && (
          <AssessmentTab company={company} taskId={id} qualType={task.qualType} />
        )}
      </div>

      {/* 底部操作栏 — 仅在概况/历史标签下，且任务未完成时显示 */}
      {activeTab !== "assessment" && (
        <div className="bg-white border-t border-gray-100 px-4 py-3">
          {status !== "done" ? (
            <Link href={`/mobile/tasks/${id}/visit`}>
              <button className="w-full bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl active:scale-[0.98] transition-transform">
                开始走访记录
              </button>
            </Link>
          ) : (
            <div className="flex items-center justify-center gap-2 text-emerald-600 text-sm font-medium py-2">
              <CheckCircle size={16} />
              <span>摸排已完成</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── AssessmentTab ───────────────────────────────────────────────
function AssessmentTab({
  company,
  taskId,
  qualType,
}: {
  company: Company;
  taskId: string;
  qualType?: QualificationType;
}) {
  const [completed, setCompleted] = useState<AssessmentRecord | null>(null);
  const [pending, setPending] = useState<AssessmentRecord | null>(null);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  useEffect(() => {
    const c = getLatestCompletedByCompany(company.id) ?? null;
    setCompleted(c);
    const p = getLatestPendingByCompany(company.id) ?? null;
    setPending(p);
    // prefer pending link; if already completed but no pending link, use completed token
    const tok = p?.token ?? c?.token;
    if (tok) setShareUrl(buildShareUrl(tok));
  }, [company.id]);

  function handleGenerate() {
    const token = generateToken();
    const record: AssessmentRecord = {
      id: `ar_${Date.now()}`,
      companyId: company.id,
      token,
      source: "enterprise_self",
      status: "pending",
      createdAt: new Date().toISOString(),
      taskId,
      qualType,
    };
    saveAssessmentRecord(record);
    setPending(record);
    setShareUrl(buildShareUrl(token));
  }

  function handleCopy() {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  const score = completed?.score;
  const dimColors: Record<string, string> = Object.fromEntries(
    getAssessmentConfig(completed?.qualType).dimensions.map((d) => [d.id, d.color]),
  );

  return (
    <div className="px-4 py-4 space-y-3 pb-8">
      {/* ── 企业自主测评 ── */}
      <div className="bg-white rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Link2 size={14} className="text-blue-500" />
          <h3 className="text-xs font-semibold text-gray-700">企业自主测评</h3>
        </div>
        <p className="text-[11px] text-gray-400 leading-relaxed">
          生成专属链接发送给企业，企业负责人扫码或点击链接即可自行完成测评。
        </p>

        {!shareUrl ? (
          <button
            onClick={handleGenerate}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white text-xs font-semibold py-2.5 rounded-xl active:scale-[0.98] transition-transform"
          >
            <Link2 size={13} />
            生成测评链接
          </button>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
              <span className="flex-1 text-[10px] text-gray-500 truncate">{shareUrl}</span>
              <button
                onClick={handleCopy}
                className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                  copied
                    ? "bg-emerald-100 text-emerald-600"
                    : "bg-blue-100 text-blue-600 active:bg-blue-200"
                }`}
              >
                {copied ? <Check size={11} /> : <Copy size={11} />}
                {copied ? "已复制" : "复制链接"}
              </button>
              <button
                onClick={() => setShowQr((v) => !v)}
                className={`flex items-center gap-1 text-[10px] font-medium px-2.5 py-1 rounded-lg transition-colors shrink-0 ${
                  showQr
                    ? "bg-purple-100 text-purple-600"
                    : "bg-gray-100 text-gray-500 active:bg-gray-200"
                }`}
              >
                {showQr ? <X size={11} /> : <QrCode size={11} />}
                {showQr ? "关闭" : "二维码"}
              </button>
            </div>

            {showQr && (
              <div className="flex flex-col items-center gap-2 bg-gray-50 rounded-xl p-4 border border-gray-100">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(shareUrl)}`}
                  alt="测评二维码"
                  width={180}
                  height={180}
                  className="rounded-lg"
                />
                <p className="text-[10px] text-gray-400">扫码即可完成企业自主测评</p>
              </div>
            )}

            <button
              onClick={handleGenerate}
              className="flex items-center gap-1 text-[10px] text-gray-400 active:text-gray-600"
            >
              <RefreshCcw size={10} />
              重新生成链接
            </button>
          </div>
        )}
      </div>

      {/* ── 工作人员代填 ── */}
      <Link href={`/mobile/tasks/${taskId}/assessment`}>
        <div className="bg-white rounded-xl p-4 flex items-center gap-3 active:bg-gray-50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
            <PenLine size={14} className="text-purple-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-800">工作人员代填测评</p>
            <p className="text-[11px] text-gray-400 mt-0.5">当场帮企业逐题完成测评问卷</p>
          </div>
          <ChevronRight size={16} className="text-gray-300 shrink-0" />
        </div>
      </Link>

      {/* ── 测评结果 ── */}
      {score ? (
        <div className="bg-white rounded-xl p-4 space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardList size={14} className="text-blue-500" />
            <h3 className="text-xs font-semibold text-gray-700">测评结果</h3>
            <span className="ml-auto text-[10px] text-gray-400">
              {completed!.source === "enterprise_self" ? "企业自填" : `${completed!.submitterName} 代填`}
              {" · "}
              {completed!.submittedAt?.slice(0, 10)}
            </span>
          </div>

          {/* Score summary */}
          <div className="flex items-center gap-4">
            <div className={`text-4xl font-bold ${GRADE_META[score.grade].scoreBg}`}>
              {score.total}
            </div>
            <div>
              <p className="text-xs text-gray-400">/ 100 分</p>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${GRADE_META[score.grade].bg} ${GRADE_META[score.grade].text} mt-1 inline-block`}
              >
                {GRADE_META[score.grade].label}
              </span>
            </div>
          </div>

          {/* Dimension bars */}
          <div className="space-y-2.5">
            {score.dimensionScores.map((d) => (
              <div key={d.dimension} className="flex items-center gap-2">
                <span className="text-[10px] text-gray-400 w-14 shrink-0">{d.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${(d.score / d.maxScore) * 100}%`,
                      backgroundColor: dimColors[d.dimension],
                    }}
                  />
                </div>
                <span className="text-[10px] font-medium text-gray-600 w-9 text-right shrink-0">
                  {d.score}/{d.maxScore}
                </span>
              </div>
            ))}
          </div>

          {/* Suggestions */}
          {score.suggestions.length > 0 && (
            <div className="space-y-2 pt-1 border-t border-gray-100">
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">培育建议</p>
              {score.suggestions.map((s, i) => (
                <div
                  key={i}
                  className={`rounded-xl p-3 ${
                    s.urgent ? "bg-red-50 border border-red-100" : "bg-amber-50 border border-amber-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className={`text-[10px] font-bold ${s.urgent ? "text-red-600" : "text-amber-600"}`}>
                      {s.urgent ? "⚠ 重要" : "建议"}
                    </span>
                    <span className="text-[11px] font-semibold text-gray-800">{s.title}</span>
                  </div>
                  <p className="text-[10px] text-gray-600 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-gray-300">
          <ClipboardList size={36} className="mb-2 opacity-40" />
          <p className="text-xs">暂无测评结果</p>
          <p className="text-[10px] mt-1 text-gray-300">发送链接给企业或代填后结果将显示在此</p>
        </div>
      )}
    </div>
  );
}

// ─── IP Drawer ───────────────────────────────────────────────────
const IP_TYPE_LABELS: Record<IPType, string> = {
  invention: "发明专利",
  utility:   "实用新型",
  design:    "外观设计",
  software:  "软著",
};

const IP_STATUS_COLORS: Record<string, string> = {
  "授权": "bg-emerald-50 text-emerald-700",
  "公开": "bg-blue-50 text-blue-600",
  "审中": "bg-amber-50 text-amber-600",
  "登记": "bg-emerald-50 text-emerald-700",
};

function IPDrawer({
  type,
  items,
  onClose,
}: {
  type: IPType;
  items: IPItem[];
  onClose: () => void;
}) {
  const filtered = items.filter((item) => item.type === type);
  const label = IP_TYPE_LABELS[type];

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 bg-white rounded-t-2xl max-h-[70vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <div>
            <h3 className="font-semibold text-gray-800 text-sm">{label}明细</h3>
            <p className="text-[11px] text-gray-400 mt-0.5">共 {filtered.length} 项</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg leading-none"
          >
            ×
          </button>
        </div>
        {filtered.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm py-8">
            暂无{label}数据
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2.5">
            {filtered.map((item, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start gap-2">
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5 ${IP_STATUS_COLORS[item.status] ?? "bg-gray-100 text-gray-500"}`}>
                    {item.status}
                  </span>
                  <p className="text-xs text-gray-800 font-medium leading-snug flex-1">{item.name}</p>
                </div>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-[10px] text-gray-400">{item.number}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="h-safe-bottom shrink-0" style={{ height: "env(safe-area-inset-bottom, 8px)" }} />
      </div>
    </>
  );
}

// ─── OverviewTab ─────────────────────────────────────────────────
function OverviewTab({ company }: { company: Company }) {
  const [activeIPType, setActiveIPType] = useState<IPType | null>(null);
  const ipItems = getIPItems(company);

  const yearsSince = (
    (Date.now() - new Date(company.establishedAt).getTime()) /
    (1000 * 60 * 60 * 24 * 365)
  ).toFixed(1);

  const rows = [
    { label: "统一社会信用代码", value: company.creditCode },
    { label: "成立日期",         value: company.establishedAt.slice(0, 10) },
    { label: "成立年限",         value: `${yearsSince} 年` },
    { label: "注册资本",         value: `${company.registeredCapital} 万元` },
    { label: "参保人数",         value: `${company.employees} 人` },
    { label: "研发人员",         value: `${company.rdEmployees} 人` },
    { label: "技术领域",         value: company.techField ?? "暂未匹配" },
    { label: "所属街道",         value: company.street },
  ];

  const ipGroups: { label: string; count: number; type: IPType }[] = [
    { label: "发明专利", count: company.patents.invention, type: "invention" },
    { label: "实用新型", count: company.patents.utility,   type: "utility" },
    { label: "外观设计", count: company.patents.design,    type: "design" },
    { label: "软著",     count: company.software,          type: "software" },
  ];

  return (
    <>
      <div className="px-4 py-4 space-y-4">
        {/* 联系人 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">联系人</h3>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm">
              {company.contact.name[0]}
            </div>
            <div className="flex-1">
              <div className="font-medium text-gray-800 text-sm">{company.contact.name}</div>
              <div className="text-xs text-gray-400 mt-0.5">{company.contact.phone}</div>
            </div>
            <a href={`tel:${company.contact.phone}`} className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-lg font-medium">
              <Phone size={12} />
              拨打
            </a>
          </div>
        </div>

        {/* 基本信息 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">基本信息</h3>
          <div className="space-y-2.5">
            {rows.map(({ label, value }) => (
              <div key={label} className="flex justify-between items-start gap-2">
                <span className="text-xs text-gray-400 shrink-0">{label}</span>
                <span className="text-xs text-gray-700 text-right font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 知识产权 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">知识产权</h3>
          <div className="grid grid-cols-4 gap-3">
            {ipGroups.map(({ label, count, type }) => (
              <button
                key={type}
                onClick={() => count > 0 && setActiveIPType(type)}
                disabled={count === 0}
                className={`text-center py-2 rounded-xl transition-colors ${
                  count > 0 ? "active:bg-blue-50 cursor-pointer" : "cursor-default"
                }`}
              >
                <div className={`text-xl font-bold ${count > 0 ? "text-blue-600" : "text-gray-300"}`}>
                  {count}
                </div>
                <div className={`text-[10px] mt-0.5 ${count > 0 ? "text-blue-400" : "text-gray-400"}`}>
                  {label}
                </div>
                {count > 0 && (
                  <div className="text-[9px] text-gray-300 mt-0.5">点击查看</div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 合规与认定状态 */}
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">合规与状态</h3>
          <div className="space-y-2">
            {[
              { label: "经营异常", bad: company.risk.abnormal, badText: "存在异常", goodText: "无异常" },
              { label: "行政处罚", bad: company.risk.penalty,  badText: "存在处罚", goodText: "无处罚" },
            ].map(({ label, bad, badText, goodText }) => {
              const isGood = !bad;
              return (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">{label}</span>
                  <span className={`text-xs font-medium flex items-center gap-1 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
                    {isGood ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                    {bad ? badText : goodText}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {activeIPType && (
        <IPDrawer
          type={activeIPType}
          items={ipItems}
          onClose={() => setActiveIPType(null)}
        />
      )}
    </>
  );
}

// ─── HistoryTab ──────────────────────────────────────────────────
function HistoryTab({ records }: { records: VisitRecord[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <FileText size={36} className="mb-3 opacity-30" />
        <p className="text-sm">尚无走访记录</p>
        <p className="text-xs mt-1">点击下方"开始走访记录"记录首次走访</p>
      </div>
    );
  }

  return (
    <div className="px-4 py-4 space-y-3">
      {records.map((r) => {
        const w = WILLINGNESS_LABELS[r.willingness] ?? { label: "-", color: "bg-gray-100 text-gray-400" };
        const isExpanded = expandedId === r.id;
        return (
          <div key={r.id} className="bg-white rounded-xl overflow-hidden">
            <button
              onClick={() => setExpandedId(isExpanded ? null : r.id)}
              className="w-full flex items-center gap-3 p-4 text-left"
            >
              <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                <span className="text-xs">
                  {r.visitMethod === "in_person" ? "🏢" : "💻"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span className="text-xs font-medium text-gray-700">
                    {r.visitedAt.slice(0, 10)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {METHOD_LABELS[r.visitMethod]}
                  </span>
                  {r.visitDurationMinutes && (
                    <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                      <Clock size={9} />{r.visitDurationMinutes}分钟
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">{r.visitorName}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${w.color}`}>
                    {w.label}
                  </span>
                </div>
              </div>
              {isExpanded ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
            </button>

            {isExpanded && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-3">

                {/* 联系情况 */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">联系情况</p>
                  <div className="flex items-center gap-1.5 text-xs">
                    {r.contactReached
                      ? <CheckCircle size={12} className="text-emerald-500" />
                      : <XCircle size={12} className="text-red-400" />}
                    <span className={r.contactReached ? "text-emerald-600" : "text-red-500"}>
                      {r.contactReached ? "已联系到" : "未联系上"}
                    </span>
                  </div>
                  {r.contactReached && r.actualContactName && (
                    <div className="text-xs text-gray-600 ml-4">
                      <span className="font-medium text-gray-800">{r.actualContactName}</span>
                      {r.actualContactTitle && <span className="text-gray-400"> · {r.actualContactTitle}</span>}
                      {r.actualContactPhone && (
                        <a href={`tel:${r.actualContactPhone}`} className="flex items-center gap-1 text-blue-500 mt-0.5">
                          <Phone size={10} />{r.actualContactPhone}
                        </a>
                      )}
                    </div>
                  )}
                </div>

                {/* 现场核实数据 */}
                {(() => {
                  const fv = r.fieldVerified;
                  const rows = [
                    fv.mainProductDesc && { label: "主营业务", value: fv.mainProductDesc },
                    fv.employeeCount != null && { label: "员工总数", value: `${fv.employeeCount}人` },
                    fv.rdEmployeeCount != null && { label: "研发人员", value: `${fv.rdEmployeeCount}人` },
                    fv.annualRevenue && { label: "年收入", value: REVENUE_LABELS[fv.annualRevenue] ?? fv.annualRevenue },
                    fv.rdExpenseRatio && { label: "研发费用占比", value: RD_RATIO_LABELS[fv.rdExpenseRatio] ?? fv.rdExpenseRatio },
                    fv.rdExpenseSource && { label: "研发费用来源", value: RD_SOURCE_LABELS[fv.rdExpenseSource] ?? fv.rdExpenseSource },
                    fv.hasTechDept != null && { label: "独立研发部门", value: fv.hasTechDept ? "有" : "无" },
                    fv.hasAccountingFirm != null && { label: "会计师事务所", value: fv.hasAccountingFirm ? "是" : "否" },
                  ].filter(Boolean) as { label: string; value: string }[];
                  return rows.length > 0 ? (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">现场核实数据</p>
                      {rows.map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between text-xs gap-2">
                          <span className="text-gray-400 shrink-0">{label}</span>
                          <span className="text-gray-700 font-medium text-right">{value}</span>
                        </div>
                      ))}
                    </div>
                  ) : null;
                })()}

                {/* 小巨人核实数据 */}
                {r.littleGiant && (() => {
                  const g = r.littleGiant;
                  const rows = [
                    (g.industrialBaseCategory) && { label: "所属领域", value: `${g.industrialBaseCategory}${g.industrialBaseItem ? " · " + g.industrialBaseItem : ""}` },
                    g.mainProductDesc && { label: "主导产品", value: g.mainProductDesc },
                    g.annualRevenueBand && { label: "上年度营收", value: LG_REVENUE_MAP[g.annualRevenueBand] ?? g.annualRevenueBand },
                    g.mainBizGrowth2y && { label: "近2年增长率", value: LG_GROWTH_MAP[g.mainBizGrowth2y] ?? g.mainBizGrowth2y },
                    g.mainBizRevenueRatio && { label: "主营收入占比", value: LG_MAINBIZ_RATIO_MAP[g.mainBizRevenueRatio] ?? g.mainBizRevenueRatio },
                    g.debtRatio && { label: "资产负债率", value: LG_DEBT_MAP[g.debtRatio] ?? g.debtRatio },
                    g.subdivisionYears && { label: "细分市场年限", value: LG_YEARS_MAP[g.subdivisionYears] ?? g.subdivisionYears },
                    g.rdExpenseRatio && { label: "研发费用占比", value: LG_RD_RATIO_MAP[g.rdExpenseRatio] ?? g.rdExpenseRatio },
                    g.rdStaffRatio && { label: "研发人员占比", value: LG_RD_STAFF_MAP[g.rdStaffRatio] ?? g.rdStaffRatio },
                    g.hasProvincialRdInstitution != null && { label: "省级研发机构", value: bool3Map(g.hasProvincialRdInstitution) },
                    g.standardsRole && { label: "标准制定", value: LG_STANDARDS_MAP[g.standardsRole] ?? g.standardsRole },
                    g.marketShare && { label: "市场占有率", value: LG_MARKET_SHARE_MAP[g.marketShare] ?? g.marketShare },
                    g.fillsGapOrImportSub != null && { label: "填补空白/进口替代", value: bool3Map(g.fillsGapOrImportSub) },
                    g.hasOwnBrand != null && { label: "自主品牌", value: bool3Map(g.hasOwnBrand) },
                    g.supplyChainRole && { label: "产业链地位", value: g.supplyChainRole },
                    g.expectedDeclareYear && { label: "预计申报年度", value: g.expectedDeclareYear === "uncertain" ? "暂不明确" : `${g.expectedDeclareYear}年` },
                  ].filter(Boolean) as { label: string; value: string }[];
                  return (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">小巨人摸排数据</p>
                      {rows.map(({ label, value }) => (
                        <div key={label} className="flex items-start justify-between text-xs gap-2">
                          <span className="text-gray-400 shrink-0">{label}</span>
                          <span className="text-gray-700 font-medium text-right">{value}</span>
                        </div>
                      ))}
                      {(g.bottleneckTraits ?? []).length > 0 && (
                        <div>
                          <span className="text-[10px] text-gray-400">卡脖子/补短板：</span>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {g.bottleneckTraits!.map((t, i) => (
                              <span key={i} className="text-[10px] bg-rose-50 text-rose-600 px-2 py-0.5 rounded">{t}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* 意愿与跟进 */}
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">意愿与跟进</p>
                  {r.willingnessNotes && (
                    <div>
                      <span className="text-[10px] text-gray-400">意愿备注：</span>
                      <p className="text-xs text-gray-700 mt-0.5">{r.willingnessNotes}</p>
                    </div>
                  )}
                  {r.acknowledgedGaps.length > 0 && (
                    <div>
                      <span className="text-[10px] text-gray-400">认可障碍：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.acknowledgedGaps.map((g, i) => (
                          <span key={i} className="text-[10px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded">{g}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.keyObstacles && (
                    <div>
                      <span className="text-[10px] text-gray-400">关键障碍：</span>
                      <p className="text-xs text-gray-700 mt-0.5">{r.keyObstacles}</p>
                    </div>
                  )}
                  {r.nextSteps.length > 0 && (
                    <div>
                      <span className="text-[10px] text-gray-400">企业需求：</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {r.nextSteps.map((s, i) => (
                          <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s}</span>
                        ))}
                      </div>
                    </div>
                  )}
                  {r.companyCommitments && (
                    <div>
                      <span className="text-[10px] text-gray-400">企业承诺：</span>
                      <p className="text-xs text-gray-700 mt-0.5">{r.companyCommitments}</p>
                    </div>
                  )}
                  {r.followUpDate && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">下次联系日期</span>
                      <span className="text-blue-600 font-medium">{r.followUpDate}</span>
                    </div>
                  )}
                  {r.notes && (
                    <div>
                      <span className="text-[10px] text-gray-400">内部备注：</span>
                      <p className="text-xs text-gray-400 italic mt-0.5">{r.notes}</p>
                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
