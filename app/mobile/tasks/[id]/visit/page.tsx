"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { getAllTasks, getCompanyById } from "@/lib/mock-data";
import { getCurrentVisitor, saveDraft, clearDraft, getDispatchedTasks, getCustomTasks } from "@/lib/mobile-mock";
import type { Company, Visitor, VisitMethod, WillingnessLevel } from "@/lib/types";
import { PRIMARY_DOMAINS, DOMAIN_SECONDARIES, type PrimaryDomain } from "@/lib/domain-fields";
import { ArrowLeft, ChevronRight } from "lucide-react";

// ─── 表单数据类型 ───────────────────────────────────────────────
interface FormData {
  // Step 1
  visitMethod: VisitMethod | "";
  visitedAt: string;
  visitDurationMinutes: string;
  contactReached: boolean | null;
  actualContactName: string;
  actualContactTitle: string;
  actualContactPhone: string;
  // Step 2
  employeeCount: string;
  rdEmployeeCount: string;
  annualRevenue: string;
  rdExpenseRatio: string;
  rdExpenseSource: string;
  hasAccountingFirm: string;
  hasTechDept: string;
  mainProductDesc: string;
  // Step 3
  willingness: WillingnessLevel | "";
  willingnessNotes: string;
  acknowledgedGaps: string[];
  keyObstacles: string;
  companyCommitments: string;
  followUpDate: string;
  nextSteps: string[];
  notes: string;
  // ─── 小巨人专属（仅 little_giant 任务使用）────────────────────
  // 定位与经济效益
  lgIndustrialBaseCategory: string;
  lgIndustrialBaseItem: string;
  lgMainProductDesc: string;
  lgAnnualRevenueBand: string;
  lgMainBizGrowth2y: string;
  lgMainBizRevenueRatio: string;
  lgDebtRatio: string;
  lgSubdivisionYears: string;
  // 创新与产业链
  lgRdExpenseRatio: string;
  lgRdStaffRatio: string;
  lgHasProvincialRdInstitution: string;
  lgStandardsRole: string;
  lgMarketShare: string;
  lgFillsGapOrImportSub: string;
  lgSupplyChainRole: string;
  lgHasOwnBrand: string;
  lgBottleneckTraits: string[];
  // 申报意愿与缺口
  lgExpectedDeclareYear: string;
}

const INITIAL_FORM: FormData = {
  visitMethod: "in_person", visitedAt: new Date().toISOString().slice(0, 10),
  visitDurationMinutes: "", contactReached: null,
  actualContactName: "", actualContactTitle: "", actualContactPhone: "",
  employeeCount: "", rdEmployeeCount: "", annualRevenue: "", rdExpenseRatio: "",
  rdExpenseSource: "", hasAccountingFirm: "", hasTechDept: "", mainProductDesc: "",
  willingness: "", willingnessNotes: "", acknowledgedGaps: [], keyObstacles: "",
  companyCommitments: "", followUpDate: "", nextSteps: [], notes: "",
  lgIndustrialBaseCategory: "", lgIndustrialBaseItem: "", lgMainProductDesc: "",
  lgAnnualRevenueBand: "", lgMainBizGrowth2y: "", lgMainBizRevenueRatio: "",
  lgDebtRatio: "", lgSubdivisionYears: "",
  lgRdExpenseRatio: "", lgRdStaffRatio: "", lgHasProvincialRdInstitution: "",
  lgStandardsRole: "", lgMarketShare: "", lgFillsGapOrImportSub: "",
  lgSupplyChainRole: "", lgHasOwnBrand: "", lgBottleneckTraits: [],
  lgExpectedDeclareYear: "",
};

