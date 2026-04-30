"use client";
import { useState } from "react";
import Link from "next/link";
import { Zap, AlertCircle, Check, X, Loader2 } from "lucide-react";
import { executeAction, type AgentAction } from "@/lib/agent/actions";

interface Props {
  actions: AgentAction[];
}

export default function ActionChips({ actions }: Props) {
  const [pending, setPending] = useState<AgentAction | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ summary: string; navigateTo?: string } | null>(null);

  async function confirm() {
    if (!pending) return;
    setBusy(true);
    try {
      const r = await executeAction(pending);
      setDone({ summary: r.summary, navigateTo: r.navigateTo });
    } finally {
      setBusy(false);
      setPending(null);
    }
  }

  if (!actions || actions.length === 0) return null;

  return (
    <>
      <div className="mt-3">
        <div className="text-[11.5px] font-medium text-[#94a3b8] mb-1.5 flex items-center gap-1">
          <Zap size={11} />
          行动建议
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((a) => (
            <button
              key={a.id}
              type="button"
              onClick={() => setPending(a)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 border border-amber-200 text-[12.5px] text-amber-800 hover:bg-amber-100 transition-colors"
            >
              → {a.label}
            </button>
          ))}
        </div>
      </div>

      {done && (
        <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200 text-[12.5px] text-emerald-800">
          <Check size={13} />
          <span className="flex-1">{done.summary}</span>
          {done.navigateTo && (
            <Link
              href={done.navigateTo}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-white border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              onClick={() => setDone(null)}
            >
              查看任务
            </Link>
          )}
          <button onClick={() => setDone(null)} className="text-emerald-600 hover:text-emerald-800">
            <X size={13} />
          </button>
        </div>
      )}

      {pending && (
        <div
          className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
          onClick={() => !busy && setPending(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-amber-700" />
              </div>
              <div className="flex-1">
                <h3 className="text-[15px] font-semibold text-[#0f172a]">{pending.confirm.title}</h3>
                {pending.confirm.warning && (
                  <p className="text-[12.5px] text-[#64748b] mt-1">{pending.confirm.warning}</p>
                )}
              </div>
            </div>

            <div className="bg-[#f8fafc] rounded-lg border border-[#e5e7eb] p-3 max-h-48 overflow-y-auto mb-4">
              <div className="text-[11.5px] text-[#94a3b8] mb-1.5">受影响企业</div>
              <ul className="space-y-1">
                {pending.confirm.affected.map((name, i) => (
                  <li key={i} className="text-[13px] text-[#0f172a] flex items-center gap-2">
                    <span className="w-1 h-1 rounded-full bg-blue-500" />
                    {name}
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                type="button"
                disabled={busy}
                onClick={() => setPending(null)}
                className="px-4 py-1.5 text-[13px] rounded-lg border border-[#e5e7eb] text-[#475569] hover:bg-[#f7f8fa] disabled:opacity-50"
              >
                取消
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={confirm}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-[13px] rounded-lg bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {busy && <Loader2 size={13} className="animate-spin" />}
                确认执行
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
