"use client";
import { useState } from "react";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  useCurrentPCUser,
  changeRegionAdminPassword,
  changeStreetAdminPassword,
  type ChangePasswordResult,
} from "@/lib/account-mock";

export default function ProfilePage() {
  const { user, mounted } = useCurrentPCUser();

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<ChangePasswordResult | "mismatch" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!mounted) return null;

  const isRegion = user.role === "region_admin";
  const initial = user.displayName.slice(0, 1);
  const roleLabel = isRegion ? "区域管理员" : "摸排账号";

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setResult("mismatch");
      return;
    }
    setSubmitting(true);
    const res = isRegion
      ? changeRegionAdminPassword(oldPwd, newPwd)
      : changeStreetAdminPassword(user.username ?? "", oldPwd, newPwd);
    setResult(res);
    setSubmitting(false);
    if (res === "ok") {
      setOldPwd("");
      setNewPwd("");
      setConfirmPwd("");
    }
  }

  const resultMessages: Record<string, { text: string; ok: boolean }> = {
    ok: { text: "密码修改成功", ok: true },
    wrong_old: { text: "当前密码不正确，请重试", ok: false },
    same: { text: "新密码与当前密码相同，无需修改", ok: false },
    mismatch: { text: "两次输入的新密码不一致", ok: false },
    error: { text: "修改失败，请刷新页面后重试", ok: false },
  };

  return (
    <div className="p-8 max-w-2xl mx-auto">
      <h1 className="text-xl font-semibold text-[#0f172a] mb-6">个人中心</h1>

      {/* 用户信息卡 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 mb-6 flex items-center gap-5">
        <div
          className={cn(
            "w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0",
            isRegion
              ? "bg-gradient-to-br from-violet-400 to-purple-600"
              : "bg-gradient-to-br from-sky-400 to-blue-600"
          )}
        >
          {initial}
        </div>
        <div>
          <div className="text-lg font-semibold text-[#0f172a]">{user.displayName}</div>
          <div className="flex items-center gap-2 mt-1">
            <span
              className={cn(
                "text-[11px] px-2 py-0.5 rounded-full font-medium",
                isRegion
                  ? "bg-violet-100 text-violet-700"
                  : "bg-sky-100 text-sky-700"
              )}
            >
              {roleLabel}
            </span>
            <span className="text-sm text-[#94a3b8]">{user.dept}</span>
          </div>
          {user.username && (
            <div className="text-xs text-[#94a3b8] mt-1 font-mono">用户名：{user.username}</div>
          )}
        </div>
      </div>

      {/* 修改密码卡 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
        <h2 className="text-sm font-semibold text-[#0f172a] mb-5">修改密码</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 当前密码 */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">当前密码</label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPwd}
                onChange={(e) => { setOldPwd(e.target.value); setResult(null); }}
                placeholder="请输入当前密码"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowOld((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"
              >
                {showOld ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* 新密码 */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">新密码</label>
            <div className="relative">
              <input
                type={showNew ? "text" : "password"}
                value={newPwd}
                onChange={(e) => { setNewPwd(e.target.value); setResult(null); }}
                placeholder="请输入新密码"
                required
                minLength={6}
                className="w-full px-3 py-2.5 pr-10 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowNew((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"
              >
                {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* 确认新密码 */}
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">确认新密码</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); setResult(null); }}
                placeholder="再次输入新密码"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowConfirm((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#475569]"
              >
                {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* 结果提示 */}
          {result && resultMessages[result] && (
            <div
              className={cn(
                "flex items-center gap-2 text-xs px-3 py-2 rounded-lg",
                resultMessages[result].ok
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-600"
              )}
            >
              {resultMessages[result].ok
                ? <CheckCircle2 size={13} />
                : <XCircle size={13} />}
              {resultMessages[result].text}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? "保存中…" : "保存修改"}
          </button>
        </form>
      </div>
    </div>
  );
}
