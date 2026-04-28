import type {
  AssessmentQuestion,
  AssessmentAnswers,
  AssessmentScore,
  AssessmentDimension,
  AssessmentDimensionScore,
  CultivationSuggestion,
} from "./types";

export const DIMENSION_LABELS: Record<AssessmentDimension, string> = {
  rd_expense: "研发投入",
  rd_staff: "研发人员",
  ip: "知识产权",
  hi_tech_revenue: "高新收入",
  management: "企业管理",
};

export const DIMENSION_MAX: Record<AssessmentDimension, number> = {
  rd_expense: 30,
  rd_staff: 20,
  ip: 30,
  hi_tech_revenue: 10,
  management: 10,
};

export const ASSESSMENT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "rd_expense_ratio",
    dimension: "rd_expense",
    text: "企业近三年研发费用占年营业收入的平均比例大约是多少？",
    hint: "政策要求：收入＜5000万企业≥6%；5000万–2亿≥4%；＞2亿≥3%",
    isQualifier: false,
    options: [
      { value: "above_6pct", label: "6% 以上", score: 30 },
      { value: "4_6pct",     label: "4%–6%",   score: 20 },
      { value: "2_4pct",     label: "2%–4%",   score: 10 },
      { value: "under_2pct", label: "2% 以下",  score: 0  },
    ],
  },
  {
    id: "rd_accounting_separate",
    dimension: "rd_expense",
    text: "企业是否建立了研发费用独立核算账目？",
    isQualifier: true,
    options: [
      { value: "yes",     label: "已建立，独立核算",       score: 0 },
      { value: "partial", label: "部分归集，未完全独立",   score: 0 },
      { value: "no",      label: "尚未建立",               score: 0 },
    ],
  },
  {
    id: "rd_staff_ratio",
    dimension: "rd_staff",
    text: "企业研发人员数量占企业总员工数量的比例约为多少？（参保人数口径）",
    hint: "高企要求研发人员占比不低于企业当年职工总数的 10%",
    isQualifier: false,
    options: [
      { value: "above_15pct", label: "15% 以上",  score: 20 },
      { value: "10_15pct",    label: "10%–15%",   score: 14 },
      { value: "5_10pct",     label: "5%–10%",    score: 7  },
      { value: "under_5pct",  label: "5% 以下",   score: 0  },
    ],
  },
  {
    id: "has_rd_dept",
    dimension: "management",
    text: "企业是否设有独立的研发部门或研发中心？",
    isQualifier: true,
    options: [
      { value: "yes_formal", label: "有，设有正式研发部门",     score: 0 },
      { value: "yes_team",   label: "有，以研发团队形式存在",   score: 0 },
      { value: "no",         label: "没有独立研发组织",         score: 0 },
    ],
  },
  {
    id: "invention_patents",
    dimension: "ip",
    text: "企业目前拥有有效的发明专利数量（已授权）？",
    hint: "发明专利是高企评分中权重最高的知识产权类型",
    isQualifier: false,
    options: [
      { value: "3_plus",   label: "3 项及以上",       score: 12 },
      { value: "1_2",      label: "1–2 项",           score: 8  },
      { value: "applying", label: "有申请中，尚无授权", score: 3  },
      { value: "none",     label: "无",               score: 0  },
    ],
  },
  {
    id: "utility_patents",
    dimension: "ip",
    text: "企业拥有有效的实用新型专利数量？",
    isQualifier: false,
    options: [
      { value: "6_plus", label: "6 项及以上", score: 10 },
      { value: "3_5",    label: "3–5 项",    score: 7  },
      { value: "1_2",    label: "1–2 项",    score: 4  },
      { value: "none",   label: "无",        score: 0  },
    ],
  },
  {
    id: "software_copyrights",
    dimension: "ip",
    text: "企业拥有软件著作权数量？",
    isQualifier: false,
    options: [
      { value: "5_plus", label: "5 项及以上", score: 8 },
      { value: "2_4",    label: "2–4 项",    score: 5 },
      { value: "1",      label: "1 项",      score: 2 },
      { value: "none",   label: "无",        score: 0 },
    ],
  },
  {
    id: "hi_tech_revenue_ratio",
    dimension: "hi_tech_revenue",
    text: "企业近一年高新技术产品（服务）收入占总营业收入的比例约为多少？",
    hint: "高企要求高新技术产品（服务）收入占企业当年总收入的 60% 以上",
    isQualifier: false,
    options: [
      { value: "above_60pct", label: "60% 以上",  score: 10 },
      { value: "40_60pct",    label: "40%–60%",   score: 6  },
      { value: "20_40pct",    label: "20%–40%",   score: 3  },
      { value: "under_20pct", label: "20% 以下",  score: 0  },
    ],
  },
  {
    id: "has_accounting_firm",
    dimension: "management",
    text: "企业是否委托专业会计师事务所进行账务处理？",
    isQualifier: false,
    options: [
      { value: "yes", label: "是，已委托正规事务所", score: 5 },
      { value: "no",  label: "否，自行做账",         score: 0 },
    ],
  },
  {
    id: "annual_audit",
    dimension: "management",
    text: "企业近三年是否均完成了年度财务审计？",
    isQualifier: false,
    options: [
      { value: "all_passed", label: "三年均已完成审计", score: 5 },
      { value: "partial",    label: "部分年度完成",     score: 2 },
      { value: "none",       label: "尚未进行审计",     score: 0 },
    ],
  },
  {
    id: "compliance_clean",
    dimension: "management",
    text: "企业近三年是否存在重大违规、行政处罚记录？",
    isQualifier: true,
    options: [
      { value: "clean", label: "无违规、无处罚记录",     score: 0 },
      { value: "minor", label: "有轻微记录，已整改",     score: 0 },
      { value: "major", label: "有重大处罚记录",         score: 0 },
    ],
  },
];

