"use client";

import { useEffect, useState } from "react";
import { Check, Download, Search, X } from "lucide-react";
import Papa from "papaparse";
import { cn } from "@/lib/cn";

interface LeadRecord {
  name: string;
  unit: string;
  phone: string;
  city?: string;
  district?: string;
  from?: string;
  source?: string;
  submittedAt: string;
}

const PAGE_SIZE = 15;

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function getLeads(): LeadRecord[] {
  try {
    const raw = localStorage.getItem("landing_leads");
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function getSourceLabel(lead: LeadRecord): string {
  if (lead.source === "final_cta") return "底部申请";
  if (lead.from) return `解锁名单 · ${lead.from}`;
  return "解锁名单";
}

export default function LeadsClient() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [exportCopied, setExportCopied] = useState(false);

  useEffect(() => {
    setLeads(getLeads());
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  const filtered = leads.filter((l) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      l.name?.toLowerCase().includes(q) ||
      l.unit?.toLowerCase().includes(q) ||
      l.phone?.includes(q) ||
      l.city?.includes(q) ||
      l.district?.includes(q)
    );
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function handleSearch(q: string) {
    setQuery(q);
    setPage(1);
  }

  function handleExportCSV() {
    const rows = filtered.map((l) => ({
      姓名: l.name,
      所在单位: l.unit ?? "",
      手机号: l.phone,
      城市: l.city ?? "",
      区县: l.district ?? "",
      来源渠道: l.from ?? "",
      提交类型: l.source === "final_cta" ? "底部申请" : "解锁名单",
      提交时间: formatDateTime(l.submittedAt),
    }));
    const csv = Papa.unparse(rows, { header: true });
    const bom = "﻿";
    const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `留资列表-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportCopied(true);
    setTimeout(() => setExportCopied(false), 2000);
  }

  return (
    <div className="space-y-5">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-[#0f172a]">留资记录</h1>
          <p className="text-sm text-[#64748b] mt-1">
            Landing 页面共收集 <span className="font-medium text-[#0f172a]">{leads.length}</span> 条留资信息
          </p>
        </div>
      </div>

      {/* 过滤栏 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]" />
          <input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="搜索姓名、单位、手机号、城市…"
            className="w-full pl-8 pr-3 py-2 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-400 bg-[#f7f8fa] placeholder:text-[#cbd5e1]"
          />
          {query && (
            <button
              onClick={() => handleSearch("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#cbd5e1] hover:text-[#94a3b8]"
            >
              <X size={12} />
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={handleExportCSV}
          disabled={filtered.length === 0}
          className={cn(
            "flex items-center gap-1.5 px-3 py-2 text-xs rounded-lg border transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
            exportCopied
              ? "text-emerald-600 bg-emerald-50 border-emerald-200"
              : "text-[#64748b] border-[#e5e7eb] hover:bg-[#f7f8fa]"
          )}
        >
          {exportCopied ? <Check size={12} /> : <Download size={12} />}
          {exportCopied ? "已导出" : "导出 CSV"}
        </button>
      </div>

      {/* 表格 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead>
              <tr className="border-b border-[#f1f5f9] bg-[#fafafa]">
                <th className="text-left text-xs text-[#94a3b8] font-medium px-5 py-3">姓名</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">所在单位</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">手机号</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">城市 / 区县</th>
                <th className="text-left text-xs text-[#94a3b8] font-medium px-3 py-3">来源</th>
                <th className="text-right text-xs text-[#94a3b8] font-medium px-5 py-3">提交时间</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-16 text-[#94a3b8] text-sm">
                    {leads.length === 0 ? "暂无留资记录" : "暂无符合条件的记录"}
                  </td>
                </tr>
              ) : (
                paginated.map((l, i) => (
                  <tr
                    key={i}
                    className="border-b border-[#f7f8fa] last:border-0 hover:bg-[#fafafa] transition-colors"
                  >
                    <td className="px-5 py-3 font-medium text-[#0f172a]">{l.name || "—"}</td>
                    <td className="px-3 py-3 text-[#475569]">{l.unit || "—"}</td>
                    <td className="px-3 py-3 font-mono text-xs text-[#475569]">{l.phone || "—"}</td>
                    <td className="px-3 py-3 text-[#475569] text-xs">
                      {l.city || l.district
                        ? [l.city, l.district].filter(Boolean).join(" · ")
                        : "—"}
                    </td>
                    <td className="px-3 py-3">
                      <span
                        className={cn(
                          "inline-block px-2 py-0.5 rounded text-[11px] font-medium",
                          l.source === "final_cta"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-amber-50 text-amber-700"
                        )}
                      >
                        {getSourceLabel(l)}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right tabular-nums text-xs text-[#94a3b8]">
                      {formatDateTime(l.submittedAt)}
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
    </div>
  );
}
