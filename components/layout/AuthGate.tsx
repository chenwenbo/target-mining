"use client";
import { useAuthGuard } from "@/lib/account-mock";

export default function AuthGate({ children }: { children: React.ReactNode }) {
  const authed = useAuthGuard();
  if (!authed) {
    return (
      <div className="flex h-full items-center justify-center text-sm text-[#94a3b8]">
        正在校验登录状态…
      </div>
    );
  }
  return <>{children}</>;
}
