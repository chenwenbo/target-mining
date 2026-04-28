import type {
  AssessmentQuestion,
  AssessmentAnswers,
  AssessmentScore,
  AssessmentDimension,
  AssessmentDimensionScore,
  CultivationSuggestion,
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

export function generateAiAnalysis(
  score: AssessmentScore,
  answers: AssessmentAnswers,
): AiAnalysis {
  const { total, grade, dimensionScores } = score;

  // cert probability
  const certProbability = Math.min(
    95,
    total >= 80
      ? 85 + Math.round((total - 80) * 0.5)
      : total >= 70
      ? 68 + Math.round((total - 70) * 1.7)
      : total >= 60
      ? 42 + Math.round((total - 60) * 2.6)
      : Math.max(5, Math.round(total * 0.6)),
  );

  // summary
  const weakDims = dimensionScores
    .filter((d) => d.score / d.maxScore < 0.6)
    .map((d) => d.label);
  let summary: string;
  if (grade === "优秀") {
    summary = `综合测评数据显示，企业整体高企资质成熟度较高，总分 ${total} 分，评级「条件优秀」。各核心维度指标均表现良好，知识产权储备与研发投入结构合理，具备较强的认定竞争力。建议在现有基础上完善申报材料，适时启动正式认定流程。`;
  } else if (grade === "符合") {
    const weakStr =
      weakDims.length > 0 ? `，其中${weakDims.join("、")}维度仍有提升空间` : "";
    summary = `综合测评数据显示，企业总分 ${total} 分，评级「符合申报条件」，已基本具备高企申报条件${weakStr}。建议在申报前重点强化薄弱环节，提升综合竞争力，以降低认定风险。`;
  } else {
    const urgentStr =
      weakDims.length > 0
        ? weakDims.slice(0, 2).join("、")
        : "研发投入与知识产权";
    summary = `综合测评数据显示，企业总分 ${total} 分，评级「待重点培育」，与高企认定标准尚存在明显差距。${urgentStr}是当前最关键的短板，建议制定系统性 12–24 个月培育计划，优先补强核心指标，再择机启动申报。`;
  }

  // strengths
  const strengthBodies: Record<AssessmentDimension, (s: number, m: number) => string> = {
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

  const strengths: AiAnalysisStrength[] = dimensionScores
    .filter((d) => d.score / d.maxScore >= 0.6)
    .sort((a, b) => b.score / b.maxScore - a.score / a.maxScore)
    .slice(0, 2)
    .map((d) => ({
      title: d.label,
      body: strengthBodies[d.dimension](d.score, d.maxScore),
    }));

  // risks
  const riskBodies: Record<AssessmentDimension, (s: number, m: number) => string> = {
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

  const risks: AiAnalysisRisk[] = dimensionScores
    .filter((d) => d.score / d.maxScore < 0.7)
    .sort((a, b) => a.score / a.maxScore - b.score / b.maxScore)
    .slice(0, 3)
    .map((d) => ({
      title: d.label,
      body: riskBodies[d.dimension](d.score, d.maxScore),
    }));

  // roadmap
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
            actions: [
              "完成高企认定材料汇总与审核",
              "提交申报，配合专家评审答辩",
            ],
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

  return { summary, certProbability, strengths, risks, roadmap };
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
