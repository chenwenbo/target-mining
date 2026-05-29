import type { Company, QualificationType } from "./types";

// ─── 推算字段 ─────────────────────────────────────────────────
// mock 数据中没有年收入、主营占比等字段，用现有字段确定性地估算。
// 生产环境应替换为实际字段读取。

export interface SMEDerivedFields {
  annualRevenueWan: number;     // 万元
  mainBizRevenueRatio: number;  // % 主营收入占总收入比
  rdExpenseRatio: number;       // % 研发费用占主营收入比
  inventionPatentCount: number;
  totalIPCount: number;
  estimatedMarketRank: number | null; // 1-5，null=未知
}

export function deriveSMEFields(c: Company): SMEDerivedFields {
  // 年收入：以注册资本 × 1.8 + 参保人数 × 12 作为估算基础
  const annualRevenueWan = Math.round(c.registeredCapital * 1.8 + c.employees * 12);

  // 主营占比：有技术领域的企业主营占比更高
  const mainBizRevenueRatio = Math.min(
    98,
    c.techField
      ? 72 + c.patents.invention * 0.8
      : 58 + c.patents.invention * 0.4
  );

  // 研发费用比：用研发人员占比 × 0.4 估算（有上限）
  const rdExpenseRatio =
    c.employees > 0
      ? Math.min(25, (c.rdEmployees / c.employees) * 40)
      : 2;

  const inventionPatentCount = c.patents.invention;
  const totalIPCount =
    c.patents.invention + c.patents.utility + c.patents.design + c.software;

  // 市场排名：发明专利≥5 且有技术领域 → 估算为 1-3
  const estimatedMarketRank =
    c.patents.invention >= 5 && c.techField
      ? Math.max(1, 4 - Math.floor(c.patents.invention / 3))
      : c.patents.invention >= 2 && c.techField
      ? 4
      : null;

  return {
    annualRevenueWan,
    mainBizRevenueRatio,
    rdExpenseRatio,
    inventionPatentCount,
    totalIPCount,
    estimatedMarketRank,
  };
}

// ─── 资质判定结果 ──────────────────────────────────────────────

export interface EligibilityResult {
  eligible: boolean;
  score: number;   // 0-100，用于排序
  gaps: string[];  // 人读缺口描述
}

export function checkEligibility(
  c: Company,
  q: QualificationType
): EligibilityResult {
  switch (q) {
    case "high_tech": {
      const totalIP =
        c.patents.invention + c.patents.utility + c.patents.design + c.software;
      const eligible =
        totalIP > 0 && c.techField !== null && !c.alreadyCertified && !c.risk.abnormal;
      const gaps: string[] = [];
      if (c.alreadyCertified) gaps.push("已是高企，无需再次申报");
      if (!c.techField) gaps.push("尚未归入八大技术领域");
      if (totalIP === 0) gaps.push("暂无知识产权");
      if (c.risk.abnormal) gaps.push("经营异常");
      return { eligible, score: Math.min(100, totalIP * 5 + (c.techField ? 20 : 0)), gaps };
    }

    case "innovative_sme": {
      const d = deriveSMEFields(c);
      const gaps: string[] = [];
      if (d.mainBizRevenueRatio < 70)
        gaps.push(`主营收入占比 ${d.mainBizRevenueRatio.toFixed(0)}%（估算，需≥70%）`);
      if (d.rdExpenseRatio < 3)
        gaps.push(`研发费用占比 ${d.rdExpenseRatio.toFixed(1)}%（估算，需≥3%）`);
      if (d.totalIPCount < 5)
        gaps.push(`知识产权 ${d.totalIPCount} 件（需≥5件）`);
      if (c.risk.abnormal) gaps.push("经营异常");
      const score = Math.min(
        100,
        d.totalIPCount * 4 + d.rdExpenseRatio * 5 + (d.mainBizRevenueRatio >= 70 ? 20 : 0)
      );
      return { eligible: gaps.length === 0, score, gaps };
    }

    case "specialized_sme": {
      const d = deriveSMEFields(c);
      const gaps: string[] = [];
      if (d.annualRevenueWan < 10000)
        gaps.push(`年收入约 ${(d.annualRevenueWan / 10000).toFixed(1)} 亿（估算，需≥1亿）`);
      if (!d.estimatedMarketRank || d.estimatedMarketRank > 3)
        gaps.push("细分市场排名未进入前3（估算）");
      if (d.inventionPatentCount < 5)
        gaps.push(`发明专利 ${d.inventionPatentCount} 件（需≥5件）`);
      if (c.risk.abnormal) gaps.push("经营异常");
      const score = Math.min(
        100,
        Math.floor(d.annualRevenueWan / 200) + d.inventionPatentCount * 8
      );
      return { eligible: gaps.length === 0, score, gaps };
    }

    case "little_giant": {
      const d = deriveSMEFields(c);
      const specialized = checkEligibility(c, "specialized_sme");
      const gaps = [...specialized.gaps];
      if (d.rdExpenseRatio < 6)
        gaps.push(`研发费用占比 ${d.rdExpenseRatio.toFixed(1)}%（估算，小巨人需≥6%）`);
      const score = Math.max(0, specialized.score + d.rdExpenseRatio * 3 - 10);
      return { eligible: gaps.length === 0, score: Math.min(100, score), gaps };
    }
  }
}

