import type {
  Company,
  Weights,
  ScoreResult,
  DimensionScore,
  Gap,
  Tier,
} from "./types";

// ─── 维度打分函数（0-100） ───────────────────────────────────────

function scoreIP(c: Company): Omit<DimensionScore, "weight"> {
  const { invention, utility, design } = c.patents;
  const sw = c.software;

  const invPts = Math.min(invention * 10, 40);
  const utilPts = Math.min(utility * 3, 20);
  const desPts = Math.min(design * 1, 5);
  const swPts = Math.min(sw * 2, 20);
  const rawScore = invPts + utilPts + desPts + swPts;
  const maxRaw = 85;

  return {
    name: "知识产权",
    score: Math.min(Math.round((rawScore / maxRaw) * 100), 100),
    rawScore,
    maxRaw,
    hits: [
      {
        label: "发明专利",
        value: `${invention} 项`,
        points: invPts,
        passed: invention >= 1,
      },
      {
        label: "实用新型专利",
        value: `${utility} 项`,
        points: utilPts,
        passed: utility >= 2,
      },
      {
        label: "外观设计专利",
        value: `${design} 项`,
        points: desPts,
        passed: design >= 1,
      },
      {
        label: "软件著作权",
        value: `${sw} 项`,
        points: swPts,
        passed: sw >= 1,
      },
    ],
  };
}

function scoreScale(c: Company): Omit<DimensionScore, "weight"> {
  const yearsSince =
    (Date.now() - new Date(c.establishedAt).getTime()) /
    (1000 * 60 * 60 * 24 * 365);

  const empPts =
    c.employees >= 100 ? 35 : c.employees >= 50 ? 25 : c.employees >= 30 ? 15 : 5;
  const capPts =
    c.registeredCapital >= 1000 ? 30 : c.registeredCapital >= 500 ? 20 : c.registeredCapital >= 100 ? 10 : 3;
  const agePts =
    yearsSince >= 1 && yearsSince <= 8
      ? 25
      : yearsSince > 8
      ? 15
      : 0;
  const smePts = c.inSMEDatabase ? 10 : 0;

  const rawScore = empPts + capPts + agePts + smePts;
  const maxRaw = 100;

  return {
    name: "规模与成长",
    score: Math.min(Math.round((rawScore / maxRaw) * 100), 100),
    rawScore,
    maxRaw,
    hits: [
      {
        label: "参保人数",
        value: `${c.employees} 人`,
        points: empPts,
        passed: c.employees >= 30,
      },
      {
        label: "注册资本",
        value: `${c.registeredCapital} 万元`,
        points: capPts,
        passed: c.registeredCapital >= 100,
      },
      {
        label: "成立年限（1-8 年优先）",
        value: `${yearsSince.toFixed(1)} 年`,
        points: agePts,
        passed: yearsSince >= 1,
      },
      {
        label: "科技型中小企业入库",
        value: c.inSMEDatabase ? "已入库" : "未入库",
        points: smePts,
        passed: c.inSMEDatabase,
      },
    ],
  };
}

function scoreField(c: Company): Omit<DimensionScore, "weight"> {
  const hit = c.techField !== null ? 100 : 0;
  return {
    name: "领域匹配",
    score: hit,
    rawScore: hit,
    maxRaw: 100,
    hits: [
      {
        label: "八大领域匹配",
        value: c.techField ?? "未匹配",
        points: hit,
        passed: c.techField !== null,
      },
    ],
  };
}

function scoreRD(c: Company): Omit<DimensionScore, "weight"> {
  const ratio = c.employees > 0 ? c.rdEmployees / c.employees : 0;
  const pts =
    ratio >= 0.3
      ? 100
      : ratio >= 0.2
      ? 80
      : ratio >= 0.1
      ? 55
      : ratio >= 0.05
      ? 30
      : 10;

  return {
    name: "研发强度",
    score: pts,
    rawScore: pts,
    maxRaw: 100,
    hits: [
      {
        label: "研发人员占比",
        value: `${(ratio * 100).toFixed(1)}%（${c.rdEmployees}/${c.employees}）`,
        points: pts,
        passed: ratio >= 0.1,
      },
    ],
  };
}

function scoreCompliance(c: Company): Omit<DimensionScore, "weight"> {
  let pts = 100;
  if (c.risk.abnormal) pts -= 50;
  if (c.risk.penalty) pts -= 50;
  pts = Math.max(pts, 0);

  return {
    name: "合规状态",
    score: pts,
    rawScore: pts,
    maxRaw: 100,
    hits: [
      {
        label: "经营异常记录",
        value: c.risk.abnormal ? "存在异常" : "无异常",
        points: c.risk.abnormal ? -50 : 0,
        passed: !c.risk.abnormal,
      },
      {
        label: "行政处罚记录",
        value: c.risk.penalty ? "存在处罚" : "无处罚",
        points: c.risk.penalty ? -50 : 0,
        passed: !c.risk.penalty,
      },
    ],
  };
}

