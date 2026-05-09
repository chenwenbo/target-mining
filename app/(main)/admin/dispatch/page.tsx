"use client";
import { useEffect, useState } from "react";
import {
  Copy,
  Download,
  Plus,
  RotateCcw,
  Check,
  Trash2,
  Pencil,
  X,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  createSurveyAccount,
  deleteSurveyAccount,
  exportAccountsCSV,
  formatAllAccountsForClipboard,
  getSurveyAccounts,
  REGION_LABEL,
  resetSurveyAccountPassword,
  updateSurveyAccount,
  useRoleGuard,
  type SurveyAccount,
} from "@/lib/account-mock";

type ConfirmAction = { type: "reset" | "delete"; id: string };

export default function AccountManagePage() {
  const allowed = useRoleGuard("region_admin");
  const [accounts, setAccounts] = useState<SurveyAccount[]>([]);
  const [mounted, setMounted] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<ConfirmAction | null>(null);

  // 新建表单
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createOrgUnit, setCreateOrgUnit] = useState("");

  // 编辑表单
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editOrgUnit, setEditOrgUnit] = useState("");

  useEffect(() => {
    setAccounts(getSurveyAccounts());
    setMounted(true);
  }, []);

  function refresh() {
    setAccounts(getSurveyAccounts());
  }

  function flashCopied(key: string) {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((k) => (k === key ? null : k)), 1800);
  }

  function copyText(text: string, key: string) {
    if (typeof navigator === "undefined" || !navigator.clipboard) return;
    navigator.clipboard.writeText(text).then(() => flashCopied(key));
  }

  function handleCopyOne(a: SurveyAccount) {
    copyText(`用户名: ${a.username}\n密码: ${a.password}`, `copy-${a.id}`);
  }

  function handleCopyAll() {
    copyText(formatAllAccountsForClipboard(accounts), "copy-all");
  }

  function handleExport() {
    exportAccountsCSV(accounts);
  }

  function handleToggle(id: string, enabled: boolean) {
    updateSurveyAccount(id, { enabled });
    refresh();
  }

  function triggerConfirm(action: ConfirmAction) {
    if (confirmAction?.type === action.type && confirmAction.id === action.id) {
      // 二次确认
      setConfirmAction(null);
      if (action.type === "reset") {
        resetSurveyAccountPassword(action.id);
      } else {
        deleteSurveyAccount(action.id);
      }
      refresh();
    } else {
      setConfirmAction(action);
      window.setTimeout(() => {
        setConfirmAction((c) =>
          c?.type === action.type && c.id === action.id ? null : c,
        );
      }, 3000);
    }
  }

  function handleCreate() {
    if (!createName.trim()) return;
    createSurveyAccount(createName, createOrgUnit);
    setCreateName("");
    setCreateOrgUnit("");
    setShowCreate(false);
    refresh();
  }

  function startEdit(a: SurveyAccount) {
    setEditingId(a.id);
    setEditName(a.displayName);
    setEditOrgUnit(a.orgUnit);
  }

  function commitEdit() {
    if (!editingId || !editName.trim()) return;
    updateSurveyAccount(editingId, {
      displayName: editName,
      orgUnit: editOrgUnit,
    });
    setEditingId(null);
    refresh();
  }

  if (!allowed || !mounted) {
    return (
      <div className="flex items-center justify-center py-32 text-sm text-[#94a3b8]">
        加载中…
      </div>
    );
  }

  const enabledCount = accounts.filter((a) => a.enabled).length;
  const hasAccounts = accounts.length > 0;

  return (
    <div>
      {/* 页头 */}
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-[#0f172a]">摸排账号管理</h1>
          <p className="text-sm text-[#94a3b8] mt-1">
            {REGION_LABEL} · 共 {accounts.length} 个账号 · 已启用 {enabledCount}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyAll}
            disabled={!hasAccounts}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg border transition-colors",
              hasAccounts
                ? "border-[#e5e7eb] text-[#475569] hover:bg-[#f7f8fa] bg-white"
                : "border-[#e5e7eb] text-[#cbd5e1] bg-[#f7f8fa] cursor-not-allowed",
            )}
          >
            {copiedKey === "copy-all" ? (
              <Check size={13} className="text-emerald-500" />
            ) : (
              <Copy size={13} />
            )}
            {copiedKey === "copy-all" ? "已复制" : "复制全部"}
          </button>
          <button
            onClick={handleExport}
            disabled={!hasAccounts}
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 text-sm rounded-lg transition-colors",
              hasAccounts
                ? "bg-[#f7f8fa] border border-[#e5e7eb] text-[#475569] hover:bg-[#eef0f4]"
                : "bg-[#f7f8fa] border border-[#e5e7eb] text-[#cbd5e1] cursor-not-allowed",
            )}
          >
            <Download size={13} /> 导出 CSV
          </button>
          <button
            onClick={() => {
              setShowCreate(true);
              setEditingId(null);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={13} /> 新建账号
          </button>
        </div>
      </div>

      {/* 新建表单（内联展开）*/}
      {showCreate && (
        <div className="mb-4 p-4 bg-blue-50/60 border border-blue-200 rounded-xl">
          <div className="text-sm font-medium text-[#0f172a] mb-3">新建摸排账号</div>
          <div className="flex items-end gap-3 flex-wrap">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#64748b]">
                账号名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="如：网安基地摸排组"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="w-52 px-3 py-1.5 text-sm border border-[#d1d5db] rounded-lg outline-none focus:border-blue-500 bg-white"
                autoFocus
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-[#64748b]">所属单位（选填）</label>
              <input
                type="text"
                placeholder="如：东西湖区科创局"
                value={createOrgUnit}
                onChange={(e) => setCreateOrgUnit(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                className="w-52 px-3 py-1.5 text-sm border border-[#d1d5db] rounded-lg outline-none focus:border-blue-500 bg-white"
              />
            </div>
            <div className="flex items-center gap-2 pb-0.5">
              <button
                onClick={handleCreate}
                disabled={!createName.trim()}
                className={cn(
                  "px-4 py-1.5 text-sm rounded-lg transition-colors",
                  createName.trim()
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-blue-200 text-white cursor-not-allowed",
                )}
              >
                创建
              </button>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setCreateName("");
                  setCreateOrgUnit("");
                }}
                className="px-3 py-1.5 text-sm border border-[#e5e7eb] rounded-lg text-[#64748b] hover:bg-white transition-colors"
              >
                取消
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 账号列表 */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] overflow-hidden">
        {/* 表头 */}
        <div className="grid grid-cols-[40px_220px_160px_160px_120px_auto] items-center gap-3 px-5 py-3 bg-[#f7f8fa] border-b border-[#e5e7eb] text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">
          <div>启用</div>
          <div>账号名称 / 所属单位</div>
          <div>用户名</div>
          <div>密码</div>
          <div>创建时间</div>
          <div className="text-right">操作</div>
        </div>

        {accounts.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-[#94a3b8]">
            <Users size={32} className="mb-3 text-[#cbd5e1]" />
            <div className="text-sm font-medium text-[#475569]">暂无摸排账号</div>
            <div className="text-xs mt-1">点击右上角"新建账号"开始创建</div>
          </div>
        )}

        {accounts.map((a) => {
          const isEditingThis = editingId === a.id;
          const copyKey = `copy-${a.id}`;
          const isResetting =
            confirmAction?.type === "reset" && confirmAction.id === a.id;
          const isDeleting =
            confirmAction?.type === "delete" && confirmAction.id === a.id;

          return (
            <div
              key={a.id}
              className={cn(
                "grid grid-cols-[40px_220px_160px_160px_120px_auto] items-center gap-3 px-5 py-3.5 border-b border-[#f1f5f9] last:border-b-0 transition-colors",
                !a.enabled && "bg-[#fafbfc] opacity-60",
              )}
            >
              {/* 启用 */}
              <label className="flex items-center justify-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={a.enabled}
                  onChange={(e) => handleToggle(a.id, e.target.checked)}
                  className="w-4 h-4 accent-blue-600 cursor-pointer"
                />
              </label>

              {/* 名称 / 单位 */}
              {isEditingThis ? (
                <div className="flex flex-col gap-1.5 col-span-1">
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="账号名称"
                    className="w-full px-2 py-1 text-sm border border-blue-400 rounded outline-none"
                    autoFocus
                  />
                  <input
                    type="text"
                    value={editOrgUnit}
                    onChange={(e) => setEditOrgUnit(e.target.value)}
                    placeholder="所属单位（选填）"
                    className="w-full px-2 py-1 text-xs border border-[#d1d5db] rounded outline-none"
                  />
                </div>
              ) : (
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{a.displayName}</div>
                  {a.orgUnit && (
                    <div className="text-[11px] text-[#94a3b8] mt-0.5">{a.orgUnit}</div>
                  )}
                </div>
              )}

              {/* 用户名 */}
              <div className="font-mono text-xs text-[#0f172a] bg-[#f7f8fa] px-2 py-1 rounded truncate">
                {a.username}
              </div>

              {/* 密码 */}
              <div className="font-mono text-xs text-[#0f172a] bg-[#f7f8fa] px-2 py-1 rounded truncate">
                {a.password}
              </div>

              {/* 创建时间 */}
              <div className="text-[11px] text-[#94a3b8]">
                {a.createdAt.slice(0, 10)}
              </div>

              {/* 操作 */}
              <div className="flex items-center justify-end gap-1.5">
                {isEditingThis ? (
                  <>
                    <button
                      onClick={commitEdit}
                      disabled={!editName.trim()}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-40"
                    >
                      <Check size={11} /> 保存
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs border border-[#e5e7eb] rounded-md text-[#64748b] hover:bg-[#f7f8fa]"
                    >
                      <X size={11} />
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => handleCopyOne(a)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-[#e5e7eb] rounded-md text-[#475569] hover:bg-[#f7f8fa] transition-colors"
                    >
                      {copiedKey === copyKey ? (
                        <>
                          <Check size={11} className="text-emerald-500" />
                          <span className="text-emerald-600">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy size={11} /> 复制
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => startEdit(a)}
                      className="flex items-center gap-1 px-2 py-1.5 text-xs border border-[#e5e7eb] rounded-md text-[#475569] hover:bg-[#f7f8fa] transition-colors"
                    >
                      <Pencil size={11} />
                    </button>

                    <button
                      onClick={() => triggerConfirm({ type: "reset", id: a.id })}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-md border transition-colors",
                        isResetting
                          ? "border-amber-300 bg-amber-50 text-amber-700"
                          : "border-[#e5e7eb] text-[#475569] hover:bg-[#f7f8fa]",
                      )}
                    >
                      <RotateCcw size={11} />
                      {isResetting ? "确认重置" : "重置密码"}
                    </button>

                    <button
                      onClick={() => triggerConfirm({ type: "delete", id: a.id })}
                      className={cn(
                        "flex items-center gap-1 px-2 py-1.5 text-xs rounded-md border transition-colors",
                        isDeleting
                          ? "border-red-300 bg-red-50 text-red-600"
                          : "border-[#e5e7eb] text-[#94a3b8] hover:text-red-500 hover:border-red-200 hover:bg-red-50",
                      )}
                    >
                      <Trash2 size={11} />
                      {isDeleting && <span>确认删除</span>}
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
