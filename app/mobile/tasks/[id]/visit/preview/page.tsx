"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAllTasks } from "@/lib/mock-data";
import { saveVisitRecord, setTaskStatus } from "@/lib/mobile-mock";
import type { VisitRecord } from "@/lib/types";
import { ArrowLeft, CheckCircle2 } from "lucide-react";

const WILLINGNESS_MAP: Record<string, { label: string; color: string }> = {
  strong:      { label: "意愿强烈",   color: "text-emerald-600 bg-emerald-50" },
  moderate:    { label: "有一定意愿", color: "text-blue-600 bg-blue-50" },
  hesitant:    { label: "态度观望",   color: "text-amber-600 bg-amber-50" },
  refused:     { label: "明确拒绝",   color: "text-red-600 bg-red-50" },
  unreachable: { label: "无法联系",   color: "text-gray-500 bg-gray-100" },
};

const METHOD_MAP: Record<string, string> = {
  in_person: "🏢 上门拜访", phone: "📞 电话沟通", online_meeting: "💻 视频会议",
};

const REVENUE_MAP: Record<string, string> = {
  under_500w: "500万以下", "500w_2000w": "500-2000万", "2000w_1yi": "2000万-1亿", above_1yi: "1亿以上",
};
const RD_RATIO_MAP: Record<string, string> = {
  under_3pct: "<3%", "3_5pct": "3-5%", "5_10pct": "5-10%", above_10pct: ">10%",
};
const RD_SOURCE_MAP: Record<string, string> = {
  self_invested: "企业自投", government_grant: "政府补贴", both: "两者均有", none: "几乎无研发投入",
};

function bool3Map(v: string): string {
  return v === "true" ? "是" : v === "false" ? "否" : "不清楚";
}

