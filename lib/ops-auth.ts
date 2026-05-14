"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  OPS_ADMIN_PASSWORD,
  OPS_ADMIN_SEED,
  OPS_ADMIN_USERNAME,
  type OpsUser,
} from "./ops-mock";

const CURRENT_OPS_USER_KEY = "ops_current_user";
const OPS_ADMIN_PASSWORD_KEY = "ops_admin_password";

export type ChangeOpsPasswordResult = "ok" | "wrong_old" | "same" | "error";

export function getOpsAdminPassword(): string {
  if (typeof window === "undefined") return OPS_ADMIN_PASSWORD;
  return localStorage.getItem(OPS_ADMIN_PASSWORD_KEY) ?? OPS_ADMIN_PASSWORD;
}

export function getStoredOpsUser(): OpsUser | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(CURRENT_OPS_USER_KEY);
    return raw ? (JSON.parse(raw) as OpsUser) : null;
  } catch {
    return null;
  }
}

export function setOpsUser(user: OpsUser): void {
  localStorage.setItem(CURRENT_OPS_USER_KEY, JSON.stringify(user));
}

export function logoutOpsUser(): void {
  localStorage.removeItem(CURRENT_OPS_USER_KEY);
}

export function authenticateOps(username: string, password: string): OpsUser | null {
  if (username.trim() === OPS_ADMIN_USERNAME && password.trim() === getOpsAdminPassword()) {
    return OPS_ADMIN_SEED;
  }
  return null;
}

export function changeOpsAdminPassword(
  oldPwd: string,
  newPwd: string,
): ChangeOpsPasswordResult {
  if (typeof window === "undefined") return "error";
  const oldValue = oldPwd.trim();
  const newValue = newPwd.trim();
  if (getOpsAdminPassword() !== oldValue) return "wrong_old";
  if (newValue === oldValue) return "same";
  localStorage.setItem(OPS_ADMIN_PASSWORD_KEY, newValue);
  return "ok";
}

export function useOpsUser(): { user: OpsUser | null; mounted: boolean } {
  const [user, setUser] = useState<OpsUser | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setUser(getStoredOpsUser());
    setMounted(true);
  }, []);

  return { user, mounted };
}

export function useOpsAuthGuard(): boolean {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const stored = getStoredOpsUser();
    setMounted(true);
    if (!stored) {
      router.replace("/ops/login");
      return;
    }
    setAuthed(true);
  }, [router]);

  return mounted && authed;
}