function scoreGrowth(c: Company): Omit<DimensionScore, "weight"> {
  // 用专利增长势头作为成长性代理指标
  const totalPatents = c.patents.invention + c.patents.utility + c.patents.design + c.software;
  const pts =
    totalPatents >= 20
      ? 100
      : totalPatents >= 10
      ? 80
      : totalPatents >= 5
      ? 60
      : totalPatents >= 2
      ? 40
      : 20;

  return {
    name: "成长性",
    score: pts,
    rawScore: pts,
    maxRaw: 100,
    hits: [
      {
        label: "知识产权总量（成长代理）",
        value: `${totalPatents} 项`,
        points: pts,
        passed: totalPatents >= 5,
      },
    ],
  };
}

// ─── 缺项分析 ───────────────────────────────────────────────────

function analyzeGaps(c: Company, dims: DimensionScore[]): Gap[] {
  const gaps: Gap[] = [];
  const ipDim = dims.find((d) => d.name === "知识产权")!;
  const rdDim = dims.find((d) => d.name === "研发强度")!;
  const fieldDim = dims.find((d) => d.name === "领域匹配")!;
  const compDim = dims.find((d) => d.name === "合规状态")!;

  if (c.patents.invention === 0) {
    gaps.push({
      dimension: "知识产权",
      description: "尚无发明专利，知识产权质量评分受限",
      suggestion: "建议辅导申请 1-2 项发明专利（可借助专利代理机构快速申请）",
      urgent: true,
    });
  }
  if (c.software === 0 && c.patents.utility < 3) {
    gaps.push({
      dimension: "知识产权",
      description: "软著数量为零，知识产权数量不足",
      suggestion: "建议登记 2-3 项软件著作权，周期约 1-2 个月，成本较低",
      urgent: false,
    });
  }
  const rdRatio = c.employees > 0 ? c.rdEmployees / c.employees : 0;
  if (rdRatio < 0.1) {
    gaps.push({
      dimension: "研发强度",
      description: `研发人员占比 ${(rdRatio * 100).toFixed(1)}%，未达 10% 硬线要求`,
      suggestion: "建议增加研发岗招聘，或将部分技术人员正式纳入研发台账",
      urgent: true,
    });
  }
  if (fieldDim.score < 50) {
    gaps.push({
      dimension: "领域匹配",
      description: "当前主营业务与八大高新领域匹配度低",
      suggestion: "建议梳理技术方向，找到与《国家重点支持高新技术领域》的对应关系",
      urgent: false,
    });
  }
  if (compDim.score < 100) {
    gaps.push({
      dimension: "合规",
      description: "存在经营异常或行政处罚记录",
      suggestion: "须在申报前完成异常清除或处罚整改，否则直接影响认定资格",
      urgent: true,
    });
  }
  if (c.registeredCapital < 100) {
    gaps.push({
      dimension: "规模",
      description: `注册资本 ${c.registeredCapital} 万元，规模偏小`,
      suggestion: "建议增资至 100 万元以上，可提升整体评分约 7 分",
      urgent: false,
    });
  }
  return gaps;
}

// ─── 核心打分入口 ───────────────────────────────────────────────

export function scoreCompany(company: Company, weights: Weights): ScoreResult {
  const rawDims = [
    scoreIP(company),
    scoreScale(company),
    scoreField(company),
    scoreRD(company),
    scoreCompliance(company),
    scoreGrowth(company),
  ];

  const weightValues = [
    weights.ip,
    weights.scale,
    weights.field,
    weights.rd,
    weights.compliance,
    weights.growth,
  ];

  const dims: DimensionScore[] = rawDims.map((d, i) => ({
    ...d,
    weight: weightValues[i],
  }));

  const total = Math.round(
    dims.reduce((sum, d) => sum + d.score * d.weight, 0)
  );

  const tier: Tier =
    total >= 80 ? "A" : total >= 60 ? "B" : total >= 40 ? "C" : "D";

  const gaps = analyzeGaps(company, dims);

  return { total, tier, dimensions: dims, gaps };
}

// ─── 批量打分 ───────────────────────────────────────────────────
export function scoreAll(
  companies: Company[],
  weights: Weights
) {
  return companies.map((c) => ({ ...c, score: scoreCompany(c, weights) }));
}
