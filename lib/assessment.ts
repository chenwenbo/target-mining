import type {
  AssessmentQuestion,
  AssessmentAnswers,
  AssessmentScore,
  AssessmentDimensionScore,
  CultivationSuggestion,
  QualificationType,
} from "./types";

export interface AiAnalysisRisk {
  title: string;
  body: string;
}

export interface AiAnalysisStrength {
  title: string;
  body: string;
}

export interface AiRoadmapPhase {
  phase: string;
  timeframe: string;
  actions: string[];
}

export interface AiAnalysis {
  summary: string;
  certProbability: number;
  strengths: AiAnalysisStrength[];
  risks: AiAnalysisRisk[];
  roadmap: AiRoadmapPhase[];
}

// ─── 配置类型 ─────────────────────────────────────────────────────

export interface AssessmentDimensionDef {
  id: string;
  label: string;
  max: number;
  color: string;
}

export interface AssessmentStepGroup {
  title: string;
  ids: string[];
}

export interface AssessmentConfig {
  qualType: QualificationType;
  title: string; // 填写/结果页头部
  reportTitle: string; // 导出报告标题
  dimensions: AssessmentDimensionDef[];
  questions: AssessmentQuestion[];
  stepGroups: AssessmentStepGroup[];
  generateSuggestions: (
    answers: AssessmentAnswers,
    dims: AssessmentDimensionScore[],
  ) => CultivationSuggestion[];
  generateAiAnalysis: (
    score: AssessmentScore,
    answers: AssessmentAnswers,
  ) => AiAnalysis;
}

// ─── 共享辅助 ─────────────────────────────────────────────────────

type DimBodyMap = Record<string, (s: number, m: number) => string>;

function certProbability(total: number): number {
  return Math.min(
    95,
    total >= 80
      ? 85 + Math.round((total - 80) * 0.5)
      : total >= 70
      ? 68 + Math.round((total - 70) * 1.7)
      : total >= 60
      ? 42 + Math.round((total - 60) * 2.6)
      : Math.max(5, Math.round(total * 0.6)),
  );
}

function weakDimLabels(dimScores: AssessmentDimensionScore[]): string[] {
  return dimScores
    .filter((d) => d.score / d.maxScore < 0.6)
    .map((d) => d.label);
}

function selectStrengths(
  dimScores: AssessmentDimensionScore[],
  bodyMap: DimBodyMap,
): AiAnalysisStrength[] {
  return dimScores
    .filter((d) => d.score / d.maxScore >= 0.6)
    .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)
    .slice(0, 2)
    .map((d) => ({ title: d.label, body: bodyMap[d.dimension](d.score, d.maxScore) }));
}

function selectRisks(
  dimScores: AssessmentDimensionScore[],
  bodyMap: DimBodyMap,
): AiAnalysisRisk[] {
  return dimScores
    .filter((d) => d.score / d.maxScore < 0.7)
    .sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)
    .slice(0, 3)
    .map((d) => ({ title: d.label, body: bodyMap[d.dimension](d.score, d.maxScore) }));
}

// ══════════════════════════════════════════════════════════════════
// 高企认定测评配置
// ══════════════════════════════════════════════════════════════════

const HT_DIMENSIONS: AssessmentDimensionDef[] = [
  { id: "rd_expense", label: "研发投入", max: 30, color: "#2563eb" },
  { id: "rd_staff", label: "研发人员", max: 20, color: "#7c3aed" },
  { id: "ip", label: "知识产权", max: 30, color: "#0891b2" },
  { id: "hi_tech_revenue", label: "高新收入", max: 10, color: "#059669" },
  { id: "management", label: "企业管理", max: 10, color: "#d97706" },
];

