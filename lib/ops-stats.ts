import type { Tenant } from "./ops-mock";

export interface PlatformKPI {
  totalTenants: number;
  activeTenants: number;
  trialTenants: number;
  expiredTenants: number;
  disabledTenants: number;
  totalCompanies: number;
  totalTasks: number;
  totalVisits: number;
  totalAssessments: number;
  monthlyOnboarding: number[]; // 最近6个月新增租户数
}

export function getPlatformKPI(tenants: Tenant[]): PlatformKPI {
  const now = new Date();

  // 统计各状态数量
  const activeTenants = tenants.filter((t) => t.status === "active").length;
  const trialTenants = tenants.filter((t) => t.status === "trial").length;
  const expiredTenants = tenants.filter((t) => t.status === "expired").length;
  const disabledTenants = tenants.filter((t) => t.status === "disabled").length;

  // 资源汇总
  const totalCompanies = tenants.reduce((s, t) => s + t.stats.companyCount, 0);
  const totalTasks = tenants.reduce((s, t) => s + t.stats.taskCount, 0);
  const totalVisits = tenants.reduce((s, t) => s + t.stats.visitCount, 0);
  const totalAssessments = tenants.reduce((s, t) => s + t.stats.assessmentCount, 0);

  // 近6个月新增租户趋势（按 createdAt 月份归类）
  const monthlyOnboarding = Array(6).fill(0);
  tenants.forEach((t) => {
    const created = new Date(t.createdAt);
    for (let i = 0; i < 6; i++) {
      const target = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      if (
        created.getFullYear() === target.getFullYear() &&
        created.getMonth() === target.getMonth()
      ) {
        monthlyOnboarding[i]++;
      }
    }
  });

  return {
    totalTenants: tenants.length,
    activeTenants,
    trialTenants,
    expiredTenants,
    disabledTenants,
    totalCompanies,
    totalTasks,
    totalVisits,
    totalAssessments,
    monthlyOnboarding,
  };
}

// 0–100 活跃分（基于最近登录时间 + 月均登录次数）
export function getTenantActivityScore(tenant: Tenant): number {
  if (tenant.stats.lastLoginAt === null) return 0;
  const lastLogin = new Date(tenant.stats.lastLoginAt ?? "");
  const daysSince = (Date.now() - lastLogin.getTime()) / (1000 * 60 * 60 * 24);
  const recencyScore = Math.max(0, 50 - daysSince * 2); // 25天内满分50

  const avgMonthly =
    tenant.stats.monthlyLogins.reduce((a, b) => a + b, 0) /
    Math.max(1, tenant.stats.monthlyLogins.filter((v) => v > 0).length);
  const activityScore = Math.min(50, avgMonthly * 1.5);

  return Math.round(recencyScore + activityScore);
}

// 按活跃分降序排列
export function sortTenantsByActivity(tenants: Tenant[]): Tenant[] {
  return [...tenants].sort(
    (a, b) => getTenantActivityScore(b) - getTenantActivityScore(a)
  );
}

// 获取近6个月的月份标签（如 "11月", "12月", "1月"...）
export function getLast6MonthLabels(): string[] {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return `${d.getMonth() + 1}月`;
  });
}