function generateSuggestions(
  answers: AssessmentAnswers,
  dims: AssessmentDimensionScore[],
): CultivationSuggestion[] {
  const suggestions: CultivationSuggestion[] = [];
  const byDim = Object.fromEntries(dims.map((d) => [d.dimension, d.score]));

  if ((byDim.rd_expense ?? 0) < 20) {
    suggestions.push({
      dimension: "rd_expense",
      urgent: true,
      title: "加大研发投入",
      body: "近三年研发费用占比未达申报要求。建议整理研发项目台账，将技术人员工资、设备折旧、外委研发费等合规归集到研发费用科目，目标占比按企业规模达到 3%–6% 以上。",
    });
  }
  if (answers.rd_accounting_separate === "no") {
    suggestions.push({
      dimension: "rd_expense",
      urgent: false,
      title: "建立研发费用独立核算体系",
      body: "建议尽快建立研发费用辅助账，实现研发成本独立核算。这是申报高企的基础性要求，也是审计机构审查的重点。建议委托专业财务机构辅导建账。",
    });
  }
  if ((byDim.rd_staff ?? 0) < 14) {
    suggestions.push({
      dimension: "rd_staff",
      urgent: true,
      title: "提升研发人员占比",
      body: "研发人员占比未达 10% 的最低要求。建议核查员工花名册中研发岗位人员比例，必要时调整岗位归属或适当扩充研发团队，确保参保人数口径下研发人员占比达标。",
    });
  }
  if (answers.has_rd_dept === "no") {
    suggestions.push({
      dimension: "rd_staff",
      urgent: false,
      title: "设立独立研发部门",
      body: "建议设立正式的研发部门（如技术中心、研发中心），完善研发管理制度和项目立项流程。独立研发组织架构有助于提升评审专家对企业研发能力的认可度。",
    });
  }
  if ((byDim.ip ?? 0) < 20) {
    suggestions.push({
      dimension: "ip",
      urgent: true,
      title: "加强知识产权储备",
      body: "知识产权积累不足，发明专利是高企核心加分项。建议立即开展专利布局，优先申请与主营产品相关的发明专利；同时补充软件著作权登记，短期内可通过实用新型专利快速提升知识产权数量。",
    });
  }
  if ((byDim.hi_tech_revenue ?? 0) < 6) {
    suggestions.push({
      dimension: "hi_tech_revenue",
      urgent: true,
      title: "提升高新技术产品收入占比",
      body: "高新技术产品（服务）收入占比不足 60%。建议梳理营收结构，将技术服务费、软件许可费、定制开发收入等纳入高新产品收入口径，并与财务机构确认合规核算方式，目标达到 60% 以上。",
    });
  }
  if ((byDim.management ?? 0) < 8) {
    suggestions.push({
      dimension: "management",
      urgent: false,
      title: "完善财务管理与合规体系",
      body: "建议委托专业会计师事务所进行账务处理，并完成近三年年度财务审计报告。规范的财务审计记录是申报材料的必要组成部分，也是降低审查风险的关键。",
    });
  }
  if (answers.compliance_clean === "major") {
    suggestions.push({
      dimension: "management",
      urgent: true,
      title: "消除重大合规风险",
      body: "存在重大违规或行政处罚记录将直接影响高企认定资格。需在申报前完成整改，取得相关部门的整改确认文件，建议提前咨询专业机构评估影响范围。",
    });
  }

  return suggestions;
}

export function scoreAssessment(answers: AssessmentAnswers): AssessmentScore {
  const dimensionScores: AssessmentDimensionScore[] = (
    Object.keys(DIMENSION_MAX) as AssessmentDimension[]
  ).map((dim) => {
    const questions = ASSESSMENT_QUESTIONS.filter(
      (q) => q.dimension === dim && !q.isQualifier,
    );
    let score = 0;
    for (const q of questions) {
      const chosen = answers[q.id];
      const opt = q.options.find((o) => o.value === chosen);
      score += opt?.score ?? 0;
    }
    return {
      dimension: dim,
      label: DIMENSION_LABELS[dim],
      score,
      maxScore: DIMENSION_MAX[dim],
    };
  });

  const total = dimensionScores.reduce((sum, d) => sum + d.score, 0);
  const grade: AssessmentScore["grade"] =
    total >= 80 ? "优秀" : total >= 60 ? "符合" : "待培育";

  const suggestions = generateSuggestions(answers, dimensionScores);

  return { total, grade, dimensionScores, suggestions };
}
