"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import { STREETS, type Street, type Visitor } from "./types";

// ─── 类型 ────────────────────────────────────────────────────
export type RoleType = "region_admin" | "street_admin";

export interface StreetAccount {
  street: Street;
  enabled: boolean;
  username: string | null;
  password: string | null;
  generatedAt: string | null;
}

export interface CurrentPCUser {
  role: RoleType;
  street: Street | null;
  displayName: string;
  dept: string;
  username: string | null;
}

// ─── 区域管理员种子身份（固定）─────────────────────────────
export const REGION_ADMIN_SEED: CurrentPCUser = {
  role: "region_admin",
  street: null,
  displayName: "李明",
  dept: "科创局·高新处",
  username: "admin",
};

// 区域管理员凭证（演示用，硬编码）
export const REGION_ADMIN_USERNAME = "admin";
export const REGION_ADMIN_PASSWORD = "admin123";

export const REGION_LABEL = "武汉市·东西湖区";

// ─── 街道拼音首字母字典（用于生成 username）─────────────────
const STREET_PINYIN: Record<Street, string> = {
  "国家网安基地": "gja",
  "临空港经开区": "lkg",
  "吴家山街道": "wjs",
  "将军路街道": "jjl",
  "径河街道": "jhe",
  "金银湖街道": "jyh",
  "慈惠街道": "chu",
  "走马岭街道": "zml",
  "新沟镇街道": "xgz",
  "东山街道": "dsh",
};

// ─── LocalStorage keys ───────────────────────────────────────
const ACCOUNTS_KEY = "pc_street_accounts";
const CURRENT_USER_KEY = "pc_current_user";

// ─── 凭证生成 ────────────────────────────────────────────────
export function generateUsername(street: Street): string {
  return `wh-dxh-${STREET_PINYIN[street] ?? "xxx"}-01`;
}

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

// ─── 街道账号 CRUD ──────────────────────────────────────────
function seedAccounts(): StreetAccount[] {
  return STREETS.map((s) => ({
    street: s,
    enabled: true,
    username: null,
    password: null,
    generatedAt: null,
  }));
}

export function getStreetAccounts(): StreetAccount[] {
  if (typeof window === "undefined") return seedAccounts();
  try {
    const raw = localStorage.getItem(ACCOUNTS_KEY);
    if (!raw) {
      const seed = seedAccounts();
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as StreetAccount[];
    // 容错：如果 STREETS 之后扩展，自动补齐缺失的街道
    const known = new Set(parsed.map((a) => a.street));
    const missing = STREETS.filter((s) => !known.has(s)).map<StreetAccount>((s) => ({
      street: s,
      enabled: true,
      username: null,
      password: null,
      generatedAt: null,
    }));
    if (missing.length > 0) {
      const merged = [...parsed, ...missing];
      localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(merged));
      return merged;
    }
    return parsed;
  } catch {
    return seedAccounts();
  }
}

export function saveStreetAccounts(list: StreetAccount[]): void {
  localStorage.setItem(ACCOUNTS_KEY, JSON.stringify(list));
}

export function getStreetAccount(street: Street): StreetAccount | undefined {
  return getStreetAccounts().find((a) => a.street === street);
}

export function generateStreetAccount(street: Street): StreetAccount {
  const list = getStreetAccounts();
  const idx = list.findIndex((a) => a.street === street);
  const updated: StreetAccount = {
    street,
    enabled: idx >= 0 ? list[idx].enabled : true,
    username: generateUsername(street),
    password: generatePassword(),
    generatedAt: new Date().toISOString(),
  };
  if (idx >= 0) list[idx] = updated;
  else list.push(updated);
  saveStreetAccounts(list);
  return updated;
}

export function setStreetEnabled(street: Street, enabled: boolean): void {
  const list = getStreetAccounts();
  const idx = list.findIndex((a) => a.street === street);
  if (idx < 0) return;
  list[idx] = { ...list[idx], enabled };
  saveStreetAccounts(list);
}

// ─── 当前 PC 用户 ────────────────────────────────────────────
// 读取存储的登录态（不带回退）；用于鉴权判断"是否登录"
export function getStoredPCUser(): CurrentPCUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_USER_KEY);
    return raw ? (JSON.parse(raw) as CurrentPCUser) : null;
  } catch {
    return null;
  }
}

// 带回退到种子身份；用于 UI 无害渲染默认占位
export function getCurrentPCUser(): CurrentPCUser {
  return getStoredPCUser() ?? REGION_ADMIN_SEED;
}

export function setCurrentPCUser(user: CurrentPCUser): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function logoutPCUser(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}

export function buildStreetAdminUser(account: StreetAccount): CurrentPCUser {
  return {
    role: "street_admin",
    street: account.street,
    displayName: `${account.street}·管理员`,
    dept: `${account.street}办事处`,
    username: account.username,
  };
}

// ─── 移动端登录辅助 ─────────────────────────────────────────
// 把 StreetAccount 投影为移动端使用的 Visitor 形态
export function streetAccountToVisitor(account: StreetAccount): Visitor {
  return {
    id: account.username ?? `acct_${account.street}`,
    name: `${account.street}·管理员`,
    street: account.street,
    dept: `${account.street}办事处`,
  };
}

// 凭证校验：返回匹配的账号或 null（启用且 username/password 都对得上）
export function authenticateAccount(username: string, password: string): StreetAccount | null {
  const u = username.trim();
  const p = password.trim();
  if (!u || !p) return null;
  const match = getStreetAccounts().find(
    (a) => a.enabled && a.username === u && a.password === p,
  );
  return match ?? null;
}

// 区域管理员校验：硬编码凭证；成功则返回种子身份
export function authenticateRegionAdmin(username: string, password: string): CurrentPCUser | null {
  if (username.trim() === REGION_ADMIN_USERNAME && password.trim() === REGION_ADMIN_PASSWORD) {
    return REGION_ADMIN_SEED;
  }
  return null;
}

// ─── 客户端 hooks ────────────────────────────────────────────
export function useCurrentPCUser(): { user: CurrentPCUser; mounted: boolean } {
  const [user, setUser] = useState<CurrentPCUser>(REGION_ADMIN_SEED);
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
    // 未登录的情况由 useAuthGuard 兜底跳到 /login，这里仅处理"登录但角色不匹配"
    if (getStoredPCUser() && user.role !== required) router.replace("/targets");
  }, [user.role, mounted, required, router]);
  return mounted && user.role === required;
}

// 登录态守卫：未登录则跳到 /login。在 (main) 布局壳里调用一次即可
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
export function formatAllAccountsForClipboard(list: StreetAccount[]): string {
  const rows = list.filter((a) => a.enabled && a.username && a.password);
  const header = "街道\t用户名\t密码";
  const body = rows.map((a) => `${a.street}\t${a.username}\t${a.password}`).join("\n");
  return rows.length > 0 ? `${header}\n${body}` : "（暂无已生成的账号）";
}

export function exportAccountsCSV(list: StreetAccount[], filename?: string): void {
  const rows = list.map((a) => ({
    街道: a.street,
    启用: a.enabled ? "是" : "否",
    用户名: a.username ?? "",
    密码: a.password ?? "",
    生成时间: a.generatedAt ? a.generatedAt.slice(0, 19).replace("T", " ") : "",
  }));
  const csv = Papa.unparse(rows, { header: true });
  const bom = "﻿";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = filename ?? `摸排账户分发-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