const HT_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "rd_expense_ratio",
    dimension: "rd_expense",
    text: "企业近三年研发费用占年营业收入的平均比例大约是多少？",
    hint: "政策要求：收入＜5000万企业≥6%；5000万–2亿≥4%；＞2亿≥3%",
    isQualifier: false,
    options: [
      { value: "above_6pct", label: "6% 以上", score: 30 },
      { value: "4_6pct", label: "4%–6%", score: 20 },
      { value: "2_4pct", label: "2%–4%", score: 10 },
      { value: "under_2pct", label: "2% 以下", score: 0 },
    ],
  },
  {
    id: "rd_accounting_separate",
    dimension: "rd_expense",
    text: "企业是否建立了研发费用独立核算账目？",
    isQualifier: true,
    options: [
      { value: "yes", label: "已建立，独立核算", score: 0 },
      { value: "partial", label: "部分归集，未完全独立", score: 0 },
      { value: "no", label: "尚未建立", score: 0 },
    ],
  },
  {
    id: "rd_staff_ratio",
    dimension: "rd_staff",
    text: "企业研发人员数量占企业总员工数量的比例约为多少？（参保人数口径）",
    hint: "高企要求研发人员占比不低于企业当年职工总数的 10%",
    isQualifier: false,
    options: [
      { value: "above_15pct", label: "15% 以上", score: 20 },
      { value: "10_15pct", label: "10%–15%", score: 14 },
      { value: "5_10pct", label: "5%–10%", score: 7 },
      { value: "under_5pct", label: "5% 以下", score: 0 },
    ],
  },
  {
    id: "has_rd_dept",
    dimension: "management",
    text: "企业是否设有独立的研发部门或研发中心？",
    isQualifier: true,
    options: [
      { value: "yes_formal", label: "有，设有正式研发部门", score: 0 },
      { value: "yes_team", label: "有，以研发团队形式存在", score: 0 },
      { value: "no", label: "没有独立研发组织", score: 0 },
    ],
  },
  {
    id: "invention_patents",
    dimension: "ip",
    text: "企业目前拥有有效的发明专利数量（已授权）？",
    hint: "发明专利是高企评分中权重最高的知识产权类型",
    isQualifier: false,
    options: [
      { value: "3_plus", label: "3 项及以上", score: 12 },
      { value: "1_2", label: "1–2 项", score: 8 },
      { value: "applying", label: "有申请中，尚无授权", score: 3 },
      { value: "none", label: "无", score: 0 },
    ],
  },
  {
    id: "utility_patents",
    dimension: "ip",
    text: "企业拥有有效的实用新型专利数量？",
    isQualifier: false,
    options: [
      { value: "6_plus", label: "6 项及以上", score: 10 },
      { value: "3_5", label: "3–5 项", score: 7 },
      { value: "1_2", label: "1–2 项", score: 4 },
      { value: "none", label: "无", score: 0 },
    ],
  },
  {
    id: "software_copyrights",
    dimension: "ip",
    text: "企业拥有软件著作权数量？",
    isQualifier: false,
    options: [
      { value: "5_plus", label: "5 项及以上", score: 8 },
      { value: "2_4", label: "2–4 项", score: 5 },
      { value: "1", label: "1 项", score: 2 },
      { value: "none", label: "无", score: 0 },
    ],
  },
  {
    id: "hi_tech_revenue_ratio",
    dimension: "hi_tech_revenue",
    text: "企业近一年高新技术产品（服务）收入占总营业收入的比例约为多少？",
    hint: "高企要求高新技术产品（服务）收入占企业当年总收入的 60% 以上",
    isQualifier: false,
    options: [
      { value: "above_60pct", label: "60% 以上", score: 10 },
      { value: "40_60pct", label: "40%–60%", score: 6 },
      { value: "20_40pct", label: "20%–40%", score: 3 },
      { value: "under_20pct", label: "20% 以下", score: 0 },
    ],
  },
  {
    id: "has_accounting_firm",
    dimension: "management",
    text: "企业是否委托专业会计师事务所进行账务处理？",
    isQualifier: false,
    options: [
      { value: "yes", label: "是，已委托正规事务所", score: 5 },
      { value: "no", label: "否，自行做账", score: 0 },
    ],
  },
  {
    id: "annual_audit",
    dimension: "management",
    text: "企业近三年是否均完成了年度财务审计？",
    isQualifier: false,
    options: [
      { value: "all_passed", label: "三年均已完成审计", score: 5 },
      { value: "partial", label: "部分年度完成", score: 2 },
      { value: "none", label: "尚未进行审计", score: 0 },
    ],
  },
  {
    id: "compliance_clean",
    dimension: "management",
    text: "企业近三年是否存在重大违规、行政处罚记录？",
    isQualifier: true,
    options: [
      { value: "clean", label: "无违规、无处罚记录", score: 0 },
      { value: "minor", label: "有轻微记录，已整改", score: 0 },
      { value: "major", label: "有重大处罚记录", score: 0 },
    ],
  },
];

const HT_STEP_GROUPS: AssessmentStepGroup[] = [
  { title: "研发投入情况", ids: ["rd_expense_ratio", "rd_accounting_separate", "rd_staff_ratio", "has_rd_dept"] },
  { title: "知识产权情况", ids: ["invention_patents", "utility_patents", "software_copyrights"] },
  { title: "收入结构与管理", ids: ["hi_tech_revenue_ratio", "has_accounting_firm", "annual_audit", "compliance_clean"] },
];

