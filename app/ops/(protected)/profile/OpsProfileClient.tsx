"use client";

import { useState } from "react";
import { CheckCircle2, Eye, EyeOff, XCircle } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  changeOpsAdminPassword,
  type ChangeOpsPasswordResult,
  useOpsUser,
} from "@/lib/ops-auth";

export default function OpsProfileClient() {
  const { user, mounted } = useOpsUser();
  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<ChangeOpsPasswordResult | "mismatch" | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!mounted || !user) return null;

  const initial = user.displayName.slice(0, 1);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      setResult("mismatch");
      return;
    }
    setSubmitting(true);
    const res = changeOpsAdminPassword(oldPwd, newPwd);
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

      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 mb-6 flex items-center gap-5">
        <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0 bg-gradient-to-br from-amber-400 to-orange-600">
          {initial}
        </div>
        <div>
          <div className="text-lg font-semibold text-[#0f172a]">{user.displayName}</div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">
              平台超管
            </span>
            <span className="text-sm text-[#94a3b8]">运营管理后台</span>
          </div>
          <div className="text-xs text-[#94a3b8] mt-1 font-mono">用户名：{user.username}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6">
        <h2 className="text-sm font-semibold text-[#0f172a] mb-5">修改密码</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">当前密码</label>
            <div className="relative">
              <input
                type={showOld ? "text" : "password"}
                value={oldPwd}
                onChange={(e) => { setOldPwd(e.target.value); setResult(null); }}
                placeholder="请输入当前密码"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all"
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
                className="w-full px-3 py-2.5 pr-10 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all"
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

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1.5">确认新密码</label>
            <div className="relative">
              <input
                type={showConfirm ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => { setConfirmPwd(e.target.value); setResult(null); }}
                placeholder="再次输入新密码"
                required
                className="w-full px-3 py-2.5 pr-10 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-50 transition-all"
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
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {submitting ? "保存中…" : "保存修改"}
          </button>
        </form>
      </div>
    </div>
  );
}
