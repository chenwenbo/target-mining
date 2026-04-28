"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  Building2,
  ChevronDown,
  KeyRound,
  ShieldCheck,
  UsersRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  authenticateAccount,
  authenticateRegionAdmin,
  buildStreetAdminUser,
  getStoredPCUser,
  getStreetAccounts,
  REGION_ADMIN_PASSWORD,
  REGION_ADMIN_USERNAME,
  REGION_LABEL,
  setCurrentPCUser,
  type StreetAccount,
} from "@/lib/account-mock";

type Tab = "region" | "street";

export default function PCLoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("region");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [hints, setHints] = useState<StreetAccount[]>([]);
  const [mounted, setMounted] = useState(false);

  // 已登录用户直接跳过登录页
  useEffect(() => {
    setMounted(true);
    const stored = getStoredPCUser();
    if (stored) {
      router.replace(stored.role === "region_admin" ? "/" : "/targets");
    }
    setHints(
      getStreetAccounts().filter((a) => a.enabled && a.username && a.password),
    );
  }, [router]);

  function switchTab(next: Tab) {
    setTab(next);
    setUsername("");
    setPassword("");
    setError("");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (tab === "region") {
      const user = authenticateRegionAdmin(username, password);
      if (!user) {
        setError("区域管理员账号或密码错误");
        return;
      }
      setCurrentPCUser(user);
      window.location.href = "/";
      return;
    }

    const account = authenticateAccount(username, password);
    if (!account) {
      setError("街道管理员账号或密码错误，或该账号已被禁用");
      return;
    }
    setCurrentPCUser(buildStreetAdminUser(account));
    window.location.href = "/targets";
  }

  function fillHint(a: StreetAccount) {
    setUsername(a.username ?? "");
    setPassword(a.password ?? "");
    setError("");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-blue-50 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-100/40">
      {/* 左侧品牌区（中宽以上展示） */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] px-12 py-12 relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-700 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center font-bold">
              TM
            </div>
            <div>
              <div className="text-base font-semibold">标的挖掘 · PC 工作台</div>
              <div className="text-xs text-blue-200 mt-0.5">高企申报 · v0.1</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-snug mb-3">
            高企申报标的挖掘平台
          </h1>
          <p className="text-sm text-blue-100/90 leading-relaxed max-w-md">
            面向区域管理层和街道管理员的高企申报作业台，覆盖标的池、任务派发、走访摸排闭环。
          </p>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <ShieldCheck size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold">区域管理员</div>
              <div className="text-xs text-blue-100/80 mt-0.5">
                查看驾驶舱、全区标的池、任务调度，统一分发摸排账号
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Building2 size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold">街道管理员</div>
              <div className="text-xs text-blue-100/80 mt-0.5">
                聚焦本街道企业池与任务，凭区科创局分发的账号登录
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-blue-200/70">{REGION_LABEL}</div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px]">
          {/* 移动端 logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              TM
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0f172a]">标的挖掘</div>
              <div className="text-[11px] text-[#94a3b8]">高企申报 · v0.1</div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[#0f172a] mb-1.5">登录</h2>
          <p className="text-sm text-[#64748b] mb-6">
            请选择对应身份登录到 PC 工作台
          </p>

          {/* 角色切换 */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-[#f1f5f9] rounded-lg mb-5">
            <button
              type="button"
              onClick={() => switchTab("region")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 text-sm rounded-md transition-all",
                tab === "region"
                  ? "bg-white text-blue-700 shadow-sm font-medium"
                  : "text-[#64748b] hover:text-[#0f172a]",
              )}
            >
              <ShieldCheck size={13} />
              区域管理员
            </button>
            <button
              type="button"
              onClick={() => switchTab("street")}
              className={cn(
                "flex items-center justify-center gap-1.5 py-2 text-sm rounded-md transition-all",
                tab === "street"
                  ? "bg-white text-blue-700 shadow-sm font-medium"
                  : "text-[#64748b] hover:text-[#0f172a]",
              )}
            >
              <UsersRound size={13} />
              街道管理员
            </button>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="block text-xs font-medium text-[#475569] mb-1.5">
                用户名
              </span>
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  if (error) setError("");
                }}
                type="text"
                autoComplete="username"
                placeholder={tab === "region" ? "例如：admin" : "例如：wh-dxh-jyh-01"}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-blue-500 placeholder:text-[#cbd5e1] font-mono"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[#475569] mb-1.5">
                密码
              </span>
              <input
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError("");
                }}
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-blue-500 placeholder:text-[#cbd5e1] font-mono"
              />
            </label>

            {error && (
              <div className="px-3 py-2 bg-red-50 border border-red-200 rounded-lg flex items-center gap-1.5 text-xs text-red-600">
                <AlertCircle size={12} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!username || !password}
              className="w-full py-2.5 mt-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <KeyRound size={13} />
              登录
            </button>
          </form>

          {/* 提示区 */}
          {tab === "region" ? (
            <div className="mt-5 px-3 py-2.5 bg-blue-50/60 border border-blue-100 rounded-lg text-[11px] text-[#475569] leading-relaxed">
              演示账号：<span className="font-mono text-blue-700">{REGION_ADMIN_USERNAME}</span>
              {" / "}
              <span className="font-mono text-blue-700">{REGION_ADMIN_PASSWORD}</span>
            </div>
          ) : hints.length > 0 ? (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowHints((v) => !v)}
                className="w-full flex items-center justify-between text-xs text-[#64748b] hover:text-[#475569] transition-colors"
              >
                <span>查看可用街道账号（{hints.length}）</span>
                <ChevronDown
                  size={13}
                  className={cn("transition-transform", showHints && "rotate-180")}
                />
              </button>
              {showHints && (
                <div className="mt-2 bg-white border border-[#e5e7eb] rounded-lg p-1.5 space-y-0.5 max-h-56 overflow-y-auto">
                  {hints.map((a) => (
                    <button
                      key={a.street}
                      type="button"
                      onClick={() => fillHint(a)}
                      className="w-full text-left px-2.5 py-2 rounded-md hover:bg-[#f7f8fa] transition-colors"
                    >
                      <div className="text-xs font-medium text-[#0f172a]">
                        {a.street}·管理员
                      </div>
                      <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                        {a.username} / {a.password}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-[#cbd5e1] mt-2 text-center">
                账号统一在「摸排账户分发配置」生成
              </p>
            </div>
          ) : (
            <div className="mt-5 px-3 py-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 leading-relaxed">
              当前还没有已生成的街道管理员账号。请先以区域管理员身份登录，到「摸排账户分发配置」页生成账号。
            </div>
          )}

          <p className="text-center text-[10px] text-[#cbd5e1] mt-8">
            标的挖掘平台 · 演示版本
          </p>
        </div>
      </div>
    </div>
  );
}
