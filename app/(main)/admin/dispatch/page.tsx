"use client";
import { useEffect, useState } from "react";
import { Copy, Download, KeyRound, RotateCcw, Check, ShieldAlert } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  exportAccountsCSV,
  formatAllAccountsForClipboard,
  generateStreetAccount,
  getStreetAccounts,
  REGION_LABEL,
  setStreetEnabled,
  useRoleGuard,
  type StreetAccount,
} from "@/lib/account-mock";
import type { Street } from "@/lib/types";

export default function DispatchConfigPage() {
  const allowed = useRoleGuard("region_admin");
  const [accounts, setAccounts] = useState<StreetAccount[]>([]);
  const [mounted, setMounted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmingReset, setConfirmingReset] = useState<Street | null>(null);

  useEffect(() => {
    setAccounts(getStreetAccounts());
    setMounted(true);
  }, []);

  function refresh() {
    setAccounts(getStreetAccounts());
  }

  function handleGenerate(street: Street) {
    generateStreetAccount(street);
    refresh();
    flashCopied(`gen-${street}`);
  }

  function handleReset(street: Street) {
    if (confirmingReset !== street) {
      setConfirmingReset(street);
      window.setTimeout(() => {
        setConfirmingReset((s) => (s === street ? null : s));
      }, 3000);
      return;
    }
    setConfirmingReset(null);
    generateStreetAccount(street);
    refresh();
    flashCopied(`reset-${street}`);
  }

  function handleToggle(street: Street, enabled: boolean) {
    setStreetEnabled(street, enabled);
    refresh();
  }

  function flashCopied(key: string) {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
  }

  function copyText(text: string, key: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => flashCopied(key));
  }

  function handleCopyOne(a: StreetAccount) {
    if (!a.username || !a.password) return;
    copyText(`用户名: ${a.username}\n密码: ${a.password}`, `copy-${a.street}`);
  }

  function handleCopyAll() {
    copyText(formatAllAccountsForClipboard(accounts), "copy-all");
  }

  function handleExport() {
    exportAccountsCSV(accounts);
  }

  if (!allowed || !mounted) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  const generatedCount = accounts.filter((a) => a.username && a.enabled).length;
  const enabledCount = accounts.filter((a) => a.enabled).length;
  const hasGenerated = generatedCount > 0;

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">摸排账户分发配置</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            当前区域：{REGION_LABEL} · 共 {accounts.length} 条街道 · 已启用 {enabledCount} · 已生成 {generatedCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            disabled={!hasGenerated}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg border transition-colors",
              hasGenerated
                ? "border-[#e5e7eb] text-[#475569] hover:bg-[#f7f8fa] bg-white"
                : "border-[#e5e7eb] text-[#cbd5e1] bg-[#f7f8fa] cursor-not-allowed"
            )}
          >
            {copiedKey === "copy-all" ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}
            {copiedKey === "copy-all" ? "已复制" : "复制全部账号"}
          </button>
          <button
            onClick={handleExport}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={13} /> 导出 CSV
          </button>
        </div>
      </div>

      {/* 提示条 */}
      <div className="mb-4 px-4 py-3 bg-blue-50/60 border border-blue-100 rounded-lg flex items-start gap-2.5 text-xs text-[#475569] leading-relaxed">
        <ShieldAlert size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          每条街道默认一个管理员账号位。生成后可在右侧复制凭证或重置；禁用的街道不会出现在派发候选与账号切换列表中。
          密码仅在本地浏览器存储（演示用），刷新不会丢失。
        </div>
      </div>

      {/* 街道列表 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-[40px_180px_1fr_auto] items-center gap-4 px-5 py-3 bg-[#f7f8fa] border-b border-[#e5e7eb] text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">
          <div>启用</div>
          <div>街道 / 园区</div>
          <div>账号凭证</div>
          <div className="text-right">操作</div>
        </div>

        {accounts.map((a) => {
          const generated = a.username && a.password;
          const isResetting = confirmingReset === a.street;
          const copyKey = `copy-${a.street}`;

          return (
            <div
              key={a.street}
              className={cn(
                "grid grid-cols-[40px_180px_1fr_auto] items-center gap-4 px-5 py-3.5 border-b border-[#f1f5f9] last:border-b-0 transition-colors",
                !a.enabled && "bg-[#fafbfc] opacity-60"
              )}
            >
              {/* 启用 */}
              <label className="flex items-center justify-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={(e) => handleToggle(a.street, e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              {/* 街道 */}
              <div>
                <div className="text-sm font-medium text-[#0f172a]">{a.street}</div>
                {a.generatedAt && (
                  <div className="text-[11px] text-[#94a3b8] mt-0.5">
                    生成于 {a.generatedAt.slice(0, 10)} {a.generatedAt.slice(11, 16)}
                  </div>
                )}
              </div>

              {/* 凭证 */}
              <div className="min-w-0">
                {!a.enabled ? (
                  <span className="text-xs text-[#94a3b8]">已禁用</span>
                ) : generated ? (
                  <div className="flex items-center gap-4 text-xs flex-wrap">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#94a3b8]">用户名</span>
                      <span className="font-mono text-[#0f172a] bg-[#f7f8fa] px-2 py-0.5 rounded">
                        {a.username}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[#94a3b8]">密码</span>
                      <span className="font-mono text-[#0f172a] bg-[#f7f8fa] px-2 py-0.5 rounded">
                        {a.password}
                      </span>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-[#cbd5e1]">（未生成账号）</span>
                )}
              </div>

              {/* 操作 */}
              <div className="flex items-center justify-end gap-1.5">
                {!a.enabled ? null : !generated ? (
                  <button
                    onClick={() => handleGenerate(a.street)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    <KeyRound size={12} />
                    生成账号
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() => handleCopyOne(a)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-[#e5e7eb] rounded-md text-[#475569] hover:bg-[#f7f8fa] transition-colors"
                    >
                      {copiedKey === copyKey ? (
                        <>
                          <Check size={12} className="text-emerald-500" />
                          <span className="text-emerald-600">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={12} />
                          复制
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => handleReset(a.street)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors",
                        isResetting
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-[#e5e7eb] text-[#475569] hover:bg-[#f7f8fa]"
                      )}
                    >
                      <RotateCcw size={12} />
                      {isResetting ? "再点确认重置" : "重置"}
                    </button>
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
