"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { setCurrentVisitor } from "@/lib/mobile-mock";
import {
  authenticateAccount,
  getStreetAccounts,
  streetAccountToVisitor,
  type StreetAccount,
} from "@/lib/account-mock";
import { AlertCircle, ChevronDown, KeyRound, Smartphone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showHints, setShowHints] = useState(false);
  const [hints, setHints] = useState<StreetAccount[]>([]);

  // 仅在浏览器加载可用账号，防止 SSR / 水合不一致
  useEffect(() => {
    setHints(
      getStreetAccounts().filter((a) => a.enabled && a.username && a.password),
    );
  }, []);

  function handleLogin() {
    const account = authenticateAccount(username, password);
    if (!account) {
      setError("用户名或密码错误，请检查后重试");
      return;
    }
    setCurrentVisitor(streetAccountToVisitor(account));
    router.replace("/mobile/tasks");
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleLogin();
  }

  function fillFromHint(a: StreetAccount) {
    setUsername(a.username ?? "");
    setPassword(a.password ?? "");
    setError("");
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-600 to-blue-700">
      {/* 顶部品牌区 */}
      <div className="flex flex-col items-center pt-16 pb-10 px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <Smartphone size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">走访摸排助手</h1>
        <p className="text-blue-200 text-sm mt-1">东西湖区科技局 · 高企走访</p>
      </div>

      {/* 登录卡片 */}
      <div className="flex-1 bg-gray-50 rounded-t-3xl px-6 pt-8 pb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">账号登录</h2>
        <p className="text-xs text-gray-400 mb-5">
          请输入由科创局统一分发的街道管理员账号
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* 用户名 */}
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1.5">用户名</span>
            <input
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (error) setError("");
              }}
              type="text"
              autoComplete="username"
              placeholder="例如：wh-dxh-jyh-01"
              className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 placeholder:text-gray-300 font-mono"
            />
          </label>

          {/* 密码 */}
          <label className="block">
            <span className="block text-xs font-medium text-gray-600 mb-1.5">密码</span>
            <input
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) setError("");
              }}
              type="password"
              autoComplete="current-password"
              placeholder="请输入密码"
              className="w-full px-4 py-3 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-blue-500 placeholder:text-gray-300 font-mono"
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
            className="w-full py-3.5 mt-2 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white active:scale-[0.98] flex items-center justify-center gap-2"
          >
            <KeyRound size={14} />
            登录
          </button>
        </form>

        {/* 演示账号提示（仅当存在已生成账号时展示） */}
        {hints.length > 0 ? (
          <div className="mt-7">
            <button
              onClick={() => setShowHints((v) => !v)}
              className="w-full flex items-center justify-between text-xs text-gray-400"
            >
              <span>查看演示账号（{hints.length}）</span>
              <ChevronDown
                size={14}
                className={`transition-transform ${showHints ? "rotate-180" : ""}`}
              />
            </button>

            {showHints && (
              <div className="mt-3 bg-white rounded-xl p-2 space-y-1.5 border border-gray-100">
                {hints.map((a) => (
                  <button
                    key={a.street}
                    type="button"
                    onClick={() => fillFromHint(a)}
                    className="w-full text-left px-3 py-2 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all"
                  >
                    <div className="text-xs font-medium text-gray-700">
                      {a.street}·管理员
                    </div>
                    <div className="text-[10px] text-gray-400 font-mono mt-0.5">
                      {a.username} / {a.password}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[10px] text-gray-300 mt-3 text-center">
              账号统一由 PC 端「摸排账户分发配置」生成
            </p>
          </div>
        ) : (
          <div className="mt-7 px-3 py-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 leading-relaxed">
            当前还没有已生成的街道管理员账号。请联系区域管理员前往 PC 端
            「摸排账户分发配置」页生成账号后再登录。
          </div>
        )}
      </div>
    </div>
  );
}
