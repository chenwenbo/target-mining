"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, UserCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import { logoutOpsUser, useOpsUser } from "@/lib/ops-auth";

export default function OpsTopbar() {
  const { user, mounted } = useOpsUser();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const displayName = mounted && user ? user.displayName : "平台运营";
  const initial = displayName.slice(0, 1);

  function handleLogout() {
    logoutOpsUser();
    setOpen(false);
    window.location.href = "/ops/login";
  }

  function handleProfile() {
    setOpen(false);
    router.push("/ops/profile");
  }

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-[#e5e7eb] px-6 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-[#0f172a]">运营管理后台</span>
        <span className="text-[11px] px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full font-medium">
          演示版
        </span>
      </div>

      {/* 用户头像入口 */}
      <div ref={wrapRef} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-[#f7f8fa] transition-colors"
          title="运营账号"
        >
          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[11px] font-semibold bg-gradient-to-br from-amber-400 to-orange-600">
            {initial}
          </div>
          <div className="text-left hidden sm:block">
            <div className="text-xs font-medium text-[#0f172a] leading-tight">{displayName}</div>
            <div className="text-[11px] text-[#94a3b8] leading-tight">平台超管</div>
          </div>
          <ChevronDown
            size={12}
            className={cn("text-[#94a3b8] transition-transform hidden sm:block", open && "rotate-180")}
          />
        </button>

        {open && (
          <div className="absolute right-0 top-[calc(100%+6px)] z-30 w-48 bg-white rounded-lg border border-[#e5e7eb] shadow-lg overflow-hidden">
            <div className="px-3 py-3 border-b border-[#f1f5f9] flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-600">
                {initial}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-medium text-[#0f172a] truncate">{displayName}</div>
                <div className="text-[11px] text-[#94a3b8] truncate">平台超管</div>
              </div>
            </div>
            <button
              onClick={handleProfile}
              className="w-full flex items-center gap-2 px-3 py-2.5 text-xs text-[#475569] hover:bg-[#f7f8fa] transition-colors"
            >
              <UserCircle size={13} />
              个人中心
            </button>
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
    </header>
  );
}
