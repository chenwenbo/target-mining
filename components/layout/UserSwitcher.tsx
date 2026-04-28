"use client";
import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, LogOut } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  REGION_ADMIN_SEED,
  buildStreetAdminUser,
  getStreetAccounts,
  logoutPCUser,
  setCurrentPCUser,
  useCurrentPCUser,
  type CurrentPCUser,
  type StreetAccount,
} from "@/lib/account-mock";

interface Props {
  collapsed: boolean;
}

export default function UserSwitcher({ collapsed }: Props) {
  const { user, mounted } = useCurrentPCUser();
  const [open, setOpen] = useState(false);
  const [accounts, setAccounts] = useState<StreetAccount[]>([]);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    setAccounts(getStreetAccounts());
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open]);

  function switchTo(target: CurrentPCUser) {
    setCurrentPCUser(target);
    setOpen(false);
    // 硬导航以强制 Sidebar 等客户端组件按新角色重渲
    window.location.href = target.role === "region_admin" ? "/" : "/targets";
  }

  function handleLogout() {
    logoutPCUser();
    setOpen(false);
    window.location.href = "/login";
  }

  const display = mounted ? user : REGION_ADMIN_SEED;
  const initial = display.displayName.slice(0, 1);
  const usableStreetAccounts = accounts.filter((a) => a.enabled && a.username);
  const isCurrent = (target: CurrentPCUser) =>
    target.role === display.role &&
    (target.role === "region_admin" || target.street === display.street);

  return (
    <div ref={wrapRef} className={cn("relative p-4 border-t border-[#e5e7eb]", collapsed && "p-3")}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center gap-2.5 rounded-md hover:bg-[#f7f8fa] transition-colors px-1 py-1 -mx-1",
          collapsed && "justify-center"
        )}
        title={collapsed ? `${display.displayName} · ${display.dept}` : "切换账号"}
      >
        <div
          className={cn(
            "w-7 h-7 flex-shrink-0 rounded-full flex items-center justify-center text-white text-[11px] font-semibold",
            display.role === "region_admin"
              ? "bg-gradient-to-br from-violet-400 to-purple-600"
              : "bg-gradient-to-br from-sky-400 to-blue-600"
          )}
        >
          {initial}
        </div>
        {!collapsed && (
          <>
            <div className="flex-1 min-w-0 text-left">
              <div className="text-xs font-medium text-[#0f172a] truncate">{display.displayName}</div>
              <div className="text-[11px] text-[#94a3b8] truncate">{display.dept}</div>
            </div>
            <ChevronDown
              size={12}
              className={cn(
                "text-[#94a3b8] flex-shrink-0 transition-transform",
                open && "rotate-180"
              )}
            />
          </>
        )}
      </button>

      {open && (
        <div
          className={cn(
            "absolute z-30 bg-white rounded-lg border border-[#e5e7eb] shadow-lg overflow-hidden",
            collapsed
              ? "left-full bottom-0 ml-2 w-64"
              : "left-3 right-3 bottom-[calc(100%-8px)] mb-1"
          )}
        >
          <div className="px-3 py-2 text-[10px] font-semibold text-[#94a3b8] uppercase tracking-wide bg-[#f7f8fa] border-b border-[#e5e7eb]">
            切换账号
          </div>

          {/* 区域管理员 */}
          <button
            onClick={() => switchTo(REGION_ADMIN_SEED)}
            className={cn(
              "w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#f7f8fa] transition-colors",
              isCurrent(REGION_ADMIN_SEED) && "bg-blue-50/50"
            )}
          >
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
              {REGION_ADMIN_SEED.displayName.slice(0, 1)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium text-[#0f172a] truncate">
                {REGION_ADMIN_SEED.displayName}
              </div>
              <div className="text-[11px] text-[#94a3b8] truncate">区域管理员 · {REGION_ADMIN_SEED.dept}</div>
            </div>
            {isCurrent(REGION_ADMIN_SEED) && <Check size={13} className="text-blue-600 flex-shrink-0" />}
          </button>

          {/* 街道管理员列表 */}
          {usableStreetAccounts.length > 0 ? (
            <div className="border-t border-[#f1f5f9] max-h-72 overflow-y-auto">
              {usableStreetAccounts.map((a) => {
                const target = buildStreetAdminUser(a);
                const current = isCurrent(target);
                return (
                  <button
                    key={a.street}
                    onClick={() => switchTo(target)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-2.5 text-left hover:bg-[#f7f8fa] transition-colors",
                      current && "bg-blue-50/50"
                    )}
                  >
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-sky-400 to-blue-600 flex items-center justify-center text-white text-[11px] font-semibold flex-shrink-0">
                      {a.street.slice(0, 1)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#0f172a] truncate">{a.street}·管理员</div>
                      <div className="text-[11px] text-[#94a3b8] truncate font-mono">{a.username}</div>
                    </div>
                    {current && <Check size={13} className="text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="border-t border-[#f1f5f9] px-3 py-3 text-[11px] text-[#94a3b8] leading-relaxed">
              暂无街道管理员账号。可在「账户分发」页生成。
            </div>
          )}

          {/* 退出登录 */}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#475569] hover:bg-[#f7f8fa] transition-colors border-t border-[#f1f5f9]"
          >
            <LogOut size={12} />
            退出登录
          </button>
        </div>
      )}
    </div>
  );
}
