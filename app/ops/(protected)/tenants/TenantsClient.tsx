"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  Copy,
  Download,
  Eye,
  EyeOff,
  Pencil,
  Plus,
  Power,
  PowerOff,
  Search,
} from "lucide-react";
import Papa from "papaparse";
import { cn } from "@/lib/cn";
import {
  getTenants,
  setTenantEnabled,
  type Tenant,
  type TenantStatus,
} from "@/lib/ops-mock";
import TenantStatusBadge from "@/components/ops/TenantStatusBadge";
import AddTenantDrawer from "@/components/ops/AddTenantDrawer";
import EditTenantDrawer from "@/components/ops/EditTenantDrawer";

type StatusFilter = "all" | TenantStatus;

const STATUS_TABS: { key: StatusFilter; label: string }[] = [
  { key: "all", label: "全部" },
  { key: "active", label: "活跃" },
  { key: "trial", label: "试用中" },
  { key: "expired", label: "已到期" },
  { key: "disabled", label: "已禁用" },
];

const PAGE_SIZE = 10;

function formatDate(iso: string): string {
  return iso.slice(0, 10);
}

function formatRelativeTime(isoStr: string | null): string {
  if (!isoStr) return "—";
  const diff = Date.now() - new Date(isoStr).getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "今天";
  if (days < 30) return `${days}天前`;
  return `${Math.floor(days / 30)}个月前`;
}

function useCopyButton(text: string, duration = 1800) {
  const [copied, setCopied] = useState(false);

  function copy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), duration);
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
        type="button"
        onClick={() => setShow((v) => !v)}
        className="w-6 h-6 rounded-md flex items-center justify-center text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
        title={show ? "隐藏密码" : "显示密码"}
      >
        {show ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>
      <button
        type="button"
        onClick={copy}
        className="w-6 h-6 rounded-md flex items-center justify-center text-[#94a3b8] hover:bg-amber-50 hover:text-amber-600 transition-colors"
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
      type="button"
      onClick={copy}
      className={cn(
        "h-7 px-2 rounded-md flex items-center gap-1 text-xs border transition-colors",
        copied
          ? "text-emerald-600 bg-emerald-50 border-emerald-200"
          : "text-[#64748b] border-[#e5e7eb] hover:bg-[#f7f8fa] hover:text-[#0f172a]"
      )}
      title="复制账号凭证（用户名 + 密码）"
    >
      {copied ? <Check size={11} /> : <Copy size={11} />}
      {copied ? "已复制" : "复制凭证"}
    </button>
  );
}

export default function TenantsClient() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [page, setPage] = useState(1);
  const [showAdd, setShowAdd] = useState(false);
  const [editTarget, setEditTarget] = useState<Tenant | null>(null);
  const [bulkCopied, setBulkCopied] = useState(false);

  function reload() {
    setTenants(getTenants());
  }

  useEffect(() => {
    reload();
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  // 过滤
  const filtered = tenants.filter((t) => {
    const matchQ =
      !query ||
      t.name.includes(query) ||
      t.district.includes(query) ||
      t.adminUsername.toLowerCase().includes(query.toLowerCase());
    const matchStatus = statusFilter === "all" || t.status === statusFilter;
    return matchQ && matchStatus;
  });

  // 分页
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleToggleEnabled(t: Tenant) {
    setTenantEnabled(t.id, !t.enabled);
    reload();
  }

  function handleFilterChange(status: StatusFilter) {
    setStatusFilter(status);
    setPage(1);
  }

  function handleSearch(q: string) {
    setQuery(q);
    setPage(1);
  }

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
    const bom = "\uFEFF";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `运营后台-租户账号列表-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-5">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">租户管理</h1>
          <p className="text-sm text-[#64748b] mt-1">共 {tenants.length} 个租户</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
        >
          <Plus size={14} />
          新增租户
        </button>
      </div>

      {/* 过滤栏 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-wrap items-center gap-3">
        {/* 搜索 */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索租户名、行政区、账号…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-400 bg-[#f7f8fa] placeholder:text-[#cbd5e1]"
          />
        </div>
        <button
          type="button"
          onClick={handleBulkCopy}
          disabled={filtered.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            bulkCopied
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : "text-[#64748b] border-[#e5e7eb] hover:bg-[#f7f8fa]"
          )}
        >
          {bulkCopied ? <Check size={12} /> : <Copy size={12} />}
          {bulkCopied ? "已复制全部" : "全部复制"}
        </button>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className="flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border border-[#e5e7eb] text-[#64748b] hover:bg-[#f7f8fa] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Download size={12} />
          导出 CSV
        </button>
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
              onClick={() => handleFilterChange(tab.key)}
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

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1080px] text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                <th className="text-left text-xs text-[#94a3b8] font-medium px-5 py-3">租户名称</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">状态</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">到期日</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">管理员账号</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">密码</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-3 py-3">企业数</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-3 py-3">最近登录</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-5 py-3">操作</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-12 text-[#94a3b8] text-sm">
                    暂无符合条件的租户
                  </td>
                </tr>
              ) : (
                paginated.map((t) => (
                  <tr
                    key={t.id}
                    className="border-b border-[#f7f8fa] last:border-0 hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-5 py-3">
                      <div className="font-medium text-[#0f172a]">{t.name}</div>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">数据权限：{t.city}·{t.district}</div>
                    </td>
                    <td className="px-3 py-3">
                      <TenantStatusBadge status={t.status} />
                    </td>
                    <td className="px-3 py-3 text-[#475569] tabular-nums text-xs">
                      {formatDate(t.expiresAt)}
                    </td>
                    <td className="px-3 py-3 font-mono text-xs text-[#475569]">
                      {t.adminUsername}
                    </td>
                    <td className="px-3 py-3">
                      <PasswordCell password={t.adminPassword} />
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums text-[#475569]">
                      {t.stats.companyCount.toLocaleString()}
                    </td>
                    <td className="px-3 py-3 text-right text-[#94a3b8] text-xs">
                      {formatRelativeTime(t.stats.lastLoginAt)}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <CopyCredentialsButton tenant={t} />
                        <Link
                          href={`/ops/tenants/${t.id}`}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                          title="查看详情"
                        >
                          <Eye size={13} />
                        </Link>
                        <button
                          onClick={() => setEditTarget(t)}
                          className="w-7 h-7 rounded-md flex items-center justify-center text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                          title="编辑"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => handleToggleEnabled(t)}
                          className={cn(
                            "w-7 h-7 rounded-md flex items-center justify-center transition-colors",
                            t.enabled
                              ? "text-[#94a3b8] hover:bg-red-50 hover:text-red-500"
                              : "text-emerald-500 hover:bg-emerald-50"
                          )}
                          title={t.enabled ? "禁用" : "启用"}
                        >
                          {t.enabled ? <PowerOff size={13} /> : <Power size={13} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        {totalPages > 1 && (
          <div className="px-5 py-3 border-t border-[#f1f5f9] flex items-center justify-between text-sm text-[#64748b]">
            <span>
              共 {filtered.length} 条，第 {page}/{totalPages} 页
            </span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1.5 rounded-md border border-[#e5e7eb] text-xs hover:bg-[#f7f8fa] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                上一页
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-md border border-[#e5e7eb] text-xs hover:bg-[#f7f8fa] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Drawers */}
      {showAdd && (
        <AddTenantDrawer
          onClose={() => setShowAdd(false)}
          onSaved={reload}
        />
      )}
      {editTarget && (
        <EditTenantDrawer
          tenant={editTarget}
          onClose={() => setEditTarget(null)}
          onSaved={reload}
        />
      )}
    </div>
  );
}
