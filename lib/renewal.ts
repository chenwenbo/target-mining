import type {
  CertifiedCompany,
  RenewalStatus,
  RenewalReadinessScore,
  RenewalGap,
} from "./types";

// Reference date: 2026-04-22
const REF_DATE = new Date(2026, 3, 22);

export function monthsUntilExpiry(expiryYear: number): number {
  // Expiry assumed Dec 31 of expiryYear
  const expiry = new Date(expiryYear, 11, 31);
  return Math.round((expiry.getTime() - REF_DATE.getTime()) / (1000 * 60 * 60 * 24 * 30));
}

export function getRenewalStatus(company: CertifiedCompany): RenewalStatus {
  const months = monthsUntilExpiry(company.expiryYear);
  if (months < 0) return "overdue";
  if (months <= 6) return "critical";
  if (months <= 12) return "approaching";
  return "active";
}

export function scoreRenewalReadiness(company: CertifiedCompany): RenewalReadinessScore {
  const m = company.threeYearMetrics;
  const gaps: RenewalGap[] = [];

  // ① 三年研发投入占比均值（30分）
  // 按政策：收入<5000万≥6%；5000万-2亿≥4%；>2亿≥3%；统一用6%（中小企业）
  const avgRd = (m.rdExpenseRatioY1 + m.rdExpenseRatioY2 + m.rdExpenseRatioY3) / 3;
  const rdThreshold = 6;
  const rdRatioScore = avgRd >= rdThreshold ? 30 : avgRd >= rdThreshold * 0.85 ? 20 : avgRd >= rdThreshold * 0.65 ? 10 : 0;
  if (avgRd < rdThreshold) {
    gaps.push({
      criterion: "三年研发投入占比",
      currentValue: `均值 ${avgRd.toFixed(1)}%`,
      requiredValue: `≥ ${rdThreshold}%`,
      urgent: true,
      suggestion: "建议提高研发费用归集比例，补充研发项目立项文件与费用台账",
    });
  }

  // ② 高新产品（服务）收入占比均值（30分）
  const avgHt = (m.hiTechRevenueRatioY1 + m.hiTechRevenueRatioY2 + m.hiTechRevenueRatioY3) / 3;
  const hiTechRevenueScore = avgHt >= 60 ? 30 : avgHt >= 50 ? 18 : avgHt >= 40 ? 8 : 0;
  if (avgHt < 60) {
    gaps.push({
      criterion: "高新产品（服务）收入占比",
      currentValue: `均值 ${avgHt.toFixed(1)}%`,
      requiredValue: "≥ 60%",
      urgent: true,
      suggestion: "需重新梳理收入分类，将技术服务费、软件许可费等纳入高新产品收入口径",
    });
  }

  // ③ 三年新增专利（20分）
  const totalNew = m.newPatentsY1 + m.newPatentsY2 + m.newPatentsY3;
  const ipGrowthScore = totalNew >= 10 ? 20 : totalNew >= 5 ? 14 : totalNew >= 2 ? 8 : 2;
  if (totalNew < 5) {
    gaps.push({
      criterion: "三年知识产权新增量",
      currentValue: `${totalNew} 项`,
      requiredValue: "建议 ≥ 5 项",
      urgent: false,
      suggestion: "加快专利申请节奏，尤其是发明专利，提升知识产权质量评分",
    });
  }

  // ④ 合规与年度审计（20分）
  const allAudit = m.annualAuditPassedY1 && m.annualAuditPassedY2 && m.annualAuditPassedY3;
  const complianceScore = m.complianceClean && allAudit ? 20 : m.complianceClean ? 10 : 0;
  if (!m.complianceClean || !allAudit) {
    gaps.push({
      criterion: "年度合规与财务审计",
      currentValue: `合规: ${m.complianceClean ? "通过" : "存在问题"} · 审计: ${allAudit ? "全部通过" : "有未通过年度"}`,
      requiredValue: "三年全部通过",
      urgent: true,
      suggestion: "须在复审申报前完成违规整改，并补充经第三方机构审计的年度财务报告",
    });
  }

  const total = rdRatioScore + hiTechRevenueScore + ipGrowthScore + complianceScore;
  const urgentGaps = gaps.filter((g) => g.urgent);

  return {
    total,
    rdRatioScore,
    hiTechRevenueScore,
    ipGrowthScore,
    complianceScore,
    gaps,
    readyToRenew: total >= 70 && urgentGaps.length === 0,
  };
}

export interface RenewalKPI {
  total: number;
  overdue: number;
  critical: number;
  approaching: number;
  active: number;
  expiryByYear: Record<string, number>;
  companies: (CertifiedCompany & { renewalStatus: RenewalStatus })[];
}

export function getRenewalKPI(companies: CertifiedCompany[]): RenewalKPI {
  const withStatus = companies.map((c) => ({
    ...c,
    renewalStatus: getRenewalStatus(c),
  }));

  const expiryByYear: Record<string, number> = {};
  for (const c of withStatus) {
    const yr = String(c.expiryYear);
    expiryByYear[yr] = (expiryByYear[yr] || 0) + 1;
  }

  return {
    total: companies.length,
    overdue: withStatus.filter((c) => c.renewalStatus === "overdue").length,
    critical: withStatus.filter((c) => c.renewalStatus === "critical").length,
    approaching: withStatus.filter((c) => c.renewalStatus === "approaching").length,
    active: withStatus.filter((c) => c.renewalStatus === "active").length,
    expiryByYear,
    companies: withStatus,
  };
}
