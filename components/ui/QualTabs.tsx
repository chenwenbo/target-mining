"use client";

import { useQualStore } from "@/lib/qual-store";
import { QUAL_TYPES, QUAL_TYPE_META, type QualificationType } from "@/lib/types";
import { cn } from "@/lib/cn";

const COLOR_MAP: Record<
  string,
  { active: string; inactive: string; dot: string }
> = {
  blue:   { active: "border-blue-600 text-blue-700 bg-blue-50/50",     inactive: "border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]", dot: "bg-blue-500"   },
  violet: { active: "border-violet-600 text-violet-700 bg-violet-50/50", inactive: "border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]", dot: "bg-violet-500" },
  amber:  { active: "border-amber-500 text-amber-700 bg-amber-50/50",   inactive: "border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]", dot: "bg-amber-500"  },
  rose:   { active: "border-rose-600 text-rose-700 bg-rose-50/50",      inactive: "border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]", dot: "bg-rose-500"   },
};

interface Props {
  className?: string;
  variant?: "page" | "topbar";
}

export default function QualTabs({ className, variant = "page" }: Props) {
  const { activeQual, enabledModules, setActiveQual } = useQualStore();
  const sortedModules = QUAL_TYPES.filter((q) => enabledModules.includes(q));

  if (enabledModules.length <= 1) return null;

  if (variant === "topbar") {
    return (
      <div className={cn("flex items-stretch h-full", className)}>
        {sortedModules.map((q: QualificationType) => {
          const meta = QUAL_TYPE_META[q];
          const colors = COLOR_MAP[meta.color] ?? COLOR_MAP.blue;
          const isActive = q === activeQual;
          return (
            <button
              key={q}
              onClick={() => setActiveQual(q)}
              className={cn(
                "flex items-center gap-1.5 px-3 h-full text-sm font-medium border-b-2 -mb-px transition-colors",
                isActive ? colors.active : colors.inactive
              )}
            >
              <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors.dot)} />
              {meta.label}
              <span className="text-[10px] text-[#94a3b8] font-normal ml-0.5">
                {meta.ministry}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-0 border-b border-[#e5e7eb] mb-5", className)}>
      {sortedModules.map((q: QualificationType) => {
        const meta = QUAL_TYPE_META[q];
        const colors = COLOR_MAP[meta.color] ?? COLOR_MAP.blue;
        const isActive = q === activeQual;
        return (
          <button
            key={q}
            onClick={() => setActiveQual(q)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors rounded-t",
              isActive ? colors.active : colors.inactive
            )}
          >
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", colors.dot)} />
            {meta.label}
            <span className="text-[10px] text-[#94a3b8] font-normal ml-0.5">
              {meta.ministry}
            </span>
          </button>
        );
      })}
    </div>
  );
}
