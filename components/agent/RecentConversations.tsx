"use client";
import { MessageSquare, ChevronRight, Clock } from "lucide-react";
import { useState } from "react";
import { useAgentStore } from "@/lib/agent/store";

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "今天";
  if (diffDays === 1) return "昨天";
  if (diffDays < 7) return `${diffDays}天前`;
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

const PAGE_SIZE = 5;

export default function RecentConversations() {
  const history = useAgentStore((s) => s.history);
  const loadConversation = useAgentStore((s) => s.loadConversation);
  const [expanded, setExpanded] = useState(false);

  if (!history.length) return null;

  const shown = expanded ? history : history.slice(0, PAGE_SIZE);
  const hasMore = history.length > PAGE_SIZE;

  return (
    <div className="mt-8">
      <div className="flex items-center gap-1.5 text-[12.5px] font-medium text-[#94a3b8] mb-2 px-1">
        <Clock size={12} />
        <span>最近对话</span>
      </div>
      <div className="space-y-0.5">
        {shown.map((record) => (
          <button
            key={record.id}
            type="button"
            onClick={() => loadConversation(record.id)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#f1f5f9] text-left transition-colors group"
          >
            <MessageSquare size={14} className="text-[#cbd5e1] flex-shrink-0" />
            <span className="flex-1 text-[13px] text-[#334155] truncate">{record.title}</span>
            <span className="text-[11.5px] text-[#94a3b8] flex-shrink-0 tabular-nums">
              {formatDate(record.updatedAt)}
            </span>
            <ChevronRight
              size={13}
              className="text-[#cbd5e1] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
            />
          </button>
        ))}
      </div>
      {hasMore && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 w-full text-center text-[12px] text-[#94a3b8] hover:text-blue-600 py-1.5 transition-colors"
        >
          {expanded ? "收起" : `查看全部 ${history.length} 条历史对话`}
        </button>
      )}
    </div>
  );
}
