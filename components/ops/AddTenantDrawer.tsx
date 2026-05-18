"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { addTenant, generateTenantPassword } from "@/lib/ops-mock";
import { HUBEI_REGIONS, QUAL_TYPE_META, QUAL_TYPES, type QualificationType } from "@/lib/types";

interface Props {
  onClose: () => void;
  onSaved: () => void;
}

export default function AddTenantDrawer({ onClose, onSaved }: Props) {
  const today = new Date().toISOString().slice(0, 10);
  const oneYearLater = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10);

  const [form, setForm] = useState({
    name: "",
    district: "",
    province: "湖北省",
    city: "",
    expiresAt: oneYearLater,
    adminUsername: "",
    adminPassword: generateTenantPassword(),
    adminDisplayName: "",
    adminDept: "",
    contactName: "",
    contactPhone: "",
    contactEmail: "",
    notes: "",
    modules: ["high_tech"] as QualificationType[],
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const cities = Object.keys(HUBEI_REGIONS);
  const districts = form.city ? HUBEI_REGIONS[form.city] ?? [] : [];

  function toggleModule(m: QualificationType) {
    setForm((prev) => {
      const has = prev.modules.includes(m);
      const next = has ? prev.modules.filter((x) => x !== m) : [...prev.modules, m];
      return { ...prev, modules: next };
    });
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.city || !form.district) return;
    if (form.modules.length === 0) return;
    addTenant({
      ...form,
      enabled: true,
      status: "active",
      createdAt: new Date().toISOString(),
      stats: {
        companyCount: 0,
        taskCount: 0,
        visitCount: 0,
        assessmentCount: 0,
        lastLoginAt: null,
        monthlyLogins: [0, 0, 0, 0, 0, 0],
      },
    });
    onSaved();
    onClose();
  }

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-500 placeholder:text-[#cbd5e1]";
  const labelCls = "block text-xs font-medium text-[#475569] mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="flex-1 bg-black/30 backdrop-blur-[1px]"
        onClick={onClose}
      />
      {/* Drawer */}
      <div className="w-[480px] bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
          <h2 className="text-base font-semibold text-[#0f172a]">新增租户</h2>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#94a3b8] hover:bg-[#f7f8fa] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form id="add-tenant-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* 基本信息 */}
          <section>
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              基本信息
            </h3>
            <div className="space-y-3">
              <label className="block">
                <span className={labelCls}>租户名称 *</span>
                <input
                  required
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="如：武汉市·洪山区"
                  className={inputCls}
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>省份</span>
                  <input
                    value={form.province}
                    readOnly
                    className={`${inputCls} bg-[#f7f8fa] text-[#94a3b8]`}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>数据权限·城市 *</span>
                  <select
                    required
                    value={form.city}
                    onChange={(e) => { set("city", e.target.value); set("district", ""); }}
                    className={inputCls}
                  >
                    <option value="">-- 请选择城市 --</option>
                    {cities.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </label>
              </div>
              <label className="block">
                <span className={labelCls}>数据权限·区县 *</span>
                <select
                  required
                  value={form.district}
                  onChange={(e) => set("district", e.target.value)}
                  disabled={!form.city}
                  className={`${inputCls} disabled:bg-[#f7f8fa] disabled:text-[#cbd5e1]`}
                >
                  <option value="">-- 请选择区县 --</option>
                  {districts.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
                <p className="text-[11px] text-[#94a3b8] mt-1">
                  该租户登录后仅能看到此区县范围内的企业、任务、走访等数据
                </p>
              </label>
              <label className="block">
                <span className={labelCls}>到期日 *</span>
                <input
                  required
                  type="date"
                  value={form.expiresAt}
                  min={today}
                  onChange={(e) => set("expiresAt", e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>
          </section>

          {/* 启用模块 */}
          <section>
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              启用模块
            </h3>
            <div className="space-y-2">
              {QUAL_TYPES.map((m) => {
                const meta = QUAL_TYPE_META[m];
                const checked = form.modules.includes(m);
                return (
                  <label key={m} className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleModule(m)}
                      className="mt-0.5 accent-amber-600"
                    />
                    <div>
                      <div className="text-sm text-[#0f172a] group-hover:text-amber-700 transition-colors">
                        {meta.label}
                      </div>
                      <div className="text-[11px] text-[#94a3b8]">
                        {meta.ministry} · {m === "high_tech" ? "科技部认定" : m === "innovative_sme" ? "省级入库" : m === "specialized_sme" ? "省级认定" : "国家级认定"}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
            {form.modules.length === 0 && (
              <p className="text-[11px] text-red-500 mt-2">至少选择一个模块</p>
            )}
          </section>

          {/* 管理员账号 */}
          <section>
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              管理员账号
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>用户名 *</span>
                  <input
                    required
                    value={form.adminUsername}
                    onChange={(e) => set("adminUsername", e.target.value)}
                    placeholder="wh-hs-admin-01"
                    className={`${inputCls} font-mono`}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>密码</span>
                  <input
                    value={form.adminPassword}
                    onChange={(e) => set("adminPassword", e.target.value)}
                    className={`${inputCls} font-mono`}
                  />
                </label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>管理员姓名</span>
                  <input
                    value={form.adminDisplayName}
                    onChange={(e) => set("adminDisplayName", e.target.value)}
                    placeholder="李主任"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>所属部门</span>
                  <input
                    value={form.adminDept}
                    onChange={(e) => set("adminDept", e.target.value)}
                    placeholder="科技局"
                    className={inputCls}
                  />
                </label>
              </div>
            </div>
          </section>

          {/* 联系人信息 */}
          <section>
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              联系人信息
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>联系人</span>
                  <input
                    value={form.contactName}
                    onChange={(e) => set("contactName", e.target.value)}
                    placeholder="张局长"
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>电话</span>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
                    placeholder="027-83888001"
                    className={inputCls}
                  />
                </label>
              </div>
              <label className="block">
                <span className={labelCls}>邮箱</span>
                <input
                  type="email"
                  value={form.contactEmail}
                  onChange={(e) => set("contactEmail", e.target.value)}
                  placeholder="zhangju@gov.cn"
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>备注</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
                  placeholder="可填写项目背景、特殊要求等"
                  className={`${inputCls} resize-none`}
                />
              </label>
            </div>
          </section>
        </form>

        <div className="px-6 py-4 border-t border-[#e5e7eb] flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-[#475569] border border-[#e5e7eb] rounded-lg hover:bg-[#f7f8fa] transition-colors"
          >
            取消
          </button>
          <button
            type="submit"
            form="add-tenant-form"
            className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            创建租户
          </button>
        </div>
      </div>
    </div>
  );
}
