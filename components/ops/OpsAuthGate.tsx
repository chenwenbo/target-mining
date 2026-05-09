"use client";

import { useOpsAuthGuard } from "@/lib/ops-auth";

export default function OpsAuthGate({ children }: { children: React.ReactNode }) {
  const authed = useOpsAuthGuard();

  if (!authed) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-[#94a3b8]">
        正在校验运营权限…
      </div>
    );
  }

  return <>{children}</>;
}
