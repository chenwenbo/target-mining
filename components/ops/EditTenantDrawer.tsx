"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { updateTenant, type Tenant } from "@/lib/ops-mock";
import { HUBEI_REGIONS } from "@/lib/types";

interface Props {
  tenant: Tenant;
  onClose: () => void;
  onSaved: () => void;
}

export default function EditTenantDrawer({ tenant, onClose, onSaved }: Props) {
  const [form, setForm] = useState({
    name: tenant.name,
    district: tenant.district,
    province: tenant.province,
    city: tenant.city,
    expiresAt: tenant.expiresAt,
    adminDisplayName: tenant.adminDisplayName,
    adminDept: tenant.adminDept,
    contactName: tenant.contactName,
    contactPhone: tenant.contactPhone,
    contactEmail: tenant.contactEmail,
    notes: tenant.notes,
  });

  function set(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const cities = Object.keys(HUBEI_REGIONS);
  const districts = form.city ? HUBEI_REGIONS[form.city] ?? [] : [];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.city || !form.district) return;
    updateTenant(tenant.id, form);
    onSaved();
    onClose();
  }

  const inputCls =
    "w-full px-3 py-2 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-amber-500 placeholder:text-[#cbd5e1]";
  const labelCls = "block text-xs font-medium text-[#475569] mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/30 backdrop-blur-[1px]" onClick={onClose} />
      <div className="w-[480px] bg-white h-full flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
          <div>
            <h2 className="text-base font-semibold text-[#0f172a]">编辑租户</h2>
            <p className="text-xs text-[#94a3b8] mt-0.5">{tenant.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#94a3b8] hover:bg-[#f7f8fa] transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <form
          id="edit-tenant-form"
          onSubmit={handleSubmit}
          className="flex-1 overflow-y-auto px-6 py-5 space-y-6"
        >
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
                <p className="text-[11px] text-amber-600 mt-1">
                  ⚠ 修改后该租户将看到新区县范围数据，原区县数据不可见
                </p>
              </label>
              <label className="block">
                <span className={labelCls}>到期日 *</span>
                <input
                  required
                  type="date"
                  value={form.expiresAt}
                  onChange={(e) => set("expiresAt", e.target.value)}
                  className={inputCls}
                />
              </label>
            </div>
          </section>

          {/* 管理员信息（账号名和密码在详情页管理）*/}
          <section>
            <h3 className="text-xs font-semibold text-[#94a3b8] uppercase tracking-wider mb-3">
              管理员信息
            </h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className={labelCls}>管理员姓名</span>
                  <input
                    value={form.adminDisplayName}
                    onChange={(e) => set("adminDisplayName", e.target.value)}
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>所属部门</span>
                  <input
                    value={form.adminDept}
                    onChange={(e) => set("adminDept", e.target.value)}
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
                    className={inputCls}
                  />
                </label>
                <label className="block">
                  <span className={labelCls}>电话</span>
                  <input
                    value={form.contactPhone}
                    onChange={(e) => set("contactPhone", e.target.value)}
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
                  className={inputCls}
                />
              </label>
              <label className="block">
                <span className={labelCls}>备注</span>
                <textarea
                  value={form.notes}
                  onChange={(e) => set("notes", e.target.value)}
                  rows={3}
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
            form="edit-tenant-form"
            className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg transition-colors"
          >
            保存更改
          </button>
        </div>
      </div>
    </div>
  );
}