function htGenerateSuggestions(
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

function htGenerateAiAnalysis(
  score: AssessmentScore,
  _answers: AssessmentAnswers,
): AiAnalysis {
  const { total, grade, dimensionScores } = score;
  const prob = certProbability(total);
  const weakDims = weakDimLabels(dimensionScores);

  let summary: string;
  if (grade === "优秀") {
    summary = `综合测评数据显示，企业整体高企资质成熟度较高，总分 ${total} 分，评级「条件优秀」。各核心维度指标均表现良好，知识产权储备与研发投入结构合理，具备较强的认定竞争力。建议在现有基础上完善申报材料，适时启动正式认定流程。`;
  } else if (grade === "符合") {
    const weakStr =
      weakDims.length > 0 ? `，其中${weakDims.join("、")}维度仍有提升空间` : "";
    summary = `综合测评数据显示，企业总分 ${total} 分，评级「符合申报条件」，已基本具备高企申报条件${weakStr}。建议在申报前重点强化薄弱环节，提升综合竞争力，以降低认定风险。`;
  } else {
    const urgentStr =
      weakDims.length > 0 ? weakDims.slice(0, 2).join("、") : "研发投入与知识产权";
    summary = `综合测评数据显示，企业总分 ${total} 分，评级「待重点培育」，与高企认定标准尚存在明显差距。${urgentStr}是当前最关键的短板，建议制定系统性 12–24 个月培育计划，优先补强核心指标，再择机启动申报。`;
  }

  const strengthBodies: DimBodyMap = {
    rd_expense: (s, m) =>
      s / m >= 0.8
        ? "研发投入占比达到或超过 6%，已满足最严格认定门槛，财务核算体系完善，是申报的有力支撑。"
        : "研发费用投入处于达标水平，建议进一步完善研发辅助账以强化证明力。",
    rd_staff: (s, m) =>
      s / m >= 0.7
        ? "研发团队规模占比充裕，超出政策最低要求，体现了企业对技术创新的持续投入。"
        : "研发人员占比满足基线要求，建议将相关岗位认定文件整理完备。",
    ip: (s, m) =>
      s / m >= 0.8
        ? "知识产权储备丰富，发明专利数量具备竞争优势，是专家评审中的重要加分项。"
        : "具备一定知识产权基础，涵盖多种类型，有助于满足认定要求。",
    hi_tech_revenue: (s, m) =>
      s / m >= 0.8
        ? "高新技术产品（服务）收入占比稳定超过 60%，营收结构符合高企认定核心要求。"
        : "高新收入占比基本达标，建议进一步梳理收入口径以确保统计准确性。",
    management: (s, m) =>
      s / m >= 0.8
        ? "财务管理规范，委托专业机构进行审计，合规记录良好，体现了较高的管理成熟度。"
        : "财务管理基本规范，建议完善年度审计及内部控制体系。",
  };

  const riskBodies: DimBodyMap = {
    rd_expense: (s, m) =>
      s / m < 0.4
        ? "研发费用占比严重不足，可能无法通过认定核查。需尽快梳理研发项目并规范归集，建立独立辅助账。"
        : "研发投入占比偏低，存在认定风险。建议在申报周期内提升研发费用比例并完善核算记录。",
    rd_staff: (s, m) =>
      s / m < 0.4
        ? "研发人员占比未达 10% 政策下限，需扩充研发岗位或重新核定人员归属，否则将直接影响认定资格。"
        : "研发人员占比接近政策边界，建议核查参保人数口径数据，留足缓冲余量。",
    ip: (s, m) =>
      s / m < 0.4
        ? "知识产权严重不足，是最大制约瓶颈。建议立即启动专利申请，优先布局发明专利及软件著作权。"
        : "知识产权储备有限，申报竞争力不强。建议系统规划知识产权布局，增加高价值专利数量。",
    hi_tech_revenue: (s, m) =>
      s / m < 0.4
        ? "高新收入占比严重不足，远低于 60% 门槛要求。需重新梳理营收结构，将合规的技术服务收入纳入统计。"
        : "高新技术产品收入占比未达标准，需重新核定收入口径并与财务机构协商合规核算方法。",
    management: (s, m) =>
      s / m < 0.4
        ? "财务管理制度存在明显缺陷，缺乏专业审计支持，将影响申报材料的可信度和合规性。"
        : "财务管理有待完善，建议委托专业会计师事务所并完成历年审计报告补充。",
  };

  const strengths = selectStrengths(dimensionScores, strengthBodies);
  const risks = selectRisks(dimensionScores, riskBodies);

  const roadmap: AiRoadmapPhase[] =
    grade === "待培育"
      ? [
          {
            phase: "基础补强",
            timeframe: "0–6 个月",
            actions: [
              "建立研发费用独立核算辅助账",
              "启动专利申请（优先发明专利 + 软件著作权）",
              "核查并调整研发人员岗位认定范围",
            ],
          },
          {
            phase: "全面提升",
            timeframe: "6–12 个月",
            actions: [
              "完成近三年年度财务审计报告",
              "梳理高新收入口径，完善技术服务合同",
              "设立正式研发中心，完善研发管理制度",
            ],
          },
          {
            phase: "申报冲刺",
            timeframe: "12–18 个月",
            actions: [
              "委托专业机构开展高企申报预评估",
              "系统整理申报材料，完善研发项目台账",
              "提交高企认定申请材料",
            ],
          },
        ]
      : grade === "符合"
      ? [
          {
            phase: "查漏补缺",
            timeframe: "0–3 个月",
            actions: [
              `重点强化薄弱维度（${weakDims[0] ?? "知识产权"}）`,
              "确认研发费用核算合规性，复查归集完整度",
              "确保所有专利/著作权证书在有效期内",
            ],
          },
          {
            phase: "材料准备",
            timeframe: "3–6 个月",
            actions: [
              "委托专业机构进行申报前预评估",
              "系统整理近三年研发项目立项书与结题报告",
              "完善科技成果转化记录及相关合同",
            ],
          },
          {
            phase: "正式申报",
            timeframe: "6 个月内",
            actions: ["完成高企认定材料汇总与审核", "提交申报，配合专家评审答辩"],
          },
        ]
      : [
          {
            phase: "材料优化",
            timeframe: "0–2 个月",
            actions: [
              "完善高新产品（服务）收入核算与合同留存",
              "更新知识产权证书及专利年费缴纳状态",
              "核实研发人员及费用数据准确性",
            ],
          },
          {
            phase: "申报准备",
            timeframe: "2–4 个月",
            actions: [
              "委托专业代理机构开展申报材料撰写",
              "准备研发项目立项报告及科技成果说明",
              "完成财务专项审计报告",
            ],
          },
          {
            phase: "提交申报",
            timeframe: "4–6 个月",
            actions: ["递交高企认定申请材料", "配合现场核查与专家评审"],
          },
        ];

  return { summary, certProbability: prob, strengths, risks, roadmap };
}

const HIGH_TECH_CONFIG: AssessmentConfig = {
  qualType: "high_tech",
  title: "高企资质测评",
  reportTitle: "高企认定专业测评报告",
  dimensions: HT_DIMENSIONS,
  questions: HT_QUESTIONS,
  stepGroups: HT_STEP_GROUPS,
  generateSuggestions: htGenerateSuggestions,
  generateAiAnalysis: htGenerateAiAnalysis,
};

// ══════════════════════════════════════════════════════════════════
// 专精特新"小巨人"测评配置
// ══════════════════════════════════════════════════════════════════

const LG_DIMENSIONS: AssessmentDimensionDef[] = [
  { id: "specialization", label: "专业化", max: 20, color: "#2563eb" },
  { id: "economics", label: "经济效益", max: 20, color: "#0891b2" },
  { id: "innovation", label: "创新能力", max: 30, color: "#7c3aed" },
  { id: "market_position", label: "产业链地位", max: 20, color: "#059669" },
  { id: "management", label: "经营管理", max: 10, color: "#d97706" },
];

const LG_QUESTIONS: AssessmentQuestion[] = [
  {
    id: "main_business_ratio",
    dimension: "specialization",
    text: "企业主营业务收入占营业收入总额的比重约为多少？",
    hint: "专精特新小巨人要求主营业务收入占比一般不低于 70%",
    isQualifier: false,
    options: [
      { value: "above_70", label: "70% 以上", score: 12 },
      { value: "50_70", label: "50%–70%", score: 7 },
      { value: "30_50", label: "30%–50%", score: 3 },
      { value: "under_30", label: "30% 以下", score: 0 },
    ],
  },
  {
    id: "focus_years",
    dimension: "specialization",
    text: "企业从事主导产品（所属细分领域）的经营时间有多久？",
    hint: "小巨人要求专注特定细分市场 3 年以上",
    isQualifier: false,
    options: [
      { value: "above_3", label: "3 年以上", score: 8 },
      { value: "2_3", label: "2–3 年", score: 5 },
      { value: "1_2", label: "1–2 年", score: 2 },
      { value: "under_1", label: "1 年以内", score: 0 },
    ],
  },
  {
    id: "annual_revenue",
    dimension: "economics",
    text: "企业上一年度营业收入规模约为多少？",
    hint: "小巨人一般要求上年度营业收入不低于 1 亿元（或符合高成长/上市等替代条件）",
    isQualifier: false,
    options: [
      { value: "above_4yi", label: "4 亿以上", score: 12 },
      { value: "1_4yi", label: "1 亿–4 亿", score: 9 },
      { value: "5000w_1yi", label: "5000 万–1 亿", score: 5 },
      { value: "under_5000w", label: "5000 万以下", score: 0 },
    ],
  },
  {
    id: "revenue_growth",
    dimension: "economics",
    text: "企业近两年营业收入或净利润的平均增长率约为多少？",
    hint: "持续稳定增长是小巨人评价的重要观察指标",
    isQualifier: false,
    options: [
      { value: "above_10", label: "10% 以上", score: 8 },
      { value: "5_10", label: "5%–10%", score: 5 },
      { value: "0_5", label: "0%–5%", score: 2 },
      { value: "negative", label: "负增长", score: 0 },
    ],
  },
  {
    id: "rd_ratio",
    dimension: "innovation",
    text: "企业近一年研发费用占营业收入的比重约为多少？",
    hint: "营收＜1 亿要求≥3%，1 亿–4 亿要求≥2%",
    isQualifier: false,
    options: [
      { value: "above_5", label: "5% 以上", score: 12 },
      { value: "3_5", label: "3%–5%", score: 9 },
      { value: "2_3", label: "2%–3%", score: 5 },
      { value: "under_2", label: "2% 以下", score: 0 },
    ],
  },
  {
    id: "invention_patents",
    dimension: "innovation",
    text: "企业拥有与主导产品相关的有效发明专利（Ⅰ类知识产权）数量？",
    hint: "小巨人要求拥有 2 项以上与主导产品相关的Ⅰ类知识产权",
    isQualifier: false,
    options: [
      { value: "above_5", label: "5 项及以上", score: 12 },
      { value: "2_4", label: "2–4 项", score: 9 },
      { value: "one", label: "1 项", score: 4 },
      { value: "none", label: "无", score: 0 },
    ],
  },
  {
    id: "rd_institution",
    dimension: "innovation",
    text: "企业是否设立研发机构（技术中心、工程研究中心等）？",
    hint: "省级以上研发机构是小巨人评价的重要加分项",
    isQualifier: false,
    options: [
      { value: "national", label: "国家级研发机构", score: 6 },
      { value: "provincial", label: "省级研发机构", score: 4 },
      { value: "municipal", label: "市级研发机构", score: 2 },
      { value: "none", label: "暂无", score: 0 },
    ],
  },
  {
    id: "market_share",
    dimension: "market_position",
    text: "企业主导产品在细分市场的占有率/排名情况？",
    hint: "主导产品应在细分市场具备较高占有率、位居全国前列",
    isQualifier: false,
    options: [
      { value: "national_top3", label: "全国前 3 或省内第 1", score: 12 },
      { value: "national_top10", label: "全国前 10", score: 8 },
      { value: "provincial_lead", label: "省内前列", score: 4 },
      { value: "unknown", label: "暂无明显优势", score: 0 },
    ],
  },
  {
    id: "chain_role",
    dimension: "market_position",
    text: "企业主导产品是否属于产业链关键环节（补短板/锻长板/填空白/关键基础产品）？",
    hint: "聚焦产业链关键环节是小巨人的核心政策导向",
    isQualifier: false,
    options: [
      { value: "national_key", label: "是，属国家重点领域", score: 8 },
      { value: "local_key", label: "是，属地方重点领域", score: 5 },
      { value: "general", label: "属一般配套环节", score: 2 },
      { value: "no", label: "否", score: 0 },
    ],
  },
  {
    id: "quality_system",
    dimension: "management",
    text: "企业是否通过质量管理体系认证（如 ISO9001 等）？",
    isQualifier: false,
    options: [
      { value: "multiple", label: "已通过多项体系认证", score: 5 },
      { value: "iso9001", label: "已通过 ISO9001", score: 4 },
      { value: "applying", label: "正在申请", score: 2 },
      { value: "none", label: "无", score: 0 },
    ],
  },
  {
    id: "digitalization",
    dimension: "management",
    text: "企业数字化/信息化水平如何（如两化融合贯标、智能制造等）？",
    isQualifier: false,
    options: [
      { value: "high", label: "较高，已贯标/智能制造", score: 5 },
      { value: "medium", label: "中等水平", score: 3 },
      { value: "early", label: "起步阶段", score: 1 },
      { value: "none", label: "基本无", score: 0 },
    ],
  },
  {
    id: "compliance_clean",
    dimension: "management",
    text: "企业近三年是否存在重大安全、质量、环境或失信违规记录？",
    isQualifier: true,
    options: [
      { value: "clean", label: "无重大记录", score: 0 },
      { value: "minor", label: "有轻微记录，已整改", score: 0 },
      { value: "major", label: "存在重大记录", score: 0 },
    ],
  },
];

const LG_STEP_GROUPS: AssessmentStepGroup[] = [
  { title: "专业化与经营规模", ids: ["main_business_ratio", "focus_years", "annual_revenue", "revenue_growth"] },
  { title: "创新能力", ids: ["rd_ratio", "invention_patents", "rd_institution"] },
  { title: "市场地位与管理", ids: ["market_share", "chain_role", "quality_system", "digitalization", "compliance_clean"] },
];

function lgGenerateSuggestions(
  answers: AssessmentAnswers,
  dims: AssessmentDimensionScore[],
): CultivationSuggestion[] {
  const suggestions: CultivationSuggestion[] = [];
  const byDim = Object.fromEntries(dims.map((d) => [d.dimension, d.score]));

  if ((byDim.specialization ?? 0) < 14) {
    suggestions.push({
      dimension: "specialization",
      urgent: true,
      title: "强化专业化定位",
      body: "专业化程度未达小巨人要求。建议聚焦主导产品、提升主营业务收入占比至 70% 以上，并持续深耕特定细分市场 3 年以上，形成稳定的专业化经营记录。",
    });
  }
  if (answers.main_business_ratio === "under_30" || answers.main_business_ratio === "30_50") {
    suggestions.push({
      dimension: "specialization",
      urgent: false,
      title: "提升主营业务收入占比",
      body: "主营业务收入占比偏低，建议剥离非核心业务、聚焦主导产品，将主营收入占比提升至 70% 以上，这是小巨人申报的基础门槛之一。",
    });
  }
  if ((byDim.economics ?? 0) < 12) {
    suggestions.push({
      dimension: "economics",
      urgent: true,
      title: "做大经营规模与成长性",
      body: "营收规模或成长性不足。建议制定营收增长计划，争取上年度营业收入达到 1 亿元以上，或保持近两年营收/利润的稳定较快增长，满足小巨人经济效益指标。",
    });
  }
  if ((byDim.innovation ?? 0) < 20) {
    suggestions.push({
      dimension: "innovation",
      urgent: true,
      title: "加强创新能力建设",
      body: "创新能力是小巨人评价的最高权重维度。建议将研发费用占比提升至 3% 以上、补足 2 项以上与主导产品相关的Ⅰ类知识产权（发明专利），并争取设立省级以上研发机构。",
    });
  }
  if (answers.invention_patents === "none" || answers.invention_patents === "one") {
    suggestions.push({
      dimension: "innovation",
      urgent: false,
      title: "补足Ⅰ类知识产权",
      body: "与主导产品相关的发明专利数量不足。建议立即围绕核心技术布局发明专利，确保拥有 2 项以上Ⅰ类知识产权，这是小巨人认定的硬性条件。",
    });
  }
  if ((byDim.market_position ?? 0) < 12) {
    suggestions.push({
      dimension: "market_position",
      urgent: true,
      title: "提升细分市场地位",
      body: "产业链地位与市场占有率有待提升。建议聚焦主导产品的细分市场，争取占有率进入全国前列；同时向产业链关键环节（补短板/锻长板/填空白）方向布局，强化不可替代性。",
    });
  }
  if ((byDim.management ?? 0) < 6) {
    suggestions.push({
      dimension: "management",
      urgent: false,
      title: "完善质量与数字化管理",
      body: "建议通过 ISO9001 等质量管理体系认证，并推进两化融合贯标、智能制造等数字化建设，提升规范化经营管理水平。",
    });
  }
  if (answers.compliance_clean === "major") {
    suggestions.push({
      dimension: "management",
      urgent: true,
      title: "消除重大合规风险",
      body: "存在重大安全、质量、环境或失信违规记录将直接影响小巨人认定资格。需在申报前完成整改并取得相关部门确认文件，建议提前评估影响范围。",
    });
  }

  return suggestions;
}

function lgGenerateAiAnalysis(
  score: AssessmentScore,
  _answers: AssessmentAnswers,
): AiAnalysis {
  const { total, grade, dimensionScores } = score;
  const prob = certProbability(total);
  const weakDims = weakDimLabels(dimensionScores);

  let summary: string;
  if (grade === "优秀") {
    summary = `综合测评数据显示，企业整体专精特新「小巨人」成熟度较高，总分 ${total} 分，评级「条件优秀」。专业化、创新能力与细分市场地位等核心维度表现突出，主导产品竞争力强，具备较强的申报竞争力。建议完善申报材料，适时启动小巨人认定流程。`;
  } else if (grade === "符合") {
    const weakStr =
      weakDims.length > 0 ? `，其中${weakDims.join("、")}维度仍有提升空间` : "";
    summary = `综合测评数据显示，企业总分 ${total} 分，评级「符合申报条件」，已基本具备小巨人申报条件${weakStr}。建议在申报前重点强化薄弱环节，巩固专业化与创新优势，以提升认定通过率。`;
  } else {
    const urgentStr =
      weakDims.length > 0 ? weakDims.slice(0, 2).join("、") : "创新能力与细分市场地位";
    summary = `综合测评数据显示，企业总分 ${total} 分，评级「待重点培育」，与小巨人认定标准尚存在明显差距。${urgentStr}是当前最关键的短板，建议制定系统性 12–24 个月培育计划，优先补强专业化与创新核心指标，再择机申报。`;
  }

  const strengthBodies: DimBodyMap = {
    specialization: (s, m) =>
      s / m >= 0.8
        ? "专业化程度高，主营业务收入占比与细分领域专注年限均达标，专业化定位清晰，是小巨人申报的有力支撑。"
        : "已具备一定专业化基础，建议进一步提升主营收入占比并延续细分领域深耕。",
    economics: (s, m) =>
      s / m >= 0.8
        ? "经营规模与成长性良好，营业收入规模达标且保持稳定增长，经济效益指标符合小巨人要求。"
        : "经济效益基本达标，建议持续做大营收规模并保持稳定增长。",
    innovation: (s, m) =>
      s / m >= 0.8
        ? "创新能力突出，研发投入、发明专利（Ⅰ类知识产权）储备与研发机构层级均具备竞争优势，是评审核心加分项。"
        : "具备一定创新基础，建议继续加大研发投入并补强发明专利储备。",
    market_position: (s, m) =>
      s / m >= 0.8
        ? "产业链地位稳固，主导产品细分市场占有率位居前列且处于产业链关键环节，不可替代性强。"
        : "细分市场地位基本良好，建议进一步巩固市场占有率与产业链关键环节定位。",
    management: (s, m) =>
      s / m >= 0.8
        ? "经营管理规范，质量管理体系与数字化建设到位，合规记录良好，体现较高的管理成熟度。"
        : "经营管理基本规范，建议完善质量体系认证与数字化建设。",
  };

  const riskBodies: DimBodyMap = {
    specialization: (s, m) =>
      s / m < 0.4
        ? "专业化程度严重不足，主营收入占比或细分领域专注年限未达门槛，需聚焦主导产品、提升专业化经营记录。"
        : "专业化程度接近政策边界，建议提升主营业务收入占比并延续细分市场深耕。",
    economics: (s, m) =>
      s / m < 0.4
        ? "经营规模或成长性严重不足，营收规模远低于 1 亿元门槛，需制定营收增长与高成长替代条件方案。"
        : "经济效益指标偏弱，建议做大营收规模并保持稳定增长以满足要求。",
    innovation: (s, m) =>
      s / m < 0.4
        ? "创新能力严重不足，是最大制约瓶颈。需尽快提升研发投入、补足 2 项以上与主导产品相关的Ⅰ类知识产权，并争取设立省级研发机构。"
        : "创新能力有待加强，建议提升研发费用占比并增加发明专利储备。",
    market_position: (s, m) =>
      s / m < 0.4
        ? "产业链地位与市场占有率明显不足，主导产品缺乏细分市场优势，需聚焦关键环节、提升市场占有率。"
        : "细分市场地位不够突出，建议强化市场占有率并向产业链关键环节布局。",
    management: (s, m) =>
      s / m < 0.4
        ? "经营管理基础薄弱，缺乏质量体系认证与数字化建设，将影响申报材料的规范性与可信度。"
        : "经营管理有待完善，建议补充质量管理体系认证并推进数字化建设。",
  };

  const strengths = selectStrengths(dimensionScores, strengthBodies);
  const risks = selectRisks(dimensionScores, riskBodies);

  const roadmap: AiRoadmapPhase[] =
    grade === "待培育"
      ? [
          {
            phase: "基础补强",
            timeframe: "0–6 个月",
            actions: [
              "聚焦主导产品，提升主营业务收入占比至 70% 以上",
              "围绕核心技术布局发明专利，补足 2 项以上Ⅰ类知识产权",
              "梳理研发费用归集，提升研发投入占比",
            ],
          },
          {
            phase: "能力提升",
            timeframe: "6–12 个月",
            actions: [
              "争取设立省级以上研发机构（技术中心/工程中心）",
              "提升主导产品细分市场占有率，强化产业链关键环节定位",
              "推进质量管理体系认证与两化融合贯标",
            ],
          },
          {
            phase: "申报冲刺",
            timeframe: "12–18 个月",
            actions: [
              "委托专业机构开展小巨人申报预评估",
              "系统整理专业化、创新与市场地位佐证材料",
              "提交专精特新小巨人申报材料",
            ],
          },
        ]
      : grade === "符合"
      ? [
          {
            phase: "查漏补缺",
            timeframe: "0–3 个月",
            actions: [
              `重点强化薄弱维度（${weakDims[0] ?? "创新能力"}）`,
              "确认主营收入占比与营收规模数据口径",
              "复核Ⅰ类知识产权数量与有效状态",
            ],
          },
          {
            phase: "材料准备",
            timeframe: "3–6 个月",
            actions: [
              "委托专业机构进行申报前预评估",
              "整理细分市场占有率与产业链地位佐证",
              "完善质量体系认证与研发机构证明材料",
            ],
          },
          {
            phase: "正式申报",
            timeframe: "6 个月内",
            actions: ["完成小巨人申报材料汇总与审核", "提交申报，配合审核与现场核查"],
          },
        ]
      : [
          {
            phase: "材料优化",
            timeframe: "0–2 个月",
            actions: [
              "完善主导产品收入与市场占有率佐证材料",
              "更新发明专利证书及研发投入数据",
              "整理质量体系认证与数字化建设记录",
            ],
          },
          {
            phase: "申报准备",
            timeframe: "2–4 个月",
            actions: [
              "委托专业代理机构开展申报材料撰写",
              "准备专业化、创新能力与产业链地位说明",
              "梳理近两年经营数据与成长性证明",
            ],
          },
          {
            phase: "提交申报",
            timeframe: "4–6 个月",
            actions: ["递交专精特新小巨人申请材料", "配合现场核查与审核"],
          },
        ];

  return { summary, certProbability: prob, strengths, risks, roadmap };
}

const LITTLE_GIANT_CONFIG: AssessmentConfig = {
  qualType: "little_giant",
  title: "专精特新小巨人测评",
  reportTitle: "专精特新小巨人专业测评报告",
  dimensions: LG_DIMENSIONS,
  questions: LG_QUESTIONS,
  stepGroups: LG_STEP_GROUPS,
  generateSuggestions: lgGenerateSuggestions,
  generateAiAnalysis: lgGenerateAiAnalysis,
};

// ══════════════════════════════════════════════════════════════════
// 注册表 + 入口
// ══════════════════════════════════════════════════════════════════

export const ASSESSMENT_CONFIGS: Partial<Record<QualificationType, AssessmentConfig>> = {
  high_tech: HIGH_TECH_CONFIG,
  little_giant: LITTLE_GIANT_CONFIG,
};

// 缺省 / 未实现的资质（innovative_sme、specialized_sme）暂回退到高企配置
export function getAssessmentConfig(qualType?: QualificationType): AssessmentConfig {
  return (qualType && ASSESSMENT_CONFIGS[qualType]) ?? HIGH_TECH_CONFIG;
}

export function scoreAssessment(
  qualType: QualificationType | undefined,
  answers: AssessmentAnswers,
): AssessmentScore {
  const config = getAssessmentConfig(qualType);

  const dimensionScores: AssessmentDimensionScore[] = config.dimensions.map((dim) => {
    const questions = config.questions.filter(
      (q) => q.dimension === dim.id && !q.isQualifier,
    );
    let score = 0;
    for (const q of questions) {
      const opt = q.options.find((o) => o.value === answers[q.id]);
      score += opt?.score ?? 0;
    }
    return { dimension: dim.id, label: dim.label, score, maxScore: dim.max };
  });

  const total = dimensionScores.reduce((sum, d) => sum + d.score, 0);
  const grade: AssessmentScore["grade"] =
    total >= 80 ? "优秀" : total >= 60 ? "符合" : "待培育";

  const suggestions = config.generateSuggestions(answers, dimensionScores);

  return { total, grade, dimensionScores, suggestions };
}

export function generateAiAnalysis(
  qualType: QualificationType | undefined,
  score: AssessmentScore,
  answers: AssessmentAnswers,
): AiAnalysis {
  return getAssessmentConfig(qualType).generateAiAnalysis(score, answers);
}
