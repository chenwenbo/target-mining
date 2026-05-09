"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, Sparkles, UserCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  logoutPCUser,
  useCurrentPCUser,
} from "@/lib/account-mock";
import { getTenantById } from "@/lib/ops-mock";
import { useLayoutStore } from "@/lib/layout-store";

export default function Topbar() {
  const { user, mounted } = useCurrentPCUser();
  const [open, setOpen] = useState(false);
  const toggleAgentPanel = useLayoutStore((s) => s.toggleAgentPanel);
  const agentPanelOpen = useLayoutStore((s) => s.agentPanelOpen);
  const [tenantName, setTenantName] = useState("");
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!mounted) return;
    if (user.tenantId) {
      const tenant = getTenantById(user.tenantId);
      setTenantName(tenant?.name ?? "");
    } else {
      setTenantName("");
    }
  }, [mounted, user.tenantId]);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  const display = mounted ? user : { role: "region_admin" as const, street: null, displayName: "", dept: "", username: null };
  const initial = display.displayName.slice(0, 1);
  const isRegion = display.role === "region_admin";

  function handleLogout() {
    logoutPCUser();
    setOpen(false);
    window.location.href = "/login";
  }

  function handleProfile() {
    setOpen(false);
    router.push("/profile");
  }

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-[#e5e7eb] px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {tenantName && (
          <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f8fa] border border-[#e5e7eb] rounded-md text-sm text-[#475569] hover:bg-[#f1f5f9] transition-colors whitespace-nowrap">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
            {tenantName}
            <ChevronDown size={12} />
          </button>
        )}
      </div>

      {/* 右侧操作区 */}
      <div className="flex items-center gap-1">
        {/* 智能体触发按钮 */}
        <button
          type="button"
          onClick={toggleAgentPanel}
          title={agentPanelOpen ? "关闭智能体" : "打开智能体"}
          className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center transition-colors",
            agentPanelOpen
              ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
              : "text-[#94a3b8] hover:bg-[#f7f8fa] hover:text-[#475569]"
          )}
        >
          <Sparkles size={16} />
        </button>

        {/* 用户头像入口 */}
        <div ref={wrapRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f7f8fa] transition-colors"
          title="个人中心"
        >
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold",
              isRegion
                ? "bg-gradient-to-br from-violet-400 to-purple-600"
                : "bg-gradient-to-br from-sky-400 to-blue-600"
            )}
          >
            {initial}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-[#0f172a] leading-tight">{display.displayName}</div>
            <div className="text-[11px] text-[#94a3b8] leading-tight">{display.dept}</div>
          </div>
          <ChevronDown
            size={12}
            className={cn("text-[#94a3b8] transition-transform hidden sm:block", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-52 bg-white rounded-lg border border-[#e5e7eb] shadow-lg overflow-hidden">
            {/* 用户信息头 */}
            <div className="px-3 py-3 border-b border-[#f1f5f9] flex items-center gap-2.5">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0",
                  isRegion
                    ? "bg-gradient-to-br from-violet-400 to-purple-600"
                    : "bg-gradient-to-br from-sky-400 to-blue-600"
                )}
              >
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#0f172a] truncate">{display.displayName}</div>
                <div className="text-[11px] text-[#94a3b8] truncate">{display.dept}</div>
              </div>
            </div>

            {/* 个人中心 */}
            <button
              onClick={handleProfile}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#475569] hover:bg-[#f7f8fa] transition-colors"
            >
              <UserCircle size={13} />
              个人中心
            </button>

            {/* 退出登录 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#475569] hover:bg-[#f7f8fa] transition-colors border-t border-[#f1f5f9]"
            >
              <LogOut size={13} />
              退出登录
            </button>
          </div>
        )}
        </div>
      </div>
    </header>
  );
}