export default function VisitPreviewPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<{ form: Record<string, unknown>; visitorId: string; visitorName: string } | null>(null);

  useEffect(() => {
    const raw = sessionStorage.getItem(`visit_form_${id}`);
    if (!raw) { router.replace(`/mobile/tasks/${id}/visit`); return; }
    setData(JSON.parse(raw));
  }, [id, router]);

  if (!data) return null;
  const { form, visitorName, visitorId } = data;
  const task = getAllTasks().find((t) => t.id === id);
  if (!task) return null;

  const w = WILLINGNESS_MAP[form.willingness as string] ?? { label: "未填写", color: "text-gray-400 bg-gray-50" };

  function handleSubmit() {
    const record: VisitRecord = {
      id: `vr_${Date.now()}`,
      taskId: id,
      companyId: task!.companyId,
      visitorId,
      visitorName,
      visitMethod: (form.visitMethod as string) as VisitRecord["visitMethod"],
      visitedAt: form.visitedAt as string,
      visitDurationMinutes: form.visitDurationMinutes ? Number(form.visitDurationMinutes) : undefined,
      contactReached: form.contactReached as boolean,
      actualContactName: (form.actualContactName as string) || undefined,
      actualContactTitle: (form.actualContactTitle as string) || undefined,
      actualContactPhone: (form.actualContactPhone as string) || undefined,
      willingness: form.willingness as VisitRecord["willingness"],
      willingnessNotes: (form.willingnessNotes as string) || undefined,
      fieldVerified: {
        employeeCount:    form.employeeCount   ? Number(form.employeeCount)   : undefined,
        rdEmployeeCount:  form.rdEmployeeCount ? Number(form.rdEmployeeCount) : undefined,
        annualRevenue:    ((form.annualRevenue  as string) || undefined) as VisitRecord["fieldVerified"]["annualRevenue"],
        rdExpenseRatio:   ((form.rdExpenseRatio as string) || undefined) as VisitRecord["fieldVerified"]["rdExpenseRatio"],
        rdExpenseSource:  ((form.rdExpenseSource as string) || undefined) as VisitRecord["fieldVerified"]["rdExpenseSource"],
        hasAccountingFirm: form.hasAccountingFirm ? (form.hasAccountingFirm as string) === "true" : null,
        hasTechDept:       form.hasTechDept       ? (form.hasTechDept as string) === "true"       : null,
        mainProductDesc:   (form.mainProductDesc as string) || undefined,
      },
      acknowledgedGaps: (form.acknowledgedGaps as string[]) ?? [],
      keyObstacles:     (form.keyObstacles as string) || undefined,
      followUpDate:     (form.followUpDate as string) || undefined,
      companyCommitments:(form.companyCommitments as string) || undefined,
      nextSteps:        (form.nextSteps as string[]) ?? [],
      notes:            (form.notes as string) || undefined,
      submittedAt: new Date().toISOString(),
    };

    saveVisitRecord(record);
    setTaskStatus(id, "in_progress");
    sessionStorage.removeItem(`visit_form_${id}`);
    router.replace(`/mobile/tasks/${id}/visit/success`);
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
        <button onClick={() => router.back()} className="p-1 -ml-1 text-gray-500">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-semibold text-gray-800 text-sm">提交前预览</h1>
          <p className="text-xs text-gray-400">{task.companyName}</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* 走访基本信息 */}
        <PreviewSection title="走访基本信息">
          <Row label="走访方式" value={METHOD_MAP[String(form.visitMethod)] ?? "-"} />
          <Row label="走访日期" value={String(form.visitedAt)} />
          {!!form.visitDurationMinutes && <Row label="走访时长" value={`${String(form.visitDurationMinutes)} 分钟`} />}
          <Row
            label="联系人"
            value={form.contactReached
              ? `${task.companyName}（登记联系人）`
              : `${String(form.actualContactName)}${form.actualContactTitle ? " · " + String(form.actualContactTitle) : ""}`}
          />
          {!form.contactReached && !!form.actualContactPhone && (
            <Row label="联系电话" value={String(form.actualContactPhone)} />
          )}
        </PreviewSection>

        {/* 企业情况 */}
        <PreviewSection title="企业实际情况">
          {!!form.employeeCount   && <Row label="实际员工数"   value={`${String(form.employeeCount)} 人`} />}
          {!!form.rdEmployeeCount && <Row label="研发人员数"   value={`${String(form.rdEmployeeCount)} 人`} />}
          {!!form.annualRevenue   && <Row label="年营收规模"   value={REVENUE_MAP[String(form.annualRevenue)] ?? "-"} />}
          {!!form.rdExpenseRatio  && <Row label="研发费用占比" value={RD_RATIO_MAP[String(form.rdExpenseRatio)] ?? "-"} />}
          {!!form.rdExpenseSource && <Row label="研发费用来源" value={RD_SOURCE_MAP[String(form.rdExpenseSource)] ?? "-"} />}
          {!!form.hasTechDept     && <Row label="独立研发部门" value={bool3Map(String(form.hasTechDept))} />}
          {!!form.hasAccountingFirm && <Row label="委托会计师事务所" value={bool3Map(String(form.hasAccountingFirm))} />}
          {!!form.mainProductDesc && <Row label="主营业务" value={String(form.mainProductDesc)} />}
        </PreviewSection>

        {/* 申报意愿 */}
        <PreviewSection title="申报意愿与后续">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-500">申报意愿</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${w.color}`}>{w.label}</span>
          </div>
          {!!form.willingnessNotes && <Row label="意愿备注" value={String(form.willingnessNotes)} />}
          {(form.acknowledgedGaps as string[]).length > 0 && (
            <div className="py-1">
              <span className="text-xs text-gray-500 block mb-1.5">认可的障碍</span>
              <div className="flex flex-wrap gap-1">
                {(form.acknowledgedGaps as string[]).map((g) => (
                  <span key={g} className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded">{g}</span>
                ))}
              </div>
            </div>
          )}
          {(form.nextSteps as string[]).length > 0 && (
            <div className="py-1">
              <span className="text-xs text-gray-500 block mb-1.5">后续行动</span>
              <div className="flex flex-wrap gap-1">
                {(form.nextSteps as string[]).map((s) => (
                  <span key={s} className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{s}</span>
                ))}
              </div>
            </div>
          )}
          {!!form.followUpDate     && <Row label="约定下次联系" value={String(form.followUpDate)} />}
          {!!form.companyCommitments && <Row label="企业承诺"    value={String(form.companyCommitments)} />}
          {!!form.notes            && (
            <div className="py-1 bg-gray-50 rounded-lg px-3 -mx-1">
              <span className="text-[10px] text-gray-400 block mb-0.5">内部备注（不对外）</span>
              <p className="text-xs text-gray-600">{String(form.notes)}</p>
            </div>
          )}
        </PreviewSection>

        <p className="text-center text-xs text-gray-400 pb-2">
          提交后将同步更新任务状态为「进行中」
        </p>
      </div>

      {/* 底部操作 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3 flex gap-3">
        <button
          onClick={() => router.back()}
          className="flex-1 border border-gray-200 text-gray-600 font-medium text-sm py-3 rounded-xl"
        >
          修改
        </button>
        <button
          onClick={handleSubmit}
          className="flex-[2] bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl flex items-center justify-center gap-1.5 active:scale-[0.98] transition-transform"
        >
          <CheckCircle2 size={16} />
          确认提交
        </button>
      </div>
    </div>
  );
}

function PreviewSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl p-4">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{title}</h3>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-start gap-3 py-0.5">
      <span className="text-xs text-gray-400 shrink-0">{label}</span>
      <span className="text-xs text-gray-700 text-right font-medium leading-snug">{value}</span>
    </div>
  );
}
