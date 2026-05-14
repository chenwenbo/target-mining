"use client";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Send, X, CheckCircle2, Users } from "lucide-react";
import { getScopedSurveyAccounts, surveyAccountToVisitor, type SurveyAccount } from "@/lib/account-mock";
import type { Visitor } from "@/lib/types";
import { cn } from "@/lib/cn";

interface DispatchTarget {
  id: string;
  name: string;
  street: string;
}

interface Props {
  targets: DispatchTarget[];
  onClose: () => void;
  onConfirm: (assignee: Visitor) => void;
}

export default function DispatchModal({ targets, onClose, onConfirm }: Props) {
  const [accounts, setAccounts] = useState<SurveyAccount[]>([]);
  const [selected, setSelected] = useState<Visitor | null>(null);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setAccounts(getScopedSurveyAccounts());
  }, []);

  const candidates = useMemo(() => accounts.filter((a) => a.enabled), [accounts]);

  function handleConfirm() {
    if (!selected) return;
    onConfirm(selected);
    setDone(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-xl w-[420px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2 text-[#0f172a] font-semibold text-sm">
            <Send size={14} className="text-blue-600" />
            派发任务
          </div>
          <button onClick={onClose} className="text-[#94a3b8] hover:text-[#475569] transition-colors">
            <X size={16} />
          </button>
        </div>

        {done ? (
          <div className="flex flex-col items-center justify-center py-10 px-6 gap-3">
            <CheckCircle2 size={40} className="text-emerald-500" />
            <p className="text-sm font-medium text-[#0f172a]">派发成功</p>
            <p className="text-xs text-[#94a3b8] text-center">
              已将 {targets.length} 家企业派发给 {selected?.name}
              {selected?.dept && selected.dept !== selected.name ? `（${selected.dept}）` : ""}
            </p>
            <button
              onClick={onClose}
              className="mt-2 px-5 py-2 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors"
            >
              完成
            </button>
          </div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* Company list */}
            <div>
              <p className="text-xs text-[#94a3b8] mb-2">派发企业（{targets.length} 家）</p>
              <div className="space-y-1 max-h-28 overflow-y-auto">
                {targets.map((t) => (
                  <div key={t.id} className="flex items-center gap-2 px-3 py-1.5 bg-[#f7f8fa] rounded-lg">
                    <span className="text-xs text-[#0f172a] font-medium flex-1 truncate">{t.name}</span>
                    <span className="text-[11px] text-[#94a3b8] shrink-0">{t.street}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Assignee selection */}
            <div>
              <p className="text-xs text-[#94a3b8] mb-2">选择摸排账号</p>
              {candidates.length === 0 ? (
                <div className="px-3 py-4 bg-amber-50/60 border border-amber-200 rounded-lg flex items-start gap-2 text-xs text-amber-800">
                  <Users size={13} className="mt-0.5 flex-shrink-0" />
                  <div className="flex-1 leading-relaxed">
                    暂无可用的摸排账号，请先到{" "}
                    <Link href="/admin/dispatch" onClick={onClose} className="underline font-medium">
                      摸排账号管理
                    </Link>{" "}
                    页新建账号后再派发。
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {candidates.map((a) => {
                    const v = surveyAccountToVisitor(a);
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelected(v)}
                        className={cn(
                          "flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all",
                          selected?.id === v.id
                            ? "border-blue-500 bg-blue-50 ring-1 ring-blue-400"
                            : "border-[#e5e7eb] bg-white hover:bg-[#f7f8fa]",
                        )}
                      >
                        <span className="text-xs font-semibold text-[#0f172a]">{a.displayName}</span>
                        {a.orgUnit && (
                          <span className="text-[11px] text-[#94a3b8] mt-0.5 truncate w-full">
                            {a.orgUnit}
                          </span>
                        )}
                        <span className="text-[11px] text-[#cbd5e1] mt-0.5 font-mono truncate w-full">
                          {a.username}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            {/* Actions */}
            <div className="flex justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                className="px-4 py-2 text-xs border border-[#e5e7eb] rounded-lg text-[#475569] hover:bg-[#f7f8fa] transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                disabled={!selected}
                className={cn(
                  "flex items-center gap-1.5 px-4 py-2 text-xs rounded-lg font-medium transition-colors",
                  selected
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-[#e5e7eb] text-[#94a3b8] cursor-not-allowed",
                )}
              >
                <Send size={11} /> 确认派发
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