const WILLINGNESS_OPTIONS = [
  { value: "strong",      label: "意愿强烈",   desc: "主动配合，愿意立即准备", color: "border-emerald-400 bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
  { value: "moderate",    label: "有一定意愿", desc: "有兴趣，但仍在考虑",     color: "border-blue-400 bg-blue-50",     text: "text-blue-700",    dot: "bg-blue-500" },
  { value: "hesitant",    label: "态度观望",   desc: "暂不确定，需更多信息",   color: "border-amber-400 bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-500" },
  { value: "refused",     label: "明确拒绝",   desc: "不愿申报",               color: "border-red-400 bg-red-50",       text: "text-red-700",     dot: "bg-red-500" },
  { value: "unreachable", label: "无法联系",   desc: "多次尝试无法联系",       color: "border-gray-300 bg-gray-50",     text: "text-gray-600",    dot: "bg-gray-400" },
];

const GAP_OPTIONS = [
  "无发明专利或专利数量不足", "研发人员占比不达标", "研发费用占比不达标",
  "存在合规/风险记录", "注册资本偏低", "主营业务与高新领域不匹配",
  "不了解高新企业认定政策", "担心申报成本（中介费等）", "正在通过其他渠道申报",
];

const NEXT_STEP_OPTIONS = [
  "高新政策详解与一对一辅导",
  "申报材料清单与流程指导",
  "知识产权培育（专利/软著）",
  "研发费用归集与加计扣除辅导",
  "财务规范化（事务所/审计对接）",
  "科技项目与专项资金申报",
  "高层次人才引进政策对接",
  "产学研合作（高校院所对接）",
  "科技金融（贷款/担保/投融资）",
  "暂无明确需求",
];

// ─── 小巨人专属选项 ──────────────────────────────────────────────
const LG_REVENUE_OPTIONS = [
  { value: "under_1yi", label: "<1亿" },
  { value: "1_4yi", label: "1-4亿" },
  { value: "4_10yi", label: "4-10亿" },
  { value: "above_10yi", label: ">10亿" },
];

const LG_GROWTH_OPTIONS = [
  { value: "neg", label: "负增长" },
  { value: "0_5pct", label: "0-5%" },
  { value: "5_10pct", label: "5-10%" },
  { value: "above_10pct", label: ">10%" },
];

const LG_MAINBIZ_RATIO_OPTIONS = [
  { value: "under_50", label: "<50%" },
  { value: "50_70", label: "50-70%" },
  { value: "70_85", label: "70-85% ✓" },
  { value: "above_85", label: ">85% ✓" },
];

const LG_DEBT_OPTIONS = [
  { value: "under_30", label: "<30%" },
  { value: "30_50", label: "30-50%" },
  { value: "50_70", label: "50-70%" },
  { value: "above_70", label: ">70%" },
];

const LG_YEARS_OPTIONS = [
  { value: "under_3", label: "<3年" },
  { value: "3_5", label: "3-5年 ✓" },
  { value: "5_10", label: "5-10年 ✓" },
  { value: "above_10", label: ">10年 ✓" },
];

const LG_RD_RATIO_OPTIONS = [
  { value: "under_3pct", label: "<3%" },
  { value: "3_6pct", label: "3-6%" },
  { value: "6_10pct", label: "6-10% ✓" },
  { value: "above_10pct", label: ">10% ✓" },
];

const LG_RD_STAFF_OPTIONS = [
  { value: "under_10", label: "<10%" },
  { value: "10_20", label: "10-20%" },
  { value: "20_30", label: "20-30%" },
  { value: "above_30", label: ">30%" },
];

const LG_STANDARDS_OPTIONS = [
  { value: "international", label: "主导/参与国际" },
  { value: "national", label: "国家标准" },
  { value: "industry", label: "行业标准" },
  { value: "none", label: "未参与" },
];

const LG_MARKET_SHARE_OPTIONS = [
  { value: "national_top", label: "全国前列" },
  { value: "provincial_top", label: "全省前列" },
  { value: "regional_lead", label: "区域领先" },
  { value: "unknown", label: "不清楚" },
];

const LG_BOTTLENECK_OPTIONS = [
  "卡脖子技术攻关", "进口替代", "强链补链", "填补国内空白", "单项冠军潜力", "无明显属性",
];

const LG_GAP_OPTIONS = [
  "发明专利不足5件", "研发费用占比不足6%", "营收未达1亿", "细分市场排名未进前3",
  "主营收入占比不足70%", "未持有省级专精特新", "未建省级研发机构",
  "未主导参与标准制定", "存在合规风险",
];

const LG_NEXT_STEP_OPTIONS = [
  "小巨人申报政策辅导",
  "知识产权布局（发明专利）",
  "省级研发机构培育",
  "标准制定参与对接",
  "专精特新梯度培育",
  "产业链强链补链对接",
  "研发费用归集辅导",
  "专项资金奖补申报",
  "暂无明确需求",
];

const LG_DECLARE_YEAR_OPTIONS = [
  { value: "2026", label: "2026年" },
  { value: "2027", label: "2027年" },
  { value: "2028", label: "2028年及以后" },
  { value: "uncertain", label: "暂不明确" },
];

export default function VisitFormPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(INITIAL_FORM);
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [otherGap, setOtherGap] = useState("");
  const [showOtherGap, setShowOtherGap] = useState(false);

  useEffect(() => {
    const v = getCurrentVisitor();
    if (!v) { router.replace("/mobile/login"); return; }
    setVisitor(v);
  }, [router]);

  const task = [...getAllTasks(), ...getDispatchedTasks(), ...getCustomTasks()].find((t) => t.id === id);
  const company = task ? getCompanyById(task.companyId) : undefined;
  if (!task || !company) return null;

  const isLittleGiant = task.qualType === "little_giant";
  const totalSteps = isLittleGiant ? 4 : 3;
  const stepLabels = isLittleGiant
    ? ["走访信息", "定位与效益", "创新与产业链", "意愿与缺口"]
    : ["走访信息", "情况核实", "申报意愿"];

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function toggleArr(key: "acknowledgedGaps" | "nextSteps" | "lgBottleneckTraits", val: string) {
    setForm((prev) => {
      const arr = prev[key] as string[];
      return { ...prev, [key]: arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val] };
    });
  }

  // Step 1 validation
  const step1Valid = form.visitedAt !== "" &&
    form.contactReached !== null &&
    (form.contactReached || (form.actualContactName !== ""));

  // 末步（申报意愿）校验：高企=step3，小巨人=step4
  const lastStepValid = form.willingness !== "";

  const isLast = step === totalSteps;

  function handleSaveDraft() {
    saveDraft(id, form as never);
    router.back();
  }

  function handleNext() {
    if (step < totalSteps) setStep(step + 1);
    else {
      // 跳转预览页，通过 sessionStorage 传递表单数据
      const key = `visit_form_${id}`;
      sessionStorage.setItem(key, JSON.stringify({ form, visitorId: visitor!.id, visitorName: visitor!.name }));
      clearDraft(id);
      router.push(`/mobile/tasks/${id}/visit/preview`);
    }
  }

  const progressPct = (step / totalSteps) * 100;

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-2 mb-3">
          <button onClick={() => step > 1 ? setStep(step - 1) : router.back()} className="p-1 -ml-1 text-gray-500">
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="font-semibold text-gray-800 text-sm truncate">{company.name}</h1>
            <p className="text-xs text-gray-400">走访摸排记录</p>
          </div>
          <button onClick={handleSaveDraft} className="text-xs text-blue-500 font-medium px-2 py-1">
            保存草稿
          </button>
        </div>
        {/* 进度条 */}
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
          <span className="text-xs text-gray-400 shrink-0">{step}/{totalSteps}</span>
        </div>
        <div className="flex justify-between mt-1.5">
          {stepLabels.map((label, i) => (
            <span key={i} className={`text-[10px] font-medium ${step === i + 1 ? "text-blue-600" : step > i + 1 ? "text-emerald-500" : "text-gray-300"}`}>
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* 表单内容 */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        {step === 1 && <Step1 form={form} company={company} update={update} />}
        {!isLittleGiant && step === 2 && <Step2 form={form} company={company} update={update} />}
        {!isLittleGiant && step === 3 && (
          <Step3
            form={form} update={update} toggleArr={toggleArr}
            otherGap={otherGap} setOtherGap={setOtherGap}
            showOtherGap={showOtherGap} setShowOtherGap={setShowOtherGap}
          />
        )}
        {isLittleGiant && step === 2 && <LGStep2 form={form} update={update} />}
        {isLittleGiant && step === 3 && <LGStep3 form={form} update={update} toggleArr={toggleArr} />}
        {isLittleGiant && step === 4 && <LGStep4 form={form} update={update} toggleArr={toggleArr} />}
      </div>

      {/* 底部按钮 */}
      <div className="bg-white border-t border-gray-100 px-4 py-3">
        <button
          onClick={handleNext}
          disabled={step === 1 ? !step1Valid : isLast ? !lastStepValid : false}
          className="w-full bg-blue-600 text-white font-semibold text-sm py-3 rounded-xl disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98] transition-all flex items-center justify-center gap-1"
        >
          {!isLast ? (
            <><span>下一步</span><ChevronRight size={16} /></>
          ) : (
            <span>预览并提交</span>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── 通用子组件 ─────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{children}</h3>;
}

function FormRow({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-400 ml-0.5">*</span>}
        {hint && <span className="text-xs text-gray-400 ml-2 font-normal">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

function RadioGroup({ options, value, onChange }: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
            value === o.value
              ? "bg-blue-600 border-blue-600 text-white"
              : "bg-white border-gray-200 text-gray-600"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ─── Step 1：走访基本信息 ────────────────────────────────────────
function Step1({ form, company, update }: { form: FormData; company: Company; update: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-1">
      <div className="bg-white rounded-xl p-4 mb-4">
        <SectionTitle>走访基本信息</SectionTitle>
        <FormRow label="走访日期" required>
          <input
            type="date"
            value={form.visitedAt}
            onChange={(e) => update("visitedAt", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400"
          />
        </FormRow>
        <FormRow label="走访时长" hint="非必填">
          <div className="flex items-center gap-2">
            <input
              type="number"
              value={form.visitDurationMinutes}
              onChange={(e) => update("visitDurationMinutes", e.target.value)}
              placeholder="30"
              min={5} max={180}
              className="w-24 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-400"
            />
            <span className="text-sm text-gray-400">分钟</span>
          </div>
        </FormRow>
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>联系人确认</SectionTitle>
        {/* 系统登记联系人（只读展示） */}
        <div className="bg-gray-50 rounded-lg p-3 mb-4 flex items-center justify-between">
          <div>
            <div className="text-xs text-gray-400 mb-0.5">系统登记联系人</div>
            <div className="text-sm font-medium text-gray-700">{company.contact.name}</div>
            <div className="text-xs text-gray-500 mt-0.5">{company.contact.phone}</div>
          </div>
          <a href={`tel:${company.contact.phone}`} className="flex items-center gap-1 bg-blue-50 text-blue-600 text-xs px-3 py-1.5 rounded-lg font-medium">
            拨打
          </a>
        </div>

        <FormRow label="是否联系到登记联系人" required>
          <RadioGroup
            value={form.contactReached === null ? "" : form.contactReached ? "yes" : "no"}
            onChange={(v) => update("contactReached", v === "yes")}
            options={[{ value: "yes", label: "是" }, { value: "no", label: "否，实际联系人不同" }]}
          />
        </FormRow>

        {form.contactReached === false && (
          <div className="space-y-3 border-l-2 border-amber-300 pl-3 ml-1">
            <FormRow label="实际联系人姓名" required>
              <input
                value={form.actualContactName}
                onChange={(e) => update("actualContactName", e.target.value)}
                placeholder="请填写实际联系人姓名"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </FormRow>
            <FormRow label="职位" hint="非必填">
              <input
                value={form.actualContactTitle}
                onChange={(e) => update("actualContactTitle", e.target.value)}
                placeholder="如：研发总监、财务经理"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </FormRow>
            <FormRow label="联系电话" hint="非必填">
              <input
                type="tel"
                value={form.actualContactPhone}
                onChange={(e) => update("actualContactPhone", e.target.value)}
                placeholder="手机号"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
              />
            </FormRow>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Step 2：企业情况核实 ────────────────────────────────────────
function Step2({ form, company, update }: { form: FormData; company: Company; update: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4">
        <SectionTitle>企业规模（企业自述）</SectionTitle>
        <FormRow label="实际在职员工数" hint={`系统登记: ${company.employees} 人`}>
          <input
            type="number"
            value={form.employeeCount}
            onChange={(e) => update("employeeCount", e.target.value)}
            placeholder={String(company.employees)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </FormRow>
        <FormRow label="其中研发人员数" hint={`系统登记: ${company.rdEmployees} 人`}>
          <input
            type="number"
            value={form.rdEmployeeCount}
            onChange={(e) => update("rdEmployeeCount", e.target.value)}
            placeholder={String(company.rdEmployees)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </FormRow>
        <FormRow label="年营收规模">
          <RadioGroup
            value={form.annualRevenue}
            onChange={(v) => update("annualRevenue", v)}
            options={[
              { value: "under_500w", label: "<500万" },
              { value: "500w_2000w", label: "500-2000万" },
              { value: "2000w_1yi", label: "2000万-1亿" },
              { value: "above_1yi", label: ">1亿" },
            ]}
          />
        </FormRow>
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>研发投入（企业自述）</SectionTitle>
        <FormRow label="研发费用占比">
          <RadioGroup
            value={form.rdExpenseRatio}
            onChange={(v) => update("rdExpenseRatio", v)}
            options={[
              { value: "under_3pct", label: "<3%" },
              { value: "3_5pct", label: "3-5%" },
              { value: "5_10pct", label: "5-10%" },
              { value: "above_10pct", label: ">10%" },
            ]}
          />
        </FormRow>
        <FormRow label="研发费用来源">
          <RadioGroup
            value={form.rdExpenseSource}
            onChange={(v) => update("rdExpenseSource", v)}
            options={[
              { value: "self_invested", label: "企业自投" },
              { value: "government_grant", label: "政府补贴" },
              { value: "both", label: "两者均有" },
              { value: "none", label: "几乎无研发" },
            ]}
          />
        </FormRow>
        <FormRow label="是否有独立研发部门/团队">
          <RadioGroup
            value={form.hasTechDept}
            onChange={(v) => update("hasTechDept", v)}
            options={[
              { value: "true", label: "有" },
              { value: "false", label: "没有" },
              { value: "unknown", label: "不清楚" },
            ]}
          />
        </FormRow>
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>合规与财务</SectionTitle>
        <FormRow label="是否委托会计师事务所做账">
          <RadioGroup
            value={form.hasAccountingFirm}
            onChange={(v) => update("hasAccountingFirm", v)}
            options={[
              { value: "true", label: "是" },
              { value: "false", label: "否（自行做账）" },
              { value: "unknown", label: "不清楚" },
            ]}
          />
        </FormRow>
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>主营业务</SectionTitle>
        <FormRow label="主要产品/服务描述" hint="有助于判断领域匹配度">
          <textarea
            value={form.mainProductDesc}
            onChange={(e) => update("mainProductDesc", e.target.value)}
            maxLength={200}
            rows={3}
            placeholder="请简述企业主要技术产品或服务，例如：企业信息安全审计软件、智能制造自动化设备等"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
          />
          <div className="text-right text-[10px] text-gray-400 mt-1">{form.mainProductDesc.length}/200</div>
        </FormRow>
      </div>
    </div>
  );
}

// ─── Step 3：申报意愿与后续 ──────────────────────────────────────
function Step3({
  form, update, toggleArr, otherGap, setOtherGap, showOtherGap, setShowOtherGap,
}: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleArr: (key: "acknowledgedGaps" | "nextSteps", val: string) => void;
  otherGap: string;
  setOtherGap: (v: string) => void;
  showOtherGap: boolean;
  setShowOtherGap: (v: boolean) => void;
}) {
  return (
    <div className="space-y-4">
      {/* 申报意愿 */}
      <div className="bg-white rounded-xl p-4">
        <SectionTitle>申报意愿 <span className="text-red-400">*</span></SectionTitle>
        <div className="space-y-2">
          {WILLINGNESS_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => update("willingness", opt.value as WillingnessLevel)}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                form.willingness === opt.value ? opt.color : "border-gray-200 bg-white"
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
                form.willingness === opt.value ? `border-current` : "border-gray-300"
              }`}>
                {form.willingness === opt.value && (
                  <div className={`w-2 h-2 rounded-full ${opt.dot}`} />
                )}
              </div>
              <div className="flex-1">
                <span className={`text-sm font-medium block ${form.willingness === opt.value ? opt.text : "text-gray-700"}`}>
                  {opt.label}
                </span>
                <span className="text-xs text-gray-400">{opt.desc}</span>
              </div>
            </button>
          ))}
        </div>
        <div className="mt-3">
          <label className="block text-xs text-gray-500 mb-1.5">意愿补充说明（可选）</label>
          <textarea
            value={form.willingnessNotes}
            onChange={(e) => update("willingnessNotes", e.target.value)}
            rows={2}
            maxLength={200}
            placeholder="如有特殊顾虑或背景，请记录"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
          />
        </div>
      </div>

      {/* 企业认可的障碍 */}
      <div className="bg-white rounded-xl p-4">
        <SectionTitle>企业认可的主要障碍（多选）</SectionTitle>
        <div className="space-y-2">
          {GAP_OPTIONS.map((gap) => {
            const checked = form.acknowledgedGaps.includes(gap);
            return (
              <button
                key={gap}
                onClick={() => toggleArr("acknowledgedGaps", gap)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all text-sm ${
                  checked ? "border-blue-400 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
                  checked ? "border-blue-500 bg-blue-500" : "border-gray-300"
                }`}>
                  {checked && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                {gap}
              </button>
            );
          })}
          {/* 其他 */}
          <button
            onClick={() => {
              setShowOtherGap(!showOtherGap);
              if (showOtherGap && otherGap) {
                toggleArr("acknowledgedGaps", otherGap);
                setOtherGap("");
              }
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-left transition-all text-sm ${
              showOtherGap ? "border-blue-400 bg-blue-50 text-blue-800" : "border-gray-200 bg-white text-gray-700"
            }`}
          >
            <div className={`w-4 h-4 rounded border-2 shrink-0 flex items-center justify-center ${
              showOtherGap ? "border-blue-500 bg-blue-500" : "border-gray-300"
            }`}>
              {showOtherGap && (
                <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                  <path d="M1 3l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            其他
          </button>
          {showOtherGap && (
            <input
              value={otherGap}
              onChange={(e) => {
                const prev = otherGap;
                const next = e.target.value;
                setOtherGap(next);
                if (prev && form.acknowledgedGaps.includes(prev)) {
                  toggleArr("acknowledgedGaps", prev);
                }
                if (next) toggleArr("acknowledgedGaps", next);
              }}
              placeholder="请描述其他障碍"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          )}
        </div>
      </div>

      {/* 后续跟进 */}
      <div className="bg-white rounded-xl p-4">
        <SectionTitle>后续跟进安排</SectionTitle>
        <FormRow label="企业承诺事项">
          <textarea
            value={form.companyCommitments}
            onChange={(e) => update("companyCommitments", e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="记录企业表示将采取的行动，如：两周内提交研发台账"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
          />
        </FormRow>
        <FormRow label="约定下次联系日期">
          <input
            type="date"
            value={form.followUpDate}
            onChange={(e) => update("followUpDate", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </FormRow>
        <FormRow label="企业需求（多选）">
          <div className="flex flex-wrap gap-2">
            {NEXT_STEP_OPTIONS.map((opt) => {
              const checked = form.nextSteps.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => toggleArr("nextSteps", opt)}
                  className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
                    checked ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-600"
                  }`}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </FormRow>
        <FormRow label="工作人员内部备注">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="内部备注，不对外展示"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:border-blue-400 resize-none"
          />
        </FormRow>
      </div>
    </div>
  );
}

// ─── 小巨人通用子组件 ────────────────────────────────────────────
const BOOL3_OPTIONS = [
  { value: "true", label: "是" },
  { value: "false", label: "否" },
  { value: "unknown", label: "不清楚" },
];

function MultiSelectPills({ options, selected, onToggle }: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const checked = selected.includes(opt);
        return (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${
              checked ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-600"
            }`}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

function WillingnessPicker({ value, notes, update }: {
  value: WillingnessLevel | "";
  notes: string;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
}) {
  return (
    <div className="bg-white rounded-xl p-4">
      <SectionTitle>申报意愿 <span className="text-red-400">*</span></SectionTitle>
      <div className="space-y-2">
        {WILLINGNESS_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => update("willingness", opt.value as WillingnessLevel)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
              value === opt.value ? opt.color : "border-gray-200 bg-white"
            }`}
          >
            <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center ${
              value === opt.value ? "border-current" : "border-gray-300"
            }`}>
              {value === opt.value && <div className={`w-2 h-2 rounded-full ${opt.dot}`} />}
            </div>
            <div className="flex-1">
              <span className={`text-sm font-medium block ${value === opt.value ? opt.text : "text-gray-700"}`}>{opt.label}</span>
              <span className="text-xs text-gray-400">{opt.desc}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="mt-3">
        <label className="block text-xs text-gray-500 mb-1.5">意愿补充说明（可选）</label>
        <textarea
          value={notes}
          onChange={(e) => update("willingnessNotes", e.target.value)}
          rows={2}
          maxLength={200}
          placeholder="如有特殊顾虑或背景，请记录"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
        />
      </div>
    </div>
  );
}

// ─── 小巨人 Step 2：定位与经济效益 ───────────────────────────────
function LGStep2({ form, update }: { form: FormData; update: <K extends keyof FormData>(k: K, v: FormData[K]) => void }) {
  const baseItems: string[] = form.lgIndustrialBaseCategory
    ? [...(DOMAIN_SECONDARIES[form.lgIndustrialBaseCategory as PrimaryDomain] ?? [])]
    : [];
  const isCustomItem = form.lgIndustrialBaseItem !== "" && !baseItems.includes(form.lgIndustrialBaseItem);
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4">
        <SectionTitle>所属产业领域</SectionTitle>
        <FormRow label="所属一级领域" required hint="标的池领域分布图数据来源">
          <RadioGroup
            value={form.lgIndustrialBaseCategory}
            onChange={(v) => {
              update("lgIndustrialBaseCategory", v);
              update("lgIndustrialBaseItem", ""); // 切换一级清空二级
            }}
            options={PRIMARY_DOMAINS.map((c) => ({ value: c, label: c }))}
          />
        </FormRow>
        {form.lgIndustrialBaseCategory && (
          <FormRow label="五基（第二层）">
            <RadioGroup
              value={isCustomItem ? "" : form.lgIndustrialBaseItem}
              onChange={(v) => update("lgIndustrialBaseItem", v)}
              options={baseItems.map((it) => ({ value: it, label: it }))}
            />
            <input
              value={isCustomItem ? form.lgIndustrialBaseItem : ""}
              onChange={(e) => update("lgIndustrialBaseItem", e.target.value)}
              placeholder="其他细分（可手动填写）"
              className="mt-2 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
            />
          </FormRow>
        )}
        <FormRow label="主导产品/主营业务" hint="一句话描述">
          <textarea
            value={form.lgMainProductDesc}
            onChange={(e) => update("lgMainProductDesc", e.target.value)}
            maxLength={200}
            rows={2}
            placeholder="如：精密轴承及配套滚动体，供应国内头部机床厂"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
          />
          <div className="text-right text-[10px] text-gray-400 mt-1">{form.lgMainProductDesc.length}/200</div>
        </FormRow>
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>经济效益指标（硬门槛）</SectionTitle>
        <FormRow label="上年度营业收入">
          <RadioGroup value={form.lgAnnualRevenueBand} onChange={(v) => update("lgAnnualRevenueBand", v)} options={LG_REVENUE_OPTIONS} />
        </FormRow>
        <FormRow label="近2年主营收入平均增长率">
          <RadioGroup value={form.lgMainBizGrowth2y} onChange={(v) => update("lgMainBizGrowth2y", v)} options={LG_GROWTH_OPTIONS} />
        </FormRow>
        <FormRow label="主营业务收入占比" hint="门槛 ≥70%（✓为达标）">
          <RadioGroup value={form.lgMainBizRevenueRatio} onChange={(v) => update("lgMainBizRevenueRatio", v)} options={LG_MAINBIZ_RATIO_OPTIONS} />
        </FormRow>
        <FormRow label="资产负债率">
          <RadioGroup value={form.lgDebtRatio} onChange={(v) => update("lgDebtRatio", v)} options={LG_DEBT_OPTIONS} />
        </FormRow>
        <FormRow label="从事细分市场年限" hint="门槛 ≥3年（✓为达标）">
          <RadioGroup value={form.lgSubdivisionYears} onChange={(v) => update("lgSubdivisionYears", v)} options={LG_YEARS_OPTIONS} />
        </FormRow>
      </div>
    </div>
  );
}

// ─── 小巨人 Step 3：创新与产业链 ─────────────────────────────────
function LGStep3({ form, update, toggleArr }: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleArr: (key: "acknowledgedGaps" | "nextSteps" | "lgBottleneckTraits", val: string) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl p-4">
        <SectionTitle>创新能力指标</SectionTitle>
        <FormRow label="近2年研发费用占营收比重" hint="门槛 ≥6%（✓为达标）">
          <RadioGroup value={form.lgRdExpenseRatio} onChange={(v) => update("lgRdExpenseRatio", v)} options={LG_RD_RATIO_OPTIONS} />
        </FormRow>
        <FormRow label="研发人员占比">
          <RadioGroup value={form.lgRdStaffRatio} onChange={(v) => update("lgRdStaffRatio", v)} options={LG_RD_STAFF_OPTIONS} />
        </FormRow>
        <FormRow label="是否建有省级及以上研发机构">
          <RadioGroup value={form.lgHasProvincialRdInstitution} onChange={(v) => update("lgHasProvincialRdInstitution", v)} options={BOOL3_OPTIONS} />
        </FormRow>
        <FormRow label="主持/参与标准制定">
          <RadioGroup value={form.lgStandardsRole} onChange={(v) => update("lgStandardsRole", v)} options={LG_STANDARDS_OPTIONS} />
        </FormRow>
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>专业化与产业链地位</SectionTitle>
        <FormRow label="主导产品市场占有率">
          <RadioGroup value={form.lgMarketShare} onChange={(v) => update("lgMarketShare", v)} options={LG_MARKET_SHARE_OPTIONS} />
        </FormRow>
        <FormRow label="是否填补国内空白/进口替代">
          <RadioGroup value={form.lgFillsGapOrImportSub} onChange={(v) => update("lgFillsGapOrImportSub", v)} options={BOOL3_OPTIONS} />
        </FormRow>
        <FormRow label="是否拥有自主品牌">
          <RadioGroup value={form.lgHasOwnBrand} onChange={(v) => update("lgHasOwnBrand", v)} options={BOOL3_OPTIONS} />
        </FormRow>
        <FormRow label="产业链地位/配套头部企业" hint="可填写">
          <input
            value={form.lgSupplyChainRole}
            onChange={(e) => update("lgSupplyChainRole", e.target.value)}
            placeholder="如：产业链关键环节，配套某行业头部企业"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </FormRow>
        <FormRow label="卡脖子/补短板属性（多选）">
          <MultiSelectPills
            options={LG_BOTTLENECK_OPTIONS}
            selected={form.lgBottleneckTraits}
            onToggle={(v) => toggleArr("lgBottleneckTraits", v)}
          />
        </FormRow>
      </div>
    </div>
  );
}

// ─── 小巨人 Step 4：申报意愿与缺口 ───────────────────────────────
function LGStep4({ form, update, toggleArr }: {
  form: FormData;
  update: <K extends keyof FormData>(k: K, v: FormData[K]) => void;
  toggleArr: (key: "acknowledgedGaps" | "nextSteps" | "lgBottleneckTraits", val: string) => void;
}) {
  return (
    <div className="space-y-4">
      <WillingnessPicker value={form.willingness} notes={form.willingnessNotes} update={update} />

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>预计可申报年度</SectionTitle>
        <RadioGroup
          value={form.lgExpectedDeclareYear}
          onChange={(v) => update("lgExpectedDeclareYear", v)}
          options={LG_DECLARE_YEAR_OPTIONS}
        />
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>主要缺口项（多选）</SectionTitle>
        <MultiSelectPills
          options={LG_GAP_OPTIONS}
          selected={form.acknowledgedGaps}
          onToggle={(v) => toggleArr("acknowledgedGaps", v)}
        />
      </div>

      <div className="bg-white rounded-xl p-4">
        <SectionTitle>后续跟进安排</SectionTitle>
        <FormRow label="企业承诺事项">
          <textarea
            value={form.companyCommitments}
            onChange={(e) => update("companyCommitments", e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="记录企业表示将采取的行动，如：年底前申报省级专精特新"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400 resize-none"
          />
        </FormRow>
        <FormRow label="约定下次联系日期">
          <input
            type="date"
            value={form.followUpDate}
            onChange={(e) => update("followUpDate", e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-400"
          />
        </FormRow>
        <FormRow label="后续跟进需求（多选）">
          <MultiSelectPills
            options={LG_NEXT_STEP_OPTIONS}
            selected={form.nextSteps}
            onToggle={(v) => toggleArr("nextSteps", v)}
          />
        </FormRow>
        <FormRow label="工作人员内部备注">
          <textarea
            value={form.notes}
            onChange={(e) => update("notes", e.target.value)}
            rows={2}
            maxLength={300}
            placeholder="内部备注，不对外展示"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 outline-none focus:border-blue-400 resize-none"
          />
        </FormRow>
      </div>
    </div>
  );
}
