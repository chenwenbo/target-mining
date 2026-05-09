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
  if (username.trim() === OPS_ADMIN_USERNAME && password.trim() === OPS_ADMIN_PASSWORD) {
    return OPS_ADMIN_SEED;
  }
  return null;
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
