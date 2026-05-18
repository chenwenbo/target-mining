"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Copy, Check, Eye, EyeOff, Download } from "lucide-react";
import { cn } from "@/lib/cn";
import Papa from "papaparse";
import { getTenants, type Tenant, type TenantStatus } from "@/lib/ops-mock";
import TenantStatusBadge from "@/components/ops/TenantStatusBadge";

type StatusFilter = "all" | TenantStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "活跃" },
  { key: "expired", label: "已到期" },
  { key: "disabled", label: "已禁用" },
];

function useCopyButton(text: string) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  }
  return { copied, copy };
}

function PasswordCell({ password }: { password: string }) {
  const [show, setShow] = useState(false);
  const { copied, copy } = useCopyButton(password);
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn("font-mono text-xs", !show && "tracking-widest text-[#94a3b8]")}>
        {show ? password : "••••••••"}
      </span>
      <button
        onClick={() => setShow((v) => !v)}
        className="text-[#94a3b8] hover:text-[#475569] transition-colors"
        title={show ? "隐藏" : "显示"}
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button
        onClick={copy}
        className="text-[#94a3b8] hover:text-amber-600 transition-colors"
        title="复制密码"
      >
        {copied ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function CopyCredentialsButton({ tenant }: { tenant: Tenant }) {
  const text = `${tenant.adminUsername}\t${tenant.adminPassword}`;
  const { copied, copy } = useCopyButton(text);
  return (
    <button
      onClick={copy}
      className={cn(
        "flex items-center gap-1 text-xs px-2 py-1 rounded-md border transition-colors",
        copied
          ? "text-emerald-600 bg-emerald-50 border-emerald-200"
          : "text-[#64748b] border-[#e5e7eb] hover:bg-[#f7f8fa]"
      )}
      title="复制账号凭证（用户名 + 密码）"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "已复制" : "复制凭证"}
    </button>
  );
}

export default function AccountsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [mounted, setMounted] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [bulkCopied, setBulkCopied] = useState(false);

  useEffect(() => {
    setTenants(getTenants());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  const filtered =
    statusFilter === "all"
      ? tenants
      : tenants.filter((t) => t.status === statusFilter);

  const activeCount = tenants.filter((t) => t.status === "active").length;
  const expiredCount = tenants.filter((t) => t.status === "expired").length;

  function handleBulkCopy() {
    const rows = filtered.map((t) => `${t.name}\t${t.adminUsername}\t${t.adminPassword}`);
    const text = ["租户名\t用户名\t密码", ...rows].join("\n");
    navigator.clipboard.writeText(text).then(() => {
      setBulkCopied(true);
      setTimeout(() => setBulkCopied(false), 2000);
    });
  }

  function handleExportCSV() {
    const rows = filtered.map((t) => ({
      租户名: t.name,
      行政区: t.district,
      状态: t.status,
      用户名: t.adminUsername,
      密码: t.adminPassword,
      到期日: t.expiresAt,
    }));
    const csv = Papa.unparse(rows, { header: true });
    const bom = "﻿";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `运营后台-账号列表-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* 页头 */}
      <div>
        <h1 className="text-xl font-bold text-[#0f172a]">账号开通</h1>
        <p className="text-sm text-[#64748b] mt-1">管理所有租户的区域管理员账号凭证</p>
      </div>

      {/* 统计卡片行 */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: "活跃账号", value: activeCount, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "已到期", value: expiredCount, color: "text-amber-600", bg: "bg-amber-50" },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]"
          >
            <div className="text-xs text-[#94a3b8] mb-2">{item.label}</div>
            <div className={cn("text-3xl font-bold tabular-nums", item.color)}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* 状态 Tab */}
      <div className="flex gap-1 border-b border-[#e5e7eb]">
        {STATUS_TABS.map((tab) => {
          const count =
            tab.key === "all"
              ? tenants.length
              : tenants.filter((t) => t.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={cn(
                "px-4 py-2.5 text-sm transition-colors border-b-2 -mb-px",
                statusFilter === tab.key
                  ? "border-amber-600 text-amber-700 font-medium"
                  : "border-transparent text-[#64748b] hover:text-[#0f172a]"
              )}
            >
              {tab.label}
              <span className="ml-1.5 text-[11px] text-[#94a3b8]">({count})</span>
            </button>
          );
        })}
      </div>

      {/* 账号表格 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                <th className="text-left text-xs text-[#94a3b8] font-medium px-5 py-3">租户</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">状态</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">用户名</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">密码</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">到期日</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-[#94a3b8] text-sm">
                    暂无账号
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#f7f8fa] last:border-0 hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#0f172a]">{t.name}</div>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">{t.adminDisplayName} · {t.adminDept}</div>
                    </td>
                    <td className="px-3 py-3">
                      <TenantStatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[#0f172a]">
                      {t.adminUsername}
                    </td>
                    <td className="px-3 py-3">
                      <PasswordCell password={t.adminPassword} />
                    </td>
                    <td className="px-3 py-3 text-xs text-[#94a3b8] tabular-nums">
                      {t.expiresAt}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <CopyCredentialsButton tenant={t} />
                        <Link
                          href={`/ops/tenants/${t.id}`}
                          className="text-xs text-amber-600 hover:text-amber-700 transition-colors font-medium"
                        >
                          详情 →
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 底部批量操作 */}
        <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between">
          <span className="text-xs text-[#94a3b8]">共 {filtered.length} 条账号</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkCopy}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors",
                bulkCopied
                  ? "text-emerald-600 bg-emerald-50 border-emerald-200"
                  : "text-[#64748b] border-[#e5e7eb] hover:bg-[#f7f8fa]"
              )}
            >
              {bulkCopied ? <Check size={12} /> : <Copy size={12} />}
              {bulkCopied ? "已复制全部" : "全部复制"}
            </button>
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border border-[#e5e7eb] text-[#64748b] hover:bg-[#f7f8fa] transition-colors"
            >
              <Download size={12} />
              导出 CSV
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
