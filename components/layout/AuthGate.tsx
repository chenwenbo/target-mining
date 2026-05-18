"use client";
import { useEffect } from "react";
import { useAuthGuard, getStoredPCUser } from "@/lib/account-mock";
import { getTenantById } from "@/lib/ops-mock";
import { useQualStore } from "@/lib/qual-store";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const authed = useAuthGuard();
  const initModules = useQualStore((s) => s.initModules);

  useEffect(() => {
    if (!authed) return;
    const user = getStoredPCUser();
    const tenant = user?.tenantId ? getTenantById(user.tenantId) : null;
    initModules(tenant?.modules ?? ["high_tech"]);
  }, [authed, initModules]);

  if (!authed) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#94a3b8]">
        正在校验登录状态…
      </div>
    );
  }
  return <>{children}</>;
}
