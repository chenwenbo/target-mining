"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAllTasks, getScoredById } from "@/lib/mock-data";
import {
  getCurrentVisitor,
  getVisitRecordsByTask,
  getTaskStatusOverrides,
} from "@/lib/mobile-mock";
import { TIER_CONFIG } from "@/lib/tiers";
import type { TaskStatus, ScoredCompany, VisitRecord } from "@/lib/types";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Users,
  Award,
  Shield,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  CheckCircle,
  FileText,
} from "lucide-react";

const WILLINGNESS_LABELS: Record<string, { label: string; color: string }> = {
  strong:      { label: "意愿强烈",   color: "bg-emerald-100 text-emerald-700" },
  moderate:    { label: "有一定意愿", color: "bg-blue-100 text-blue-700" },
  hesitant:    { label: "态度观望",   color: "bg-amber-100 text-amber-700" },
  refused:     { label: "明确拒绝",   color: "bg-red-100 text-red-700" },
  unreachable: { label: "无法联系",   color: "bg-gray-100 text-gray-500" },
};

const METHOD_LABELS: Record<string, string> = {
  in_person:      "上门拜访",
  phone:          "电话沟通",
  online_meeting: "视频会议",
};

export default function TaskDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<"overview" | "score" | "history">("overview");
  const [expandedGaps, setExpandedGaps] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!getCurrentVisitor()) router.replace("/mobile/login");
  }, [router]);

  const overrides = getTaskStatusOverrides();
  const task = getAllTasks().find((t) => t.id === id);
  if (!task) return <div className="p-6 text-gray-400 text-sm">任务不存在</div>;

  const status = (overrides[id] ?? task.status) as TaskStatus;
  const scored = getScoredById(task.companyId) as ScoredCompany;
  const company = scored;
  const records = getVisitRecordsByTask(id).sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );

  const cfg = TIER_CONFIG[task.tier];
  const isOverdue = status !== "done" && new Date(task.deadline) < new Date();

  const STATUS_STYLES: Record<TaskStatus, string> = {
    pending:     "bg-gray-100 text-gray-500",
    in_progress: "bg-blue-100 text-blue-600",
    done:        "bg-emerald-100 text-emerald-600",
  };
  const STATUS_LABELS: Record<TaskStatus, string> = {
    pending: "待走访", in_progress: "进行中", done: "已完成",
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
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${cfg.bg} ${cfg.color}`}>
            {cfg.label}
          </span>
          <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STATUS_STYLES[status]}`}>
            {STATUS_LABELS[status]}
          </span>
        </div>

        {/* 快捷信息横向滑动 */}
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-3 -mx-1 px-1">
          {[
            { icon: MapPin, text: company.street },
            { icon: Calendar, text: isOverdue ? `超期 ${task.deadline}` : `截止 ${task.deadline}`, red: isOverdue },
            { icon: FileText, text: `走访 ${records.length} 次` },
            { icon: Users, text: `${company.employees} 人` },
          ].map(({ icon: Icon, text, red }, i) => (
            <div key={i} className={`flex items-center gap-1.5 shrink-0 bg-gray-50 rounded-lg px-3 py-2 text-xs ${red ? "text-red-500" : "text-gray-500"}`}>
              <Icon size={12} />
              <span>{text}</span>
            </div>
          ))}
        </div>

        {/* Tab 栏 */}
        <div className="flex -mx-4 px-4 border-t border-gray-100">
          {(["overview", "score", "history"] as const).map((tab) => {
            const labels = { overview: "企业概况", score: "评分分析", history: `走访历史(${records.length})` };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                  activeTab === tab ? "border-blue-500 text-blue-600" : "border-transparent text-gray-400"
                }`}
              >
                {labels[tab]}
              </button>
            );
          })}
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === "overview" && <OverviewTab company={company} />}
        {activeTab === "score" && (
          <ScoreTab
            scored={scored}
            expandedGaps={expandedGaps}
            onToggleGap={(i) =>
              setExpandedGaps((prev) => {
                const next = new Set(prev);
                next.has(i) ? next.delete(i) : next.add(i);
                return next;
              })
            }
          />
        )}
        {activeTab === "history" && <HistoryTab records={records} />}
      </div>

      {/* 底部操作栏 */}
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
            <span>任务已完成</span>
          </div>
        )}
      </div>
    </div>
  );
}

function OverviewTab({ company }: { company: ScoredCompany }) {
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

  return (
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
          {[
            { label: "发明专利", count: company.patents.invention },
            { label: "实用新型", count: company.patents.utility },
            { label: "外观设计", count: company.patents.design },
            { label: "软著",     count: company.software },
          ].map(({ label, count }) => (
            <div key={label} className="text-center">
              <div className={`text-xl font-bold ${count > 0 ? "text-blue-600" : "text-gray-300"}`}>
                {count}
              </div>
              <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
            </div>
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
            { label: "已认定高企", bad: company.alreadyCertified, badText: "已认定（复审池）", goodText: "未认定（潜在标的）", invert: true },
            { label: "科技型中小企业", bad: !company.inSMEDatabase, badText: "未入库", goodText: "已入库", invert: true },
          ].map(({ label, bad, badText, goodText, invert }) => {
            const isGood = invert ? bad : !bad;
            return (
              <div key={label} className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{label}</span>
                <span className={`text-xs font-medium flex items-center gap-1 ${isGood ? "text-emerald-600" : "text-red-500"}`}>
                  {isGood ? <CheckCircle size={11} /> : <AlertTriangle size={11} />}
                  {bad ? (invert ? goodText : badText) : (invert ? badText : goodText)}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ScoreTab({
  scored, expandedGaps, onToggleGap,
}: {
  scored: ScoredCompany;
  expandedGaps: Set<number>;
  onToggleGap: (i: number) => void;
}) {
  const { score } = scored;
  const cfg = TIER_CONFIG[score.tier];
  const tierColors: Record<string, string> = {
    A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#94a3b8",
  };
  const color = tierColors[score.tier];

  return (
    <div className="px-4 py-4 space-y-4">
      {/* 总分环 */}
      <div className="bg-white rounded-xl p-5 flex items-center gap-4">
        <div className="relative w-20 h-20 shrink-0">
          <svg viewBox="0 0 80 80" className="w-full h-full -rotate-90">
            <circle cx="40" cy="40" r="32" fill="none" stroke="#f1f5f9" strokeWidth="8" />
            <circle
              cx="40" cy="40" r="32" fill="none"
              stroke={color} strokeWidth="8"
              strokeDasharray={`${(score.total / 100) * 201} 201`}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-bold" style={{ color }}>{score.total}</span>
          </div>
        </div>
        <div>
          <div className={`inline-flex items-center gap-1 text-sm font-bold px-2.5 py-1 rounded-lg mb-1 ${cfg.bg} ${cfg.color}`}>
            <Award size={14} />
            {cfg.label} · {cfg.desc}
          </div>
          <p className="text-xs text-gray-400">综合加权评分，满分100</p>
          <p className="text-xs text-gray-400 mt-0.5">{score.gaps.length} 项待改善</p>
        </div>
      </div>

      {/* 六维得分 */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">六维评分</h3>
        <div className="space-y-3">
          {score.dimensions.map((dim) => {
            const barColor =
              dim.score >= 70 ? "bg-emerald-500" :
              dim.score >= 40 ? "bg-amber-400" : "bg-red-400";
            return (
              <div key={dim.name}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-600 font-medium">{dim.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-gray-400">权重 {Math.round(dim.weight * 100)}%</span>
                    <span className={`text-xs font-bold ${
                      dim.score >= 70 ? "text-emerald-600" :
                      dim.score >= 40 ? "text-amber-500" : "text-red-500"
                    }`}>{dim.score}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${barColor}`} style={{ width: `${dim.score}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 缺项分析 */}
      {score.gaps.length > 0 && (
        <div className="bg-white rounded-xl p-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            缺项分析 · {score.gaps.filter((g) => g.urgent).length} 项硬性要求
          </h3>
          <div className="space-y-2">
            {score.gaps.map((gap, i) => (
              <div key={i} className={`border rounded-lg overflow-hidden ${gap.urgent ? "border-red-200" : "border-gray-200"}`}>
                <button
                  onClick={() => onToggleGap(i)}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-left"
                >
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    gap.urgent ? "bg-red-100 text-red-600" : "bg-gray-100 text-gray-500"
                  }`}>
                    {gap.urgent ? "⚠ 硬性" : "建议"}
                  </span>
                  <span className="text-xs text-gray-700 flex-1 leading-snug">{gap.description}</span>
                  {expandedGaps.has(i) ? <ChevronUp size={14} className="text-gray-400 shrink-0" /> : <ChevronDown size={14} className="text-gray-400 shrink-0" />}
                </button>
                {expandedGaps.has(i) && (
                  <div className="px-3 pb-3 border-t border-gray-100 pt-2">
                    <p className="text-xs text-gray-500 leading-relaxed">{gap.suggestion}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 认定硬性条件参考 */}
      <div className="bg-white rounded-xl p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3 flex items-center gap-1.5">
          <Shield size={12} />
          高新企业认定硬性要求参考
        </h3>
        <div className="space-y-1.5">
          {[
            "企业成立满 1 年",
            "知识产权：≥1 项发明专利，或≥5 项实用新型/软著",
            "研发人员占比 ≥ 10%",
            "研发费用占收入比 ≥ 5%（小企业）或 ≥ 3%（中大企业）",
            "高新技术产品/服务收入占比 ≥ 60%",
            "主营业务符合国家八大高新技术领域",
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-gray-500">
              <span className="text-blue-400 shrink-0 mt-0.5">·</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

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
                  {r.visitMethod === "in_person" ? "🏢" : r.visitMethod === "phone" ? "📞" : "💻"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-medium text-gray-700">
                    {r.visitedAt.slice(0, 10)}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {METHOD_LABELS[r.visitMethod]}
                  </span>
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
              <div className="px-4 pb-4 border-t border-gray-100 pt-3 space-y-2">
                {r.willingnessNotes && (
                  <div>
                    <span className="text-[10px] text-gray-400">意愿备注：</span>
                    <p className="text-xs text-gray-700 mt-0.5">{r.willingnessNotes}</p>
                  </div>
                )}
                {r.fieldVerified.mainProductDesc && (
                  <div>
                    <span className="text-[10px] text-gray-400">主营业务：</span>
                    <p className="text-xs text-gray-700 mt-0.5">{r.fieldVerified.mainProductDesc}</p>
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
                {r.nextSteps.length > 0 && (
                  <div>
                    <span className="text-[10px] text-gray-400">后续行动：</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {r.nextSteps.map((s, i) => (
                        <span key={i} className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded">{s}</span>
                      ))}
                    </div>
                  </div>
                )}
                {r.notes && (
                  <div>
                    <span className="text-[10px] text-gray-400">内部备注：</span>
                    <p className="text-xs text-gray-600 mt-0.5">{r.notes}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
