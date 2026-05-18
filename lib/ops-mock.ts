"use client";

// ─── 类型 ────────────────────────────────────────────────────
export type TenantStatus = "active" | "expired" | "disabled";

export interface TenantStats {
  companyCount: number;
  taskCount: number;
  visitCount: number;
  assessmentCount: number;
  lastLoginAt: string | null;
  monthlyLogins: number[]; // 最近6个月，index 0 = 最早
}

export interface Tenant {
  id: string;
  name: string;
  district: string;
  province: string;
  city: string;
  enabled: boolean;
  status: TenantStatus;
  createdAt: string;
  expiresAt: string;
  adminUsername: string;
  adminPassword: string;
  adminDisplayName: string;
  adminDept: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  notes: string;
  stats: TenantStats;
}

export interface OpsUser {
  username: string;
  displayName: string;
  role: "ops_admin";
}

// ─── 超管凭证（硬编码演示）─────────────────────────────────
export const OPS_ADMIN_USERNAME = "ops";
export const OPS_ADMIN_PASSWORD = "ops123";

export const OPS_ADMIN_SEED: OpsUser = {
  username: "ops",
  displayName: "平台运营",
  role: "ops_admin",
};

// ─── 密码生成（与 account-mock.ts 逻辑相同）────────────────
const PWD_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

export function generateTenantPassword(): string {
  if (typeof window === "undefined" || !window.crypto?.getRandomValues) {
    return "Pwd" + Math.random().toString(36).slice(2, 7);
  }
  const buf = new Uint32Array(5);
  window.crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < 5; i++) s += PWD_CHARSET[buf[i] % PWD_CHARSET.length];
  return "Pwd" + s;
}

