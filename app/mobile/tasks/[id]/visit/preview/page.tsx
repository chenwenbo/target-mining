"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAllTasks } from "@/lib/mock-data";
import { saveVisitRecord, setTaskStatus, getDispatchedTasks, getCustomTasks } from "@/lib/mobile-mock";
import type { VisitRecord } from "@/lib/types";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import {
  WILLINGNESS_META,
  METHOD_MAP,
  REVENUE_MAP,
  RD_RATIO_MAP,
  RD_SOURCE_MAP,
  bool3Map,
  LG_REVENUE_MAP,
  LG_GROWTH_MAP,
  LG_MAINBIZ_RATIO_MAP,
  LG_DEBT_MAP,
  LG_YEARS_MAP,
  LG_RD_RATIO_MAP,
  LG_RD_STAFF_MAP,
  LG_STANDARDS_MAP,
  LG_MARKET_SHARE_MAP,
} from "@/app/(main)/tasks/lifecycle";

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
  const task = [...getAllTasks(), ...getDispatchedTasks(), ...getCustomTasks()].find((t) => t.id === id);
  if (!task) return null;

  const isLittleGiant = task.qualType === "little_giant";
  const w = WILLINGNESS_META[form.willingness as keyof typeof WILLINGNESS_META] ?? { label: "未填写", badge: "text-gray-400 bg-gray-50" };
  const lg = form as Record<string, unknown>;
  const s = (k: string) => (lg[k] as string) || undefined;

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
      // 小巨人走访不填高企口径字段，fieldVerified 留空
      fieldVerified: isLittleGiant ? {} : {
        employeeCount:    form.employeeCount   ? Number(form.employeeCount)   : undefined,
        rdEmployeeCount:  form.rdEmployeeCount ? Number(form.rdEmployeeCount) : undefined,
        annualRevenue:    ((form.annualRevenue  as string) || undefined) as VisitRecord["fieldVerified"]["annualRevenue"],
        rdExpenseRatio:   ((form.rdExpenseRatio as string) || undefined) as VisitRecord["fieldVerified"]["rdExpenseRatio"],
        rdExpenseSource:  ((form.rdExpenseSource as string) || undefined) as VisitRecord["fieldVerified"]["rdExpenseSource"],
        hasAccountingFirm: form.hasAccountingFirm ? (form.hasAccountingFirm as string) === "true" : null,
        hasTechDept:       form.hasTechDept       ? (form.hasTechDept as string) === "true"       : null,
        mainProductDesc:   (form.mainProductDesc as string) || undefined,
      },
      littleGiant: isLittleGiant ? {
        industrialBaseCategory: s("lgIndustrialBaseCategory"),
        industrialBaseItem:     s("lgIndustrialBaseItem"),
        mainProductDesc:        s("lgMainProductDesc"),
        annualRevenueBand:      s("lgAnnualRevenueBand") as NonNullable<VisitRecord["littleGiant"]>["annualRevenueBand"],
        mainBizGrowth2y:        s("lgMainBizGrowth2y") as NonNullable<VisitRecord["littleGiant"]>["mainBizGrowth2y"],
        mainBizRevenueRatio:    s("lgMainBizRevenueRatio") as NonNullable<VisitRecord["littleGiant"]>["mainBizRevenueRatio"],
        debtRatio:              s("lgDebtRatio") as NonNullable<VisitRecord["littleGiant"]>["debtRatio"],
        subdivisionYears:       s("lgSubdivisionYears") as NonNullable<VisitRecord["littleGiant"]>["subdivisionYears"],
        rdExpenseRatio:         s("lgRdExpenseRatio") as NonNullable<VisitRecord["littleGiant"]>["rdExpenseRatio"],
        rdStaffRatio:           s("lgRdStaffRatio") as NonNullable<VisitRecord["littleGiant"]>["rdStaffRatio"],
        hasProvincialRdInstitution: lg.lgHasProvincialRdInstitution ? (lg.lgHasProvincialRdInstitution as string) === "true" : null,
        standardsRole:          s("lgStandardsRole") as NonNullable<VisitRecord["littleGiant"]>["standardsRole"],
        marketShare:            s("lgMarketShare") as NonNullable<VisitRecord["littleGiant"]>["marketShare"],
        fillsGapOrImportSub:    lg.lgFillsGapOrImportSub ? (lg.lgFillsGapOrImportSub as string) === "true" : null,
        supplyChainRole:        s("lgSupplyChainRole"),
        hasOwnBrand:            lg.lgHasOwnBrand ? (lg.lgHasOwnBrand as string) === "true" : null,
        bottleneckTraits:       (lg.lgBottleneckTraits as string[]) ?? [],
        expectedDeclareYear:    s("lgExpectedDeclareYear"),
      } : undefined,
      acknowledgedGaps: (form.acknowledgedGaps as string[]) ?? [],
      keyObstacles:     (form.keyObstacles as string) || undefined,
      followUpDate:     (form.followUpDate as string) || undefined,
      companyCommitments:(form.companyCommitments as string) || undefined,
      nextSteps:        (form.nextSteps as string[]) ?? [],
      notes:            (form.notes as string) || undefined,
      submittedAt: new Date().toISOString(),
    };

    saveVisitRecord(record);
    setTaskStatus(id, "done");
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

        {/* 企业情况（高企口径）*/}
        {!isLittleGiant && (
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
        )}

        {/* 小巨人：定位与经济效益 */}
        {isLittleGiant && (
          <PreviewSection title="定位与经济效益">
            {!!s("lgIndustrialBaseCategory") && (
              <Row label="所属领域" value={`${s("lgIndustrialBaseCategory")}${s("lgIndustrialBaseItem") ? " · " + s("lgIndustrialBaseItem") : ""}`} />
            )}
            {!!s("lgMainProductDesc") && <Row label="主导产品" value={String(s("lgMainProductDesc"))} />}
            {!!s("lgAnnualRevenueBand") && <Row label="上年度营收" value={LG_REVENUE_MAP[String(s("lgAnnualRevenueBand"))] ?? "-"} />}
            {!!s("lgMainBizGrowth2y") && <Row label="近2年主营增长率" value={LG_GROWTH_MAP[String(s("lgMainBizGrowth2y"))] ?? "-"} />}
            {!!s("lgMainBizRevenueRatio") && <Row label="主营收入占比" value={LG_MAINBIZ_RATIO_MAP[String(s("lgMainBizRevenueRatio"))] ?? "-"} />}
            {!!s("lgDebtRatio") && <Row label="资产负债率" value={LG_DEBT_MAP[String(s("lgDebtRatio"))] ?? "-"} />}
            {!!s("lgSubdivisionYears") && <Row label="细分市场年限" value={LG_YEARS_MAP[String(s("lgSubdivisionYears"))] ?? "-"} />}
          </PreviewSection>
        )}

        {/* 小巨人：创新与产业链 */}
        {isLittleGiant && (
          <PreviewSection title="创新与产业链">
            {!!s("lgRdExpenseRatio") && <Row label="研发费用占比" value={LG_RD_RATIO_MAP[String(s("lgRdExpenseRatio"))] ?? "-"} />}
            {!!s("lgRdStaffRatio") && <Row label="研发人员占比" value={LG_RD_STAFF_MAP[String(s("lgRdStaffRatio"))] ?? "-"} />}
            {!!lg.lgHasProvincialRdInstitution && <Row label="省级及以上研发机构" value={bool3Map(String(lg.lgHasProvincialRdInstitution))} />}
            {!!s("lgStandardsRole") && <Row label="标准制定" value={LG_STANDARDS_MAP[String(s("lgStandardsRole"))] ?? "-"} />}
            {!!s("lgMarketShare") && <Row label="市场占有率" value={LG_MARKET_SHARE_MAP[String(s("lgMarketShare"))] ?? "-"} />}
            {!!lg.lgFillsGapOrImportSub && <Row label="填补空白/进口替代" value={bool3Map(String(lg.lgFillsGapOrImportSub))} />}
            {!!lg.lgHasOwnBrand && <Row label="自主品牌" value={bool3Map(String(lg.lgHasOwnBrand))} />}
            {!!s("lgSupplyChainRole") && <Row label="产业链地位" value={String(s("lgSupplyChainRole"))} />}
            {(lg.lgBottleneckTraits as string[] ?? []).length > 0 && (
              <div className="py-1">
                <span className="text-xs text-gray-500 block mb-1.5">卡脖子/补短板</span>
                <div className="flex flex-wrap gap-1">
                  {(lg.lgBottleneckTraits as string[]).map((t) => (
                    <span key={t} className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded">{t}</span>
                  ))}
                </div>
              </div>
            )}
          </PreviewSection>
        )}

        {/* 申报意愿 */}
        <PreviewSection title="申报意愿与后续">
          <div className="flex items-center justify-between py-1">
            <span className="text-xs text-gray-500">申报意愿</span>
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${w.badge}`}>{w.label}</span>
          </div>
          {isLittleGiant && !!s("lgExpectedDeclareYear") && (
            <Row label="预计可申报年度" value={s("lgExpectedDeclareYear") === "uncertain" ? "暂不明确" : `${s("lgExpectedDeclareYear")}年`} />
          )}
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
              <span className="text-xs text-gray-500 block mb-1.5">企业需求</span>
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
          提交后将同步更新任务状态为「摸排完成」
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
