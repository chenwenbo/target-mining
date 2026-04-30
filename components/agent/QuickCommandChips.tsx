"use client";
import { Building2, Search, ClipboardList, BarChart3 } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useAgentStore } from "@/lib/agent/store";

interface Chip {
  icon: LucideIcon;
  label: string;
  prompt: string;
}

const CHIPS: Chip[] = [
  {
    icon: Building2,
    label: "推荐标的",
    prompt: "请根据当前标的池数据，推荐最具申报潜力的高企候选企业，并说明推荐理由。",
  },
  {
    icon: Search,
    label: "企业尽调",
    prompt: "请对标的池中的重点企业进行尽职调查分析，包括技术实力、合规状况和申报准备情况。",
  },
  {
    icon: ClipboardList,
    label: "任务分配",
    prompt: "请根据未接触的高潜力企业列表，帮我制定走访任务分配建议，合理分配给各街道负责人。",
  },
  {
    icon: BarChart3,
    label: "统计分析",
    prompt: "请对当前标的池进行全面统计分析，包括企业数量、技术领域分布、街道分布和申报进度。",
  },
];

export default function QuickCommandChips() {
  const setFill = useAgentStore((s) => s.setFill);
  const status = useAgentStore((s) => s.status);

  return (
    <div className="flex flex-wrap gap-2 justify-center">
      {CHIPS.map((c) => {
        const Icon = c.icon;
        return (
          <button
            key={c.label}
            type="button"
            disabled={status === "thinking"}
            onClick={() => setFill(c.prompt)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#e5e7eb] text-[12.5px] text-[#475569] hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Icon size={13} className="opacity-70" />
            <span>{c.label}</span>
          </button>
        );
      })}
    </div>
  );
}
