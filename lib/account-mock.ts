"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import type { Visitor } from "./types";
import { getTenants, saveTenants } from "./ops-mock";

// ─── 类型 ────────────────────────────────────────────────────
export type RoleType = "region_admin" | "street_admin";

export interface SurveyAccount {
  id: string;           // "sa_<timestamp>_<random4>"
  displayName: string;  // 管理员自定义名称
  orgUnit: string;      // 所属单位，自由文本，可留空
  username: string;     // 自动生成：survey-001, survey-002...
  password: string;     // 随机生成，可重置
  enabled: boolean;
  createdAt: string;    // ISO timestamp
}

export interface CurrentPCUser {
  role: RoleType;
  street: string | null;  // 存 orgUnit 或 displayName（兼容旧逻辑字段名）
  displayName: string;
  dept: string;
  username: string | null;
  tenantId?: string;      // 仅 region_admin 登录后携带
}

export const REGION_LABEL = "武汉市·东西湖区";

// ─── LocalStorage keys ───────────────────────────────────────
const ACCOUNTS_KEY = "pc_survey_accounts";
const CURRENT_USER_KEY = "pc_current_user";

// ─── 密码生成 ────────────────────────────────────────────────
const PWD_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";

function generatePassword(): string {
  if (typeof window === "undefined" || !window.crypto?.getRandomValues) {
    return "Pwd" + Math.random().toString(36).slice(2, 7);
  }
  const buf = new Uint32Array(5);
  window.crypto.getRandomValues(buf);
  let s = "";
  for (let i = 0; i < 5; i++) s += PWD_CHARSET[buf[i] % PWD_CHARSET.length];
  return "Pwd" + s;
}

// ─── 用户名生成：survey-001 格式 ────────────────────────────
function generateSurveyUsername(list: SurveyAccount[]): string {
  let max = 0;
  for (const a of list) {
    const m = a.username.match(/^survey-(\d+)$/);
    if (m) max = Math.max(max, parseInt(m[1], 10));
  }
  return `survey-${String(max + 1).padStart(3, "0")}`;
}

// ─── ID 生成 ─────────────────────────────────────────────────
function generateId(): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `sa_${ts}_${rand}`;
}

// ─── SurveyAccount CRUD ──────────────────────────────────────
export function getSurveyAccounts(): SurveyAccount[] {
  if (typeof window === "undefined") return [];
  // 清除旧 key（迁移）
  if (localStorage.getItem("pc_street_accounts")) {
    localStorage.removeItem("pc_street_accounts");
  }
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    return raw ? (JSON.parse(raw) as SurveyAccount[]) : [];
  } catch {
    return [];
  }
}

export function saveSurveyAccounts(list: SurveyAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function createSurveyAccount(displayName: string, orgUnit: string): SurveyAccount {
  const list = getSurveyAccounts();
  const account: SurveyAccount = {
    id: generateId(),
    displayName: displayName.trim(),
    orgUnit: orgUnit.trim(),
    username: generateSurveyUsername(list),
    password: generatePassword(),
    enabled: true,
    createdAt: new Date().toISOString(),
  };
  list.push(account);
  saveSurveyAccounts(list);
  return account;
}

export function updateSurveyAccount(
  id: string,
  patch: Partial<Pick<SurveyAccount, "displayName" | "orgUnit" | "enabled">>,
): void {
  const list = getSurveyAccounts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], ...patch };
  saveSurveyAccounts(list);
}

export function deleteSurveyAccount(id: string): void {
  const list = getSurveyAccounts().filter((a) => a.id !== id);
  saveSurveyAccounts(list);
}

export function resetSurveyAccountPassword(id: string): void {
  const list = getSurveyAccounts();
  const idx = list.findIndex((a) => a.id === id);
  if (idx < 0) return;
  list[idx] = { ...list[idx], password: generatePassword() };
  saveSurveyAccounts(list);
}

// ─── 认证 ────────────────────────────────────────────────────
export function authenticateAccount(username: string, password: string): SurveyAccount | null {
  const u = username.trim();
  const p = password.trim();
  if (!u || !p) return null;
  const match = getSurveyAccounts().find(
    (a) => a.enabled && a.username === u && a.password === p,
  );
  return match ?? null;
}

export function authenticateRegionAdmin(username: string, password: string): CurrentPCUser | null {
  const u = username.trim();
  const p = password.trim();
  if (!u || !p) return null;
  const tenant = getTenants().find(
    (t) => t.adminUsername === u && t.adminPassword === p
      && t.enabled && t.status !== "expired" && t.status !== "disabled",
  );
  if (!tenant) return null;
  return {
    role: "region_admin",
    street: null,
    displayName: tenant.adminDisplayName,
    dept: tenant.adminDept,
    username: tenant.adminUsername,
    tenantId: tenant.id,
  };
}

export function getRegionAdminDemoCredentials(): { username: string; password: string; displayName: string } | null {
  const demo = getTenants().find(
    (t) => t.enabled && (t.status === "active" || t.status === "trial"),
  );
  if (!demo) return null;
  return { username: demo.adminUsername, password: demo.adminPassword, displayName: demo.adminDisplayName };
}