// ─── Pool tier 定义 ───────────────────────────────────────────

export interface PoolTierDef {
  id: string;
  label: string;
  desc: string;
  filter: (c: Company) => boolean;
}

export function getSMEPoolTiers(q: Exclude<QualificationType, "high_tech">): PoolTierDef[] {
  switch (q) {
    case "innovative_sme":
      return [
        {
          id: "all",
          label: "全部",
          desc: "所有企业",
          filter: () => true,
        },
        {
          id: "potential",
          label: "潜力企业",
          desc: "知识产权≥3件 或 有技术领域",
          filter: (c) => {
            const ip = c.patents.invention + c.patents.utility + c.patents.design + c.software;
            return ip >= 3 || c.techField !== null;
          },
        },
        {
          id: "criteria_met",
          label: "条件达标",
          desc: "估算达到创新型中小企业入库要求",
          filter: (c) => checkEligibility(c, "innovative_sme").eligible,
        },
        {
          id: "willing",
          label: "有意愿",
          desc: "申报意愿强烈或基本有意愿",
          filter: (c) =>
            (c.declarationWillingness === "strong" || c.declarationWillingness === "moderate") &&
            checkEligibility(c, "innovative_sme").score > 20,
        },
      ];

    case "specialized_sme":
      return [
        {
          id: "all",
          label: "全部",
          desc: "所有企业",
          filter: () => true,
        },
        {
          id: "potential",
          label: "潜力企业",
          desc: "发明专利≥2件 且 有技术领域",
          filter: (c) => c.patents.invention >= 2 && c.techField !== null,
        },
        {
          id: "criteria_met",
          label: "条件达标",
          desc: "估算达到专精特新中小企业认定要求",
          filter: (c) => checkEligibility(c, "specialized_sme").eligible,
        },
        {
          id: "willing",
          label: "有意愿",
          desc: "申报意愿强烈或基本有意愿",
          filter: (c) =>
            (c.declarationWillingness === "strong" || c.declarationWillingness === "moderate") &&
            checkEligibility(c, "specialized_sme").score > 30,
        },
      ];

    case "little_giant":
      return [
        {
          id: "all",
          label: "全部",
          desc: "所有企业",
          filter: () => true,
        },
        {
          id: "potential",
          label: "培育企业",
          desc: "发明专利≥5件 且 有技术领域",
          filter: (c) => c.patents.invention >= 5 && c.techField !== null,
        },
        {
          id: "criteria_met",
          label: "条件达标",
          desc: "估算达到专精特新小巨人申报要求",
          filter: (c) => checkEligibility(c, "little_giant").eligible,
        },
        {
          id: "willing",
          label: "有意愿",
          desc: "申报意愿强烈",
          filter: (c) =>
            c.declarationWillingness === "strong" &&
            checkEligibility(c, "little_giant").score > 40,
        },
      ];
  }
}

// ─── 已认定小巨人（mock 派生：仅最强候选）──────────────────────────
export function isLittleGiantCertified(c: Company): boolean {
  const e = checkEligibility(c, "little_giant");
  return e.eligible && c.declarationWillingness === "strong" && c.patents.invention >= 8;
}

// ─── 小巨人标的池分层（与驾驶舱五层漏斗保持一致）──────────────────
// 高新技术企业 → 创新型中小企业 → 专精特新中小企业 → 潜在标的 → 认定成功
export function getLittleGiantPoolTiers(): PoolTierDef[] {
  return [
    {
      id: "lg_high_tech",
      label: "高新技术企业",
      desc: "已认定高新技术企业",
      filter: (c) => c.alreadyCertified,
    },
    {
      id: "lg_innovative",
      label: "创新型中小企业",
      desc: "已入库或达到创新型中小企业条件",
      filter: (c) => c.inSMEDatabase || checkEligibility(c, "innovative_sme").eligible,
    },
    {
      id: "lg_specialized",
      label: "专精特新中小企业",
      desc: "达到专精特新中小企业认定条件",
      filter: (c) => checkEligibility(c, "specialized_sme").eligible,
    },
    {
      id: "lg_potential",
      label: "潜在标的",
      desc: "发明专利≥5件且有技术领域的小巨人候选",
      filter: (c) => c.patents.invention >= 5 && c.techField !== null,
    },
    {
      id: "lg_willing",
      label: "有意愿的企业",
      desc: "申报意愿强烈或基本有意愿的小巨人候选",
      filter: (c) =>
        c.patents.invention >= 5 &&
        c.techField !== null &&
        (c.declarationWillingness === "strong" || c.declarationWillingness === "moderate"),
    },
  ];
}
