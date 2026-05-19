"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  RefreshCw,
  Power,
  PowerOff,
  Check,
} from "lucide-react";
import { cn } from "@/lib/cn";
import EChartsWrapper from "@/components/charts/EChartsWrapper";
import TenantStatusBadge from "@/components/ops/TenantStatusBadge";
import {
  getTenantById,
  resetTenantAdminPassword,
  setTenantEnabled,
  updateTenant,
  type Tenant,
} from "@/lib/ops-mock";
import { getLast6MonthLabels } from "@/lib/ops-stats";

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start py-2.5 border-b border-[#f7f8fa] last:border-0">
      <span className="w-24 text-xs text-[#94a3b8] flex-shrink-0">{label}</span>
      <span className={cn("text-sm text-[#0f172a] flex-1", mono && "font-mono text-xs")}>{value || "—"}</span>
    </div>
  );
}

export default function TenantDetailClient({ id }: { id: string }) {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [mounted, setMounted] = useState(false);
  const [newPwd, setNewPwd] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesSaved, setNotesSaved] = useState(false);

  function reload() {
    const t = getTenantById(id);
    setTenant(t ?? null);
    if (t) setNotes(t.notes);
  }

  useEffect(() => {
    reload();
    setMounted(true);
  }, [id]);

  if (!mounted || !tenant) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-[#94a3b8]">
        {mounted ? "租户不存在" : "加载中…"}
      </div>
    );
  }

  function handleToggleEnabled() {
    if (!tenant) return;
    setTenantEnabled(tenant.id, !tenant.enabled);
    reload();
  }

  function handleResetPassword() {
    if (!tenant) return;
    if (!confirmReset) {
      setConfirmReset(true);
      return;
    }
    const pwd = resetTenantAdminPassword(tenant.id);
    setNewPwd(pwd);
    setConfirmReset(false);
    reload();
  }

  function handleSaveNotes() {
    if (!tenant) return;
    updateTenant(tenant.id, { notes });
    setNotesSaved(true);
    setTimeout(() => setNotesSaved(false), 2000);
  }

  const monthLabels = getLast6MonthLabels();
  const sparklineOption = {
    tooltip: { trigger: "axis" as const },
    xAxis: { type: "category" as const, data: monthLabels, axisLabel: { color: "#94a3b8", fontSize: 10 }, axisLine: { lineStyle: { color: "#e5e7eb" } } },
    yAxis: { type: "value" as const, axisLabel: { color: "#94a3b8", fontSize: 10 }, splitLine: { lineStyle: { color: "#f1f5f9" } }, minInterval: 1 },
    series: [
      {
        type: "line",
        data: tenant.stats.monthlyLogins,
        smooth: true,
        lineStyle: { color: "#f59e0b", width: 2 },
        areaStyle: { color: "rgba(245,158,11,0.08)" },
        itemStyle: { color: "#f59e0b" },
        symbolSize: 5,
        name: "登录次数",
      },
    ],
    grid: { top: 12, right: 12, bottom: 20, left: 36 },
  };

  return (
    <div className="space-y-5 max-w-4xl">
      {/* 面包屑 + 标题 */}
      <div>
        <Link
          href="/ops/tenants"
          className="flex items-center gap-1.5 text-xs text-[#94a3b8] hover:text-amber-600 transition-colors mb-3"
        >
          <ArrowLeft size={12} />
          租户管理
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-[#0f172a]">{tenant.name}</h1>
            <div className="flex items-center gap-2 mt-1.5">
              <TenantStatusBadge status={tenant.status} />
            </div>
          </div>
          <button
            onClick={handleToggleEnabled}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg border transition-colors flex-shrink-0",
              tenant.enabled
                ? "text-red-600 border-red-200 hover:bg-red-50"
                : "text-emerald-600 border-emerald-200 hover:bg-emerald-50"
            )}
          >
            {tenant.enabled ? (
              <><PowerOff size={13} /> 禁用账号</>
            ) : (
              <><Power size={13} /> 启用账号</>
            )}
          </button>
        </div>
      </div>

      {/* 内容卡片 grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* 基本信息 */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">基本信息</h3>
          <InfoRow label="租户名称" value={tenant.name} />
          <InfoRow label="行政区" value={tenant.district} />
          <InfoRow label="城市/省份" value={`${tenant.city} · ${tenant.province}`} />
          <InfoRow label="开通日期" value={tenant.createdAt.slice(0, 10)} />
          <InfoRow label="到期日期" value={tenant.expiresAt} />
          <InfoRow label="联系人" value={tenant.contactName} />
          <InfoRow label="联系电话" value={tenant.contactPhone} />
          <InfoRow label="联系邮箱" value={tenant.contactEmail} />
        </div>

        {/* 管理员账号 */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-3">管理员账号</h3>
          <InfoRow label="姓名" value={tenant.adminDisplayName} />
          <InfoRow label="部门" value={tenant.adminDept} />
          <InfoRow label="用户名" value={tenant.adminUsername} mono />

          {/* 重置密码 */}
          <div className="mt-4">
            {confirmReset ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#64748b]">确认重置密码？此操作无法撤回</span>
                <button
                  onClick={handleResetPassword}
                  className="text-xs px-2.5 py-1 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                >
                  确认重置
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="text-xs px-2.5 py-1 border border-[#e5e7eb] rounded-md hover:bg-[#f7f8fa] transition-colors text-[#475569]"
                >
                  取消
                </button>
              </div>
            ) : (
              <button
                onClick={handleResetPassword}
                className="flex items-center gap-1.5 text-xs text-amber-600 hover:text-amber-700 transition-colors font-medium"
              >
                <RefreshCw size={12} />
                重置密码
              </button>
            )}
            {newPwd && (
              <p className="mt-2 text-xs text-emerald-600 font-medium">
                ✓ 密码已重置为：<span className="font-mono">{newPwd}</span>（请及时告知管理员）
              </p>
            )}
          </div>
        </div>

        {/* 使用统计 */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">使用统计</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            {[
              { label: "企业总数", value: tenant.stats.companyCount.toLocaleString(), unit: "家" },
              { label: "任务总数", value: tenant.stats.taskCount, unit: "条" },
              { label: "走访总数", value: tenant.stats.visitCount, unit: "次" },
              { label: "评估总数", value: tenant.stats.assessmentCount, unit: "份" },
            ].map((item) => (
              <div key={item.label} className="bg-[#f7f8fa] rounded-lg p-3">
                <div className="text-xs text-[#94a3b8] mb-1">{item.label}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-2xl font-bold text-[#0f172a] tabular-nums leading-none">
                    {item.value}
                  </span>
                  <span className="text-xs text-[#94a3b8]">{item.unit}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-[#94a3b8] mb-1">
            最近登录：
            {tenant.stats.lastLoginAt
              ? new Date(tenant.stats.lastLoginAt).toLocaleString("zh-CN")
              : "从未登录"}
          </div>
        </div>

        {/* 活跃趋势 */}
        <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-semibold text-[#0f172a] mb-4">近6个月登录活跃度</h3>
          <EChartsWrapper option={sparklineOption} height={160} />
        </div>
      </div>

      {/* 备注 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-[#0f172a]">备注</h3>
          <button
            onClick={handleSaveNotes}
            className={cn(
              "flex items-center gap-1 text-xs px-2.5 py-1 rounded-md transition-colors",
              notesSaved
                ? "text-emerald-600 bg-emerald-50"
                : "text-amber-600 hover:bg-amber-50"
            )}
          >
            {notesSaved ? <><Check size={11} /> 已保存</> : "保存"}
          </button>
        </div>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="可填写租户背景、合作备忘、跟进记录等…"
          className="w-full px-3 py-2.5 text-sm border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-400 resize-none placeholder:text-[#cbd5e1]"
        />
      </div>
    </div>
  );
}