// ─── Mock 租户种子数据 ────────────────────────────────────
export const MOCK_TENANTS_SEED: Tenant[] = [
  {
    id: "t-whdxh",
    name: "武汉市·东西湖区",
    district: "东西湖区",
    province: "湖北省",
    city: "武汉市",
    enabled: true,
    status: "active",
    createdAt: "2025-03-01T08:00:00Z",
    expiresAt: "2027-03-01",
    adminUsername: "wh-dxh-admin-01",
    adminPassword: "PwdXk9mN",
    adminDisplayName: "李明",
    adminDept: "科创局·高新处",
    contactName: "张局长",
    contactPhone: "027-83888001",
    contactEmail: "zhangju@dxh.gov.cn",
    notes: "参考租户，数据最为完整",
    stats: {
      companyCount: 1247,
      taskCount: 312,
      visitCount: 289,
      assessmentCount: 76,
      lastLoginAt: "2026-05-08T09:22:00Z",
      monthlyLogins: [38, 42, 51, 47, 60, 55],
    },
  },
  {
    id: "t-whjkq",
    name: "武汉市·武汉经开区",
    district: "武汉经开区",
    province: "湖北省",
    city: "武汉市",
    enabled: true,
    status: "active",
    createdAt: "2025-01-15T08:00:00Z",
    expiresAt: "2028-01-15",
    adminUsername: "wh-jkq-admin-01",
    adminPassword: "PwdRt7pQ",
    adminDisplayName: "王建国",
    adminDept: "科技局·创新科",
    contactName: "刘副局长",
    contactPhone: "027-84888002",
    contactEmail: "liufuju@jkq.gov.cn",
    notes: "旗舰客户，汽车+先进制造业为主，企业基数大",
    stats: {
      companyCount: 2538,
      taskCount: 487,
      visitCount: 421,
      assessmentCount: 134,
      lastLoginAt: "2026-05-09T08:05:00Z",
      monthlyLogins: [72, 88, 95, 102, 118, 110],
    },
  },
  {
    id: "t-whhs",
    name: "武汉市·洪山区",
    district: "洪山区",
    province: "湖北省",
    city: "武汉市",
    enabled: true,
    status: "active",
    createdAt: "2026-03-20T08:00:00Z",
    expiresAt: "2026-06-20",
    adminUsername: "wh-hs-admin-01",
    adminPassword: "PwdAm3bK",
    adminDisplayName: "陈科员",
    adminDept: "科技局",
    contactName: "陈科长",
    contactPhone: "027-87888003",
    contactEmail: "chenke@hs.gov.cn",
    notes: "高校周边科技企业多，合同将于2026-06-20到期",
    stats: {
      companyCount: 634,
      taskCount: 68,
      visitCount: 45,
      assessmentCount: 12,
      lastLoginAt: "2026-05-06T14:30:00Z",
      monthlyLogins: [0, 0, 8, 22, 31, 28],
    },
  },
  {
    id: "t-ycgxq",
    name: "宜昌市·高新区",
    district: "宜昌高新区",
    province: "湖北省",
    city: "宜昌市",
    enabled: true,
    status: "active",
    createdAt: "2025-07-10T08:00:00Z",
    expiresAt: "2027-07-10",
    adminUsername: "yc-gxq-admin-01",
    adminPassword: "PwdNz5wV",
    adminDisplayName: "周主任",
    adminDept: "高新区科技局",
    contactName: "周主任",
    contactPhone: "0717-6388004",
    contactEmail: "zhouzhuren@ycgxq.gov.cn",
    notes: "外地扩张第一单，化工+新能源领域为主",
    stats: {
      companyCount: 389,
      taskCount: 94,
      visitCount: 78,
      assessmentCount: 23,
      lastLoginAt: "2026-05-07T11:15:00Z",
      monthlyLogins: [15, 18, 22, 25, 30, 27],
    },
  },
  {
    id: "t-xygxq",
    name: "襄阳市·高新区",
    district: "高新区",
    province: "湖北省",
    city: "襄阳市",
    enabled: true,
    status: "expired",
    createdAt: "2024-12-01T08:00:00Z",
    expiresAt: "2025-12-01",
    adminUsername: "xy-gxq-admin-01",
    adminPassword: "PwdQs8jH",
    adminDisplayName: "赵科长",
    adminDept: "科技局",
    contactName: "赵科长",
    contactPhone: "0710-3588005",
    contactEmail: "zhaoke@xygxq.gov.cn",
    notes: "合同已于2025-12-01到期，待跟进续费",
    stats: {
      companyCount: 271,
      taskCount: 53,
      visitCount: 41,
      assessmentCount: 8,
      lastLoginAt: "2025-11-28T16:00:00Z",
      monthlyLogins: [20, 22, 18, 14, 0, 0],
    },
  },
  {
    id: "t-whjx",
    name: "武汉市·江夏区",
    district: "江夏区",
    province: "湖北省",
    city: "武汉市",
    enabled: false,
    status: "disabled",
    createdAt: "2025-05-01T08:00:00Z",
    expiresAt: "2027-05-01",
    adminUsername: "wh-jx-admin-01",
    adminPassword: "PwdLp2cY",
    adminDisplayName: "孙主任",
    adminDept: "科技创新局",
    contactName: "孙主任",
    contactPhone: "027-81888006",
    contactEmail: "sunzhuren@jx.gov.cn",
    notes: "因客户内部人员变动，账号临时停用，待对接新负责人后恢复",
    stats: {
      companyCount: 512,
      taskCount: 87,
      visitCount: 61,
      assessmentCount: 19,
      lastLoginAt: "2026-02-14T10:30:00Z",
      monthlyLogins: [25, 30, 22, 0, 0, 0],
    },
  },
];

// ─── LocalStorage key ────────────────────────────────────────
const TENANTS_KEY = "ops_tenants_v2";

// ─── CRUD ────────────────────────────────────────────────────
export function getTenants(): Tenant[] {
  if (typeof window === "undefined") return [...MOCK_TENANTS_SEED];
  try {
    const raw = localStorage.getItem(TENANTS_KEY);
    if (!raw) {
      const seed = [...MOCK_TENANTS_SEED];
      localStorage.setItem(TENANTS_KEY, JSON.stringify(seed));
      return seed;
    }
    return JSON.parse(raw) as Tenant[];
  } catch {
    return [...MOCK_TENANTS_SEED];
  }
}

export function saveTenants(list: Tenant[]): void {
  localStorage.setItem(TENANTS_KEY, JSON.stringify(list));
}

export function getTenantById(id: string): Tenant | undefined {
  return getTenants().find((t) => t.id === id);
}

export function addTenant(data: Omit<Tenant, "id">): Tenant {
  const list = getTenants();
  const tenant: Tenant = { ...data, id: `t-${Date.now()}` };
  list.push(tenant);
  saveTenants(list);
  return tenant;
}

export function updateTenant(id: string, patch: Partial<Tenant>): void {
  const list = getTenants();
  const idx = list.findIndex((t) => t.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  saveTenants(list);
}

export function setTenantEnabled(id: string, enabled: boolean): void {
  updateTenant(id, {
    enabled,
    status: enabled ? "active" : "disabled",
  });
}

export function resetTenantAdminPassword(id: string): string {
  const newPwd = generateTenantPassword();
  updateTenant(id, { adminPassword: newPwd });
  return newPwd;
}
