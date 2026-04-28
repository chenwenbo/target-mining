"use client";

import { useEffect, useState } from "react";
import {
  Phone,
  Video,
  User,
  Calendar,
  Clock,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Building2,
} from "lucide-react";
import { getVisitRecords, initSeedVisitRecords } from "@/lib/mobile-mock";
import type { VisitRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

// ─── Label maps ──────────────────────────────────────────────────

const WILLINGNESS_CONFIG: Record<string, { label: string; cls: string }> = {
  strong:      { label: "强烈意愿", cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  moderate:    { label: "有一定意愿", cls: "bg-teal-50 text-teal-700 border-teal-200" },
  hesitant:    { label: "犹豫观望", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  refused:     { label: "明确拒绝", cls: "bg-red-50 text-red-600 border-red-200" },
  unreachable: { label: "联系不上", cls: "bg-[#f1f5f9] text-[#94a3b8] border-[#e5e7eb]" },
};

const REVENUE_LABELS: Record<string, string> = {
  under_500w: "500万以下",
  "500w_2000w": "500万-2000万",
  "2000w_1yi": "2000万-1亿",
  above_1yi: "1亿以上",
};

const RD_RATIO_LABELS: Record<string, string> = {
  under_3pct: "3%以下",
  "3_5pct": "3%-5%",
  "5_10pct": "5%-10%",
  above_10pct: "10%以上",
};

const RD_SOURCE_LABELS: Record<string, string> = {
  self_invested: "自投",
  government_grant: "政府资助",
  both: "自投+政府资助",
  none: "无",
};

// ─── Single record card ──────────────────────────────────────────

function RecordCard({ record }: { record: VisitRecord }) {
  const [expanded, setExpanded] = useState(false);
  const w = WILLINGNESS_CONFIG[record.willingness] ?? WILLINGNESS_CONFIG.unknown;
  const fv = record.fieldVerified;

  const visitDate = new Date(record.visitedAt).toLocaleDateString("zh-CN", {
    year: "numeric", month: "2-digit", day: "2-digit",
  });
  const visitTime = new Date(record.visitedAt).toLocaleTimeString("zh-CN", {
    hour: "2-digit", minute: "2-digit",
  });

  return (
    <div className="border border-[#e5e7eb] rounded-xl bg-white overflow-hidden">
      {/* Card header */}
      <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-[#f1f5f9]">
        <div className="flex items-center gap-3 min-w-0">
          <div className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0",
            record.visitMethod === "in_person" ? "bg-blue-50" : "bg-violet-50"
          )}>
            {record.visitMethod === "in_person"
              ? <User size={15} className="text-blue-500" />
              : <Video size={15} className="text-violet-500" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-[#0f172a]">{record.visitorName}</span>
              <span className="text-xs text-[#94a3b8]">
                {record.visitMethod === "in_person" ? "上门走访" : "线上沟通"}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-0.5 text-xs text-[#94a3b8]">
              <span className="flex items-center gap-1"><Calendar size={11} />{visitDate} {visitTime}</span>
              {record.visitDurationMinutes && (
                <span className="flex items-center gap-1"><Clock size={11} />{record.visitDurationMinutes}分钟</span>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <span className={cn("inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium border", w.cls)}>
            {w.label}
          </span>
          <button
            onClick={() => setExpanded(!expanded)}
            className="p-1.5 rounded-lg hover:bg-[#f7f8fa] text-[#94a3b8] transition-colors"
          >
            {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>
      </div>

      {/* Contact reached status */}
      <div className="px-5 py-3 flex items-center gap-4 text-xs border-b border-[#f1f5f9]">
        <span className="flex items-center gap-1.5 text-[#475569]">
          {record.contactReached
            ? <CheckCircle2 size={13} className="text-emerald-500" />
            : <XCircle size={13} className="text-red-400" />}
          {record.contactReached ? "已联系到" : "未联系上"}
        </span>
        {record.contactReached && record.actualContactName && (
          <span className="text-[#64748b]">
            <span className="font-medium text-[#0f172a]">{record.actualContactName}</span>
            {record.actualContactTitle && <span className="text-[#94a3b8] ml-1">· {record.actualContactTitle}</span>}
            {record.actualContactPhone && (
              <span className="flex items-center gap-1 inline-flex ml-2 text-[#94a3b8]">
                <Phone size={11} />{record.actualContactPhone}
              </span>
            )}
          </span>
        )}
      </div>

      {/* Willingness notes always visible */}
      {record.willingnessNotes && (
        <div className="px-5 py-3 text-xs text-[#475569] leading-relaxed border-b border-[#f1f5f9] bg-[#fafbfc]">
          <span className="font-medium text-[#64748b] mr-1">意愿备注：</span>{record.willingnessNotes}
        </div>
      )}

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 py-4 space-y-4">
          {/* Field verification */}
          {Object.keys(fv).length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">现场核实情况</h4>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2">
                {fv.employeeCount !== undefined && (
                  <Row label="员工总数" value={`${fv.employeeCount}人`} />
                )}
                {fv.rdEmployeeCount !== undefined && (
                  <Row label="研发人员" value={`${fv.rdEmployeeCount}人`} />
                )}
                {fv.annualRevenue && (
                  <Row label="年收入" value={REVENUE_LABELS[fv.annualRevenue] ?? fv.annualRevenue} />
                )}
                {fv.rdExpenseRatio && (
                  <Row label="研发费用占比" value={RD_RATIO_LABELS[fv.rdExpenseRatio] ?? fv.rdExpenseRatio} />
                )}
                {fv.rdExpenseSource && (
                  <Row label="研发费用来源" value={RD_SOURCE_LABELS[fv.rdExpenseSource] ?? fv.rdExpenseSource} />
                )}
                {fv.hasAccountingFirm !== undefined && fv.hasAccountingFirm !== null && (
                  <Row label="已聘会计师事务所" value={fv.hasAccountingFirm ? "是" : "否"} />
                )}
                {fv.hasTechDept !== undefined && fv.hasTechDept !== null && (
                  <Row label="独立研发部门" value={fv.hasTechDept ? "有" : "无"} />
                )}
                {fv.mainProductDesc && (
                  <div className="col-span-2">
                    <Row label="主要产品/服务" value={fv.mainProductDesc} />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Gaps */}
          {record.acknowledgedGaps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">已识别差距</h4>
              <ul className="space-y-1">
                {record.acknowledgedGaps.map((gap, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-[#475569]">
                    <span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-amber-400 flex-shrink-0" />
                    {gap}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Key obstacles */}
          {record.keyObstacles && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">主要障碍</h4>
              <p className="text-xs text-[#475569] leading-relaxed">{record.keyObstacles}</p>
            </div>
          )}

          {/* Company commitments */}
          {record.companyCommitments && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-1">企业承诺</h4>
              <p className="text-xs text-[#475569] leading-relaxed">{record.companyCommitments}</p>
            </div>
          )}

          {/* Next steps */}
          {record.nextSteps.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-[#64748b] uppercase tracking-wide mb-2">下一步计划</h4>
              <div className="flex flex-wrap gap-1.5">
                {record.nextSteps.map((step, i) => (
                  <span key={i} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full border border-blue-100">
                    {step}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Follow-up date */}
          {record.followUpDate && (
            <div className="flex items-center gap-2 text-xs text-[#64748b]">
              <Calendar size={13} />
              <span>计划跟进日期：<span className="font-medium text-[#0f172a]">{record.followUpDate}</span></span>
            </div>
          )}

          {/* Notes */}
          {record.notes && (
            <div className="text-xs text-[#94a3b8] bg-[#f7f8fa] rounded-lg px-3 py-2.5 leading-relaxed">
              备注：{record.notes}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-[#94a3b8]">{label}</span>
      <span className="text-[#0f172a] font-medium">{value}</span>
    </div>
  );
}

// ─── Main tab ────────────────────────────────────────────────────

export default function TabMoPai({ companyId }: { companyId: string }) {
  const [records, setRecords] = useState<VisitRecord[]>([]);

  useEffect(() => {
    initSeedVisitRecords();
    const all = getVisitRecords();
    setRecords(all.filter((r) => r.companyId === companyId));
  }, [companyId]);

  if (records.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-[#94a3b8]">
        <Building2 size={40} className="mb-3 opacity-30" />
        <p className="text-sm">暂无摸排记录</p>
        <p className="text-xs mt-1">该企业尚未完成走访摸排</p>
      </div>
    );
  }

  // Summary counts
  const latestWillingness = records[records.length - 1]?.willingness;
  const w = WILLINGNESS_CONFIG[latestWillingness] ?? WILLINGNESS_CONFIG.unknown;

  return (
    <div className="space-y-4">
      {/* Summary bar */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-[#475569]">
          共 <span className="font-semibold text-[#0f172a]">{records.length}</span> 条摸排记录
        </span>
        <span className={cn("inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium border", w.cls)}>
          最新意愿：{w.label}
        </span>
      </div>

      {/* Records (newest first) */}
      {[...records].reverse().map((r) => (
        <RecordCard key={r.id} record={r} />
      ))}
    </div>
  );
}
