"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Company } from "@/lib/types";

const PAGE_SIZE = 20;

type Props = {
  companies: Company[];
  onDragStart: (companyId: string) => void;
  onDragEnd: () => void;
};

export default function KanbanPoolColumn({ companies, onDragStart, onDragEnd }: Props) {
  const [limit, setLimit] = useState(PAGE_SIZE);
  const visible = companies.slice(0, limit);
  const hasMore = limit < companies.length;

  return (
    <div className="flex flex-col bg-[#f1f5f9] rounded-xl border border-[#e5e7eb] flex-1 min-w-[260px] overflow-hidden">
      {/* 列头 */}
      <div className="shrink-0 px-4 py-3 border-b border-[#e5e7eb] bg-white rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-slate-400" />
            <span className="text-sm font-semibold text-[#0f172a]">标的池</span>
          </div>
          <span className="text-xs font-bold tabular-nums px-2 py-0.5 rounded-full bg-slate-50 text-slate-700">
            {companies.length.toLocaleString()} 家
          </span>
        </div>
      </div>

      {/* 卡片列表 */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {visible.map((c) => (
          <div
            key={c.id}
            draggable
            onDragStart={(e) => {
              e.dataTransfer.effectAllowed = "move";
              onDragStart(c.id);
            }}
            onDragEnd={onDragEnd}
            className="bg-white rounded-lg border border-[#e5e7eb] shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] hover:shadow-[0_2px_8px_0_rgba(15,23,42,0.08)] hover:border-[#cbd5e1] transition-all cursor-grab active:cursor-grabbing active:opacity-60 p-3 space-y-1.5"
          >
            <Link
              href={`/targets/${c.id}`}
              onClick={(e) => e.stopPropagation()}
              className="block text-[13px] font-semibold text-[#0f172a] hover:text-blue-600 transition-colors leading-snug line-clamp-2"
              title={c.name}
            >
              {c.name}
            </Link>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569]">
                {c.street}
              </span>
              {c.industry && (
                <span className="text-[10px] text-[#94a3b8] truncate max-w-[120px]" title={c.industry}>
                  {c.industry}
                </span>
              )}
            </div>
          </div>
        ))}

        {hasMore && (
          <button
            onClick={() => setLimit((l) => l + PAGE_SIZE)}
            className="w-full py-2 text-xs text-[#64748b] hover:text-[#0f172a] bg-white border border-[#e5e7eb] rounded-lg hover:border-[#cbd5e1] transition-colors flex items-center justify-center gap-1"
          >
            <ArrowRight size={11} className="rotate-90" />
            加载更多（剩余 {companies.length - limit} 家）
          </button>
        )}
      </div>
    </div>
  );
}
