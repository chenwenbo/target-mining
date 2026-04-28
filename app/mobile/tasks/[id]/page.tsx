"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getAllTasks, getCompanyById, getIPItems } from "@/lib/mock-data";
import {
  getCurrentVisitor,
  getVisitRecordsByTask,
  getTaskStatusOverrides,
} from "@/lib/mobile-mock";
import type { TaskStatus, Company, VisitRecord, IPItem, IPType } from "@/lib/types";
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
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");

  useEffect(() => {
    if (!getCurrentVisitor()) router.replace("/mobile/login");
  }, [router]);

  const overrides = getTaskStatusOverrides();
  const task = getAllTasks().find((t) => t.id === id);
  if (!task) return <div className="p-6 text-gray-400 text-sm">任务不存在</div>;

  const status = (overrides[id] ?? task.status) as TaskStatus;
  const company = getCompanyById(task.companyId);
  if (!company) return <div className="p-6 text-gray-400 text-sm">企业数据不存在</div>;
  const records = getVisitRecordsByTask(id).sort((a, b) =>
    b.submittedAt.localeCompare(a.submittedAt)
  );

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
          {(["overview", "history"] as const).map((tab) => {
            const labels = { overview: "企业概况", history: `走访历史(${records.length})` };
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
      {/* 遮罩 */}
      <div
        className="fixed inset-0 bg-black/40 z-40"
        onClick={onClose}
      />
      {/* 抽屉 */}
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
                <div className="flex items-center gap-3 mt-2 pl-0">
                  <span className="text-[10px] text-gray-400">{item.number}</span>
                  <span className="text-[10px] text-gray-300">·</span>
                  <span className="text-[10px] text-gray-400">{item.date}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* safe area padding */}
        <div className="h-safe-bottom shrink-0" style={{ height: "env(safe-area-inset-bottom, 8px)" }} />
      </div>
    </>
  );
}

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
                  count > 0
                    ? "active:bg-blue-50 cursor-pointer"
                    : "cursor-default"
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