// ─── 身份转换 ────────────────────────────────────────────────
export function buildSurveyAdminUser(account: SurveyAccount): CurrentPCUser {
  return {
    role: "street_admin",
    street: account.orgUnit || account.displayName,
    displayName: account.displayName,
    dept: account.orgUnit || account.displayName,
    username: account.username,
  };
}

export function surveyAccountToVisitor(account: SurveyAccount): Visitor {
  return {
    id: account.id,
    name: account.displayName,
    street: account.orgUnit || account.displayName,
    dept: account.orgUnit || account.displayName,
  };
}

// ─── 当前 PC 用户 ────────────────────────────────────────────
export function getStoredPCUser(): CurrentPCUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentPCUser) : null;
  } catch {
    return null;
  }
}

const EMPTY_PC_USER: CurrentPCUser = { role: "region_admin", street: null, displayName: "", dept: "", username: null };

export function getCurrentPCUser(): CurrentPCUser {
  return getStoredPCUser() ?? EMPTY_PC_USER;
}

export function setCurrentPCUser(user: CurrentPCUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logoutPCUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ─── region_admin 专项存储（供 UserSwitcher 切换回来用）──────
const REGION_ADMIN_USER_KEY = "pc_region_admin_user";

export function setRegionAdminUser(user: CurrentPCUser): void {
  localStorage.setItem(REGION_ADMIN_USER_KEY, JSON.stringify(user));
}

export function getRegionAdminUser(): CurrentPCUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(REGION_ADMIN_USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentPCUser) : null;
  } catch {
    return null;
  }
}

// ─── 密码修改 ────────────────────────────────────────────────
export type ChangePasswordResult = "ok" | "wrong_old" | "same" | "error";

export function changeRegionAdminPassword(oldPwd: string, newPwd: string): ChangePasswordResult {
  const currentUser = getStoredPCUser();
  if (!currentUser?.tenantId) return "error";
  const tenants = getTenants();
  const idx = tenants.findIndex((t) => t.id === currentUser.tenantId);
  if (idx < 0) return "error";
  if (tenants[idx].adminPassword !== oldPwd.trim()) return "wrong_old";
  if (newPwd.trim() === oldPwd.trim()) return "same";
  tenants[idx] = { ...tenants[idx], adminPassword: newPwd.trim() };
  saveTenants(tenants);
  return "ok";
}

export function changeSurveyAccountPassword(
  username: string,
  oldPwd: string,
  newPwd: string,
): ChangePasswordResult {
  const list = getSurveyAccounts();
  const idx = list.findIndex((a) => a.username === username);
  if (idx < 0) return "error";
  if (list[idx].password !== oldPwd.trim()) return "wrong_old";
  if (newPwd.trim() === oldPwd.trim()) return "same";
  list[idx] = { ...list[idx], password: newPwd.trim() };
  saveSurveyAccounts(list);
  return "ok";
}

// 向下兼容别名
export const changeStreetAdminPassword = changeSurveyAccountPassword;

// ─── 客户端 hooks ────────────────────────────────────────────
export function useCurrentPCUser(): { user: CurrentPCUser; mounted: boolean } {
  const [user, setUser] = useState<CurrentPCUser>(EMPTY_PC_USER);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getCurrentPCUser());
    setMounted(true);
    function onStorage(e: StorageEvent) {
      if (e.key === CURRENT_USER_KEY) setUser(getCurrentPCUser());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return { user, mounted };
}

export function useRoleGuard(required: RoleType): boolean {
  const router = useRouter();
  const { user, mounted } = useCurrentPCUser();
  useEffect(() => {
    if (!mounted) return;
    if (getStoredPCUser() && user.role !== required) router.replace("/targets");
  }, [user.role, mounted, required, router]);
  return mounted && user.role === required;
}

export function useAuthGuard(): boolean {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const stored = getStoredPCUser();
    setMounted(true);
    if (!stored) {
      router.replace("/login");
      return;
    }
    setAuthed(true);
  }, [router]);
  return mounted && authed;
}

// ─── 导出 / 复制工具 ─────────────────────────────────────────
export function formatAllAccountsForClipboard(list: SurveyAccount[]): string {
  const rows = list.filter((a) => a.enabled);
  const header = "账号名称\t所属单位\t用户名\t密码";
  const body = rows
    .map((a) => `${a.displayName}\t${a.orgUnit}\t${a.username}\t${a.password}`)
    .join("\n");
  return rows.length > 0 ? `${header}\n${body}` : "（暂无已启用的账号）";
}

export function exportAccountsCSV(list: SurveyAccount[], filename?: string): void {
  const rows = list.map((a) => ({
    账号名称: a.displayName,
    所属单位: a.orgUnit,
    启用: a.enabled ? "是" : "否",
    用户名: a.username,
    密码: a.password,
    创建时间: a.createdAt.slice(0, 19).replace("T", " "),
  }));
  const csv = Papa.unparse(rows, { header: true });
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = filename ?? `摸排账号列表-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
