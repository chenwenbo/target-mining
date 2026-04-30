"use client";
import {
  BarChart3,
  MapPin,
  Target,
  CheckCircle2,
  Microscope,
  TrendingUp,
  AlertOctagon,
  Lightbulb,
  Star,
  Building2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { QUESTION_CATEGORIES } from "@/lib/agent-mock";
import { useAgentStore } from "@/lib/agent/store";

const ICON_MAP: Record<string, LucideIcon> = {
  BarChart3,
  MapPin,
  Target,
  CheckCircle2,
  Microscope,
  TrendingUp,
  AlertOctagon,
  Lightbulb,
  Star,
  Building2,
};

export default function GuidedQuestionGroups() {
  const ask = useAgentStore((s) => s.ask);
  const status = useAgentStore((s) => s.status);

  // 复审能力下线：UI 过滤掉 renewal 分类
  const groups = QUESTION_CATEGORIES.filter((g) => g.key !== "renewal");

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
      {groups.map((group) => (
        <div
          key={group.key}
          className="bg-white border border-[#e5e7eb] rounded-xl p-4 hover:shadow-[0_2px_12px_rgba(15,23,42,0.05)] transition-shadow"
        >
          <div className="text-[12.5px] font-semibold text-[#0f172a] mb-2.5 flex items-center gap-1.5">
            <span className="w-1 h-3.5 bg-blue-500 rounded-full" />
            {group.label}
          </div>
          <ul className="space-y-1">
            {group.questions.map((q) => {
              const Icon = ICON_MAP[q.icon] ?? Lightbulb;
              return (
                <li key={q.id}>
                  <button
                    type="button"
                    disabled={status === "thinking"}
                    onClick={() => ask(q.label, q.id)}
                    className="w-full text-left flex items-start gap-2 px-2 py-1.5 rounded-md text-[13px] text-[#475569] hover:bg-blue-50/60 hover:text-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon size={13} className="mt-0.5 opacity-60 shrink-0" />
                    <span>{q.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
