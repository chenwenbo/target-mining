"use client";
import { useEffect, useState } from "react";
import { X, Building2, ExternalLink } from "lucide-react";
import Link from "next/link";
import type { Task, VisitRecord, Company } from "@/lib/types";
import { cn } from "@/lib/cn";
import {
  WILLINGNESS_META,
  METHOD_MAP,
  REVENUE_MAP,
  RD_RATIO_MAP,
  RD_SOURCE_MAP,
  bool3Map,
  LIFECYCLE_META,
  type LifecycleStage,
} from "./lifecycle";

type Props = {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  company?: Company;
  records: VisitRecord[];
  stage?: Exclude<LifecycleStage, "pool">;
};

export default function TaskDetailDrawer({ open, onClose, task, company, records, stage }: Props) {
  // 多记录时的索引（0 = 最新）
  const [idx, setIdx] = useState(0);
  const sorted = [...records].sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1));
  const record = sorted[idx];

  useEffect(() => {
    setIdx(0);
  }, [task?.id]);

  // ESC 关闭
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !task) return null;

  const stageMeta = stage ? LIFECYCLE_META[stage] : null;

  return (
    <>
      {/* 遮罩 */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-40 transition-opacity"
      />
      {/* 抽屉 */}
      <aside className="fixed right-0 top-0 h-full w-[480px] bg-white border-l border-[#e5e7eb] shadow-2xl z-50 flex flex-col">
        {/* 头部 */}
        <div className="px-5 py-4 border-b border-[#e5e7eb] flex items-start justify-between gap-3 shrink-0">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Building2 size={16} className="text-[#94a3b8] shrink-0" />
              <h2 className="text-base font-semibold text-[#0f172a] truncate" title={task.companyName}>
                {task.companyName}
              </h2>
            </div>
            {stageMeta && (
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 text-[11px] font-medium px-2 py-0.5 rounded-full",
                    stageMeta.bg,
                    stageMeta.text,
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", stageMeta.dot)} />
                  {stageMeta.label}
                </span>
                <Link
                  href={`/targets/${task.companyId}`}
                  className="text-[11px] text-blue-600 hover:underline inline-flex items-center gap-0.5"
                >
                  查看企业档案 <ExternalLink size={10} />
                </Link>
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1 -mr-1 text-[#94a3b8] hover:text-[#0f172a] transition-colors"
            aria-label="关闭"
          >
            <X size={18} />
          </button>
        </div>

        {/* 内容滚动区 */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-[#f7f8fa]">
          {/* 1. 基本信息 */}
          <Section title="基本信息">
            <Row label="统一社会信用代码" value={company?.creditCode ?? "-"} />
            <Row label="所在街道" value={task.street} />
            <Row label="行业" value={company?.industry ?? "-"} />
            <Row label="经办人" value={task.assignee} />
            <Row label="派发时间" value={task.createdAt} />
            <Row label="截止时间" value={task.deadline} />
            {task.notes && <Row label="派发备注" value={task.notes} />}
          </Section>

          {/* 多记录切换 */}
          {sorted.length > 1 && (
            <div className="bg-white rounded-xl px-4 py-3 flex items-center gap-2">
              <span className="text-xs text-[#94a3b8] shrink-0">走访记录</span>
              <div className="flex flex-wrap gap-1.5">
                {sorted.map((r, i) => (
                  <button
                    key={r.id}
                    onClick={() => setIdx(i)}
                    className={cn(
                      "text-[11px] px-2 py-1 rounded-md border transition-colors",
                      i === idx
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-[#475569] border-[#e5e7eb] hover:border-[#cbd5e1]",
                    )}
                  >
                    第 {sorted.length - i} 次 · {r.visitedAt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {!record ? (
            <EmptyState />
          ) : (
            <>
              {/* 2. 走访基本信息 */}
              <Section title="走访基本信息">
                <Row
                  label="走访方式"
                  value={METHOD_MAP[record.visitMethod] ?? record.visitMethod}
                />
                <Row label="走访日期" value={record.visitedAt} />
                {record.visitDurationMinutes != null && (
                  <Row label="走访时长" value={`${record.visitDurationMinutes} 分钟`} />
                )}
                <Row
                  label="联系人"
                  value={
                    record.contactReached
                      ? `${task.companyName}（登记联系人）`
                      : `${record.actualContactName ?? "-"}${record.actualContactTitle ? " · " + record.actualContactTitle : ""}`
                  }
                />
                {!record.contactReached && record.actualContactPhone && (
                  <Row label="联系电话" value={record.actualContactPhone} />
                )}
                <Row label="走访人员" value={record.visitorName} />
              </Section>

              {/* 3. 实地核实 */}
              <Section title="企业实际情况（实地核实）">
                {record.fieldVerified.employeeCount != null && (
                  <Row label="实际员工数" value={`${record.fieldVerified.employeeCount} 人`} />
                )}
                {record.fieldVerified.rdEmployeeCount != null && (
                  <Row label="研发人员数" value={`${record.fieldVerified.rdEmployeeCount} 人`} />
                )}
                {record.fieldVerified.annualRevenue && (
                  <Row label="年营收规模" value={REVENUE_MAP[record.fieldVerified.annualRevenue]} />
                )}
                {record.fieldVerified.rdExpenseRatio && (
                  <Row label="研发费用占比" value={RD_RATIO_MAP[record.fieldVerified.rdExpenseRatio]} />
                )}
                {record.fieldVerified.rdExpenseSource && (
                  <Row label="研发费用来源" value={RD_SOURCE_MAP[record.fieldVerified.rdExpenseSource]} />
                )}
                {record.fieldVerified.hasTechDept != null && (
                  <Row label="独立研发部门" value={bool3Map(record.fieldVerified.hasTechDept)} />
                )}
                {record.fieldVerified.hasAccountingFirm != null && (
                  <Row label="委托会计师事务所" value={bool3Map(record.fieldVerified.hasAccountingFirm)} />
                )}
                {record.fieldVerified.mainProductDesc && (
                  <Row label="主营业务" value={record.fieldVerified.mainProductDesc} />
                )}
              </Section>

              {/* 4. 申报意愿 */}
              <Section title="申报意愿">
                <div className="flex items-center justify-between py-1">
                  <span className="text-xs text-[#94a3b8]">意愿等级</span>
                  <span
                    className={cn(
                      "text-xs font-semibold px-2.5 py-1 rounded-full border",
                      WILLINGNESS_META[record.willingness].badge,
                    )}
                  >
                    {WILLINGNESS_META[record.willingness].label}
                  </span>
                </div>
                {record.willingnessNotes && <Row label="意愿备注" value={record.willingnessNotes} />}
                {record.acknowledgedGaps.length > 0 && (
                  <div className="py-1">
                    <span className="text-xs text-[#94a3b8] block mb-1.5">认可的障碍</span>
                    <div className="flex flex-wrap gap-1">
                      {record.acknowledgedGaps.map((g) => (
                        <span
                          key={g}
                          className="text-[10px] bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded"
                        >
                          {g}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {record.keyObstacles && <Row label="主要障碍" value={record.keyObstacles} />}
              </Section>

              {/* 5. 后续动作 */}
              <Section title="后续动作">
                {record.nextSteps.length > 0 && (
                  <div className="py-1">
                    <span className="text-xs text-[#94a3b8] block mb-1.5">后续行动</span>
                    <div className="flex flex-wrap gap-1">
                      {record.nextSteps.map((s) => (
                        <span
                          key={s}
                          className="text-[10px] bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {record.followUpDate && <Row label="约定下次联系" value={record.followUpDate} />}
                {record.companyCommitments && <Row label="企业承诺" value={record.companyCommitments} />}
                {record.notes && (
                  <div className="py-1 bg-[#f7f8fa] rounded-lg px-3 mt-2">
                    <span className="text-[10px] text-[#94a3b8] block mb-0.5">内部备注（不对外）</span>
                    <p className="text-xs text-[#475569] leading-relaxed">{record.notes}</p>
                  </div>
                )}
                <div className="text-[10px] text-[#94a3b8] mt-2 pt-2 border-t border-[#f1f5f9]">
                  提交时间：{new Date(record.submittedAt).toLocaleString("zh-CN")}
                </div>
              </Section>
            </>
          )}
        </div>
      </aside>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl px-4 py-3.5">
      <h3 className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide mb-2.5">
        {title}
      </h3>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 py-1">
      <span className="text-xs text-[#94a3b8] shrink-0">{label}</span>
      <span className="text-xs text-[#0f172a] text-right font-medium leading-snug break-all">
        {value}
      </span>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white rounded-xl px-6 py-10 text-center">
      <div className="text-sm font-medium text-[#475569] mb-1">尚未完成摸排</div>
      <div className="text-xs text-[#94a3b8] leading-relaxed">
        街道经办人完成走访摸排后，<br />
        摸排结果将在此处展示。
      </div>
    </div>
  );
}
