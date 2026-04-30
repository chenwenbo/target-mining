"use client";
import Link from "next/link";
import { ExternalLink, FileText } from "lucide-react";
import { cn } from "@/lib/cn";
import type { SourceCard } from "@/lib/agent-mock";

const TAG_TONE: Record<SourceCard["tagColor"], string> = {
  blue: "bg-blue-50 text-blue-700 border-blue-100",
  green: "bg-emerald-50 text-emerald-700 border-emerald-100",
  yellow: "bg-amber-50 text-amber-700 border-amber-100",
  red: "bg-red-50 text-red-700 border-red-100",
  purple: "bg-purple-50 text-purple-700 border-purple-100",
  gray: "bg-[#f1f5f9] text-[#475569] border-[#e5e7eb]",
};

export default function SourceCardList({ sources }: { sources: SourceCard[] }) {
  if (!sources || sources.length === 0) return null;
  return (
    <div className="mt-3 border border-[#e5e7eb] rounded-xl bg-[#fafbfc] overflow-hidden">
      <div className="flex items-center gap-1.5 px-3 py-2 border-b border-[#e5e7eb] text-[12px] font-medium text-[#475569]">
        <FileText size={12} className="opacity-70" />
        来源 · {sources.length}
      </div>
      <ul className="divide-y divide-[#e5e7eb]">
        {sources.map((s) => (
          <li key={s.id} className="px-3 py-2.5 hover:bg-white transition-colors">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "inline-flex items-center px-1.5 py-0.5 rounded text-[10.5px] font-medium border",
                      TAG_TONE[s.tagColor],
                    )}
                  >
                    {s.tag}
                  </span>
                  <span className="text-[13.5px] font-semibold text-[#0f172a] truncate">
                    {s.title}
                  </span>
                </div>
                <div className="text-[11.5px] text-[#94a3b8] mt-1 truncate">{s.subtitle}</div>
                <div className="text-[12px] text-[#64748b] mt-1.5 leading-snug">{s.snippet}</div>
              </div>
              <Link
                href={`/targets/${s.id}`}
                className="shrink-0 inline-flex items-center gap-1 text-[11.5px] text-blue-600 hover:text-blue-700 hover:underline mt-0.5"
                title="查看企业详情"
              >
                详情
                <ExternalLink size={11} />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
