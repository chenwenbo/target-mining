"use client";

import { useEffect, useState } from "react";
import { AlertCircle, ChevronDown, KeyRound, ServerCog } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  authenticateOps,
  getStoredOpsUser,
  setOpsUser,
} from "@/lib/ops-auth";
import { OPS_ADMIN_PASSWORD, OPS_ADMIN_USERNAME } from "@/lib/ops-mock";

export default function OpsLoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredOpsUser();
    if (stored) {
      window.location.href = "/ops/tenants";
    }
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const user = authenticateOps(username, password);
    if (user) {
      setOpsUser(user);
      window.location.href = "/ops/tenants";
      return;
    }
    setError("账号或密码错误");
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 to-orange-100 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-50 via-amber-50/40 to-orange-100/40">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex flex-col justify-between w-[42%] px-12 py-12 relative overflow-hidden bg-gradient-to-br from-amber-500 via-orange-500 to-orange-600 text-white">
        <div>
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-lg bg-white/15 flex items-center justify-center font-bold text-base">
              OP
            </div>
            <div>
              <div className="text-base font-semibold">运营管理后台</div>
              <div className="text-xs text-orange-200 mt-0.5">SaaS 平台 · v0.1</div>
            </div>
          </div>

          <h1 className="text-3xl font-bold leading-snug mb-3">
            高企申报 SaaS 平台运营中心
          </h1>
          <p className="text-sm text-orange-100/90 leading-relaxed max-w-md">
            统一管理平台所有租户账号，实时查看各区使用数据，快速开通与配置区域管理员权限。
          </p>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <ServerCog size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold">跨租户数据统计</div>
              <div className="text-xs text-orange-100/80 mt-0.5">
                汇总全平台企业、任务、走访、评估数据，实时掌握各区使用情况
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <KeyRound size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold">账号开通管理</div>
              <div className="text-xs text-orange-100/80 mt-0.5">
                一键创建区域管理员账号，支持有效期管理与密码重置
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-orange-200/70">标的挖掘 · 平台运营中心</div>
      </div>

      {/* 右侧表单区 */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-[420px]">
          {/* 移动端 logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-8">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              OP
            </div>
            <div>
              <div className="text-sm font-semibold text-[#0f172a]">运营管理后台</div>
              <div className="text-[11px] text-[#94a3b8]">SaaS 平台 · v0.1</div>
            </div>
          </div>

          <h2 className="text-xl font-semibold text-[#0f172a] mb-1.5">运营登录</h2>
          <p className="text-sm text-[#64748b] mb-6">输入运营账号密码，进入平台管理控制台</p>

          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block">
              <span className="block text-xs font-medium text-[#475569] mb-1.5">用户名</span>
              <input
                value={username}
                onChange={(e) => { setUsername(e.target.value); if (error) setError(""); }}
                type="text"
                autoComplete="username"
                placeholder="请输入运营账号"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-500 placeholder:text-[#cbd5e1] font-mono"
              />
            </label>

            <label className="block">
              <span className="block text-xs font-medium text-[#475569] mb-1.5">密码</span>
              <input
                value={password}
                onChange={(e) => { setPassword(e.target.value); if (error) setError(""); }}
                type="password"
                autoComplete="current-password"
                placeholder="请输入密码"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-500 placeholder:text-[#cbd5e1] font-mono"
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
              className="w-full py-2.5 mt-2 rounded-lg font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-amber-600 text-white hover:bg-amber-700 active:scale-[0.99] flex items-center justify-center gap-2"
            >
              <KeyRound size={13} />
              登录运营后台
            </button>
          </form>

          {/* 演示账号 */}
          <div className="mt-5">
            <button
              type="button"
              onClick={() => setShowHints((v) => !v)}
              className="w-full flex items-center justify-between text-xs text-[#64748b] hover:text-[#475569] transition-colors"
            >
              <span>查看演示账号</span>
              <ChevronDown
                size={13}
                className={cn("transition-transform", showHints && "rotate-180")}
              />
            </button>
            {showHints && (
              <div className="mt-2 bg-white border border-[#e5e7eb] rounded-lg p-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setUsername(OPS_ADMIN_USERNAME);
                    setPassword(OPS_ADMIN_PASSWORD);
                    setError("");
                  }}
                  className="w-full text-left px-2.5 py-2 rounded-md hover:bg-[#f7f8fa] transition-colors"
                >
                  <div className="text-xs font-medium text-[#0f172a]">平台超管</div>
                  <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                    {OPS_ADMIN_USERNAME} / {OPS_ADMIN_PASSWORD}
                  </div>
                </button>
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-[#cbd5e1] mt-8">
            标的挖掘平台 · 运营管理后台 · 演示版本
          </p>
        </div>
      </div>
    </div>
  );
}
