"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ClipboardList,
  Database,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  authenticateRegionAdmin,
  getRegionAdminDemoList,
  getStoredPCUser,
  setCurrentPCUser,
  setRegionAdminUser,
  type RegionAdminDemo,
} from "@/lib/account-mock";

export default function PCLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [regionAdminDemos, setRegionAdminDemos] = useState<RegionAdminDemo[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = getStoredPCUser();
    if (stored) {
      router.replace(stored.role === "region_admin" ? "/" : "/targets");
    }
    setRegionAdminDemos(getRegionAdminDemoList());
  }, [router]);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const regionUser = authenticateRegionAdmin(username, password);
    if (regionUser) {
      setCurrentPCUser(regionUser);
      setRegionAdminUser(regionUser);
      window.location.href = "/";
      return;
    }

    setError("账号或密码错误，或该账号已被禁用");
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
            覆盖标的发现、任务派发、走访摸排的高企申报协同平台，区域与街道高效联动。
          </p>
        </div>

        <div className="space-y-4 max-w-md">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <Database size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold">标的精准发现</div>
              <div className="text-xs text-blue-100/80 mt-0.5">
                汇聚全区企业数据，自动筛选高潜力高企标的，驾驶舱实时纵览区域进度
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <ClipboardList size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold">任务高效调度</div>
              <div className="text-xs text-blue-100/80 mt-0.5">
                区域管理层一键向各街道派发走访任务，优先级与进度统一管理
              </div>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/15 flex items-center justify-center flex-shrink-0">
              <CheckCircle size={15} />
            </div>
            <div>
              <div className="text-sm font-semibold">走访闭环沉淀</div>
              <div className="text-xs text-blue-100/80 mt-0.5">
                街道管理员结构化录入走访结果，申报意愿与企业信息实时回流
              </div>
            </div>
          </div>
        </div>

        <div className="text-[11px] text-blue-200/70">湖北省 · 多区县协同平台</div>
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
            输入账号密码，系统自动识别角色与权限
          </p>

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
                placeholder="请输入用户名"
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

          {/* 演示账号提示 */}
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
              <div className="mt-2 bg-white border border-[#e5e7eb] rounded-lg p-1.5 space-y-0.5 max-h-64 overflow-y-auto">
                {/* 区域管理员（所有活跃租户） */}
                {regionAdminDemos.map((demo) => (
                  <button
                    key={demo.username}
                    type="button"
                    onClick={() => {
                      setUsername(demo.username);
                      setPassword(demo.password);
                      setError("");
                    }}
                    className="w-full text-left px-2.5 py-2 rounded-md hover:bg-[#f7f8fa] transition-colors"
                  >
                    <div className="text-xs font-medium text-[#0f172a]">
                      {demo.tenantName}
                      <span className="text-[#94a3b8] font-normal ml-1">· {demo.displayName}</span>
                    </div>
                    <div className="text-[10px] text-[#94a3b8] font-mono mt-0.5">
                      {demo.username} / {demo.password}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          <p className="text-center text-[10px] text-[#cbd5e1] mt-8">
            标的挖掘平台 · 演示版本
          </p>
        </div>
      </div>
    </div>
  );
}
