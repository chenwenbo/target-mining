"use client";
import { cn } from "@/lib/cn";
import { LIFECYCLE_META, LIFECYCLE_ORDER, type LifecycleStage } from "./lifecycle";

type Props = {
  counts: Record<LifecycleStage, number>;
  total: number;
  selected: LifecycleStage | "all";
  onSelect: (stage: LifecycleStage | "all") => void;
};

export default function PipelineRibbon({ counts, total, selected, onSelect }: Props) {
  return (
    <div className="grid grid-cols-[110px_repeat(4,1fr)] gap-2 mb-5">
      {/* 全部 */}
      <button
        onClick={() => onSelect("all")}
        className={cn(
          "rounded-xl border bg-white px-4 py-3 text-left transition-all",
          selected === "all"
            ? "border-[#0f172a] ring-2 ring-offset-1 ring-[#0f172a] shadow-sm"
            : "border-[#e5e7eb] hover:border-[#cbd5e1]",
        )}
      >
        <div className="text-xs text-[#94a3b8] font-medium">全部任务</div>
        <div className="text-2xl font-bold text-[#0f172a] tabular-nums leading-tight mt-0.5">
          {total}
        </div>
      </button>

      {/* 4 段 */}
      {LIFECYCLE_ORDER.map((stage, idx) => {
        const meta = LIFECYCLE_META[stage];
        const isSelected = selected === stage;
        const count = counts[stage] ?? 0;
        return (
          <button
            key={stage}
            onClick={() => onSelect(stage)}
            className={cn(
              "relative rounded-xl border bg-white px-4 py-3 text-left transition-all overflow-hidden",
              isSelected
                ? cn("ring-2 ring-offset-1 shadow-sm", meta.ring, "border-transparent")
                : "border-[#e5e7eb] hover:border-[#cbd5e1]",
              isSelected && meta.bg,
            )}
          >
            {/* 顶部彩条 */}
            <div
              className={cn(
                "absolute top-0 left-0 right-0 h-1 bg-gradient-to-r",
                meta.ribbon,
              )}
            />

            {/* 流程序号 + 箭头 */}
            <div className="flex items-center gap-1.5 text-[11px] text-[#94a3b8] font-medium mb-0.5">
              <span className={cn("w-1.5 h-1.5 rounded-full", meta.dot)} />
              <span>步骤 {idx + 1}</span>
            </div>

            <div className="text-xs font-semibold text-[#0f172a]">{meta.label}</div>

            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-bold text-[#0f172a] tabular-nums leading-none">
                {count}
              </span>
              <span className="text-[11px] text-[#94a3b8]">
                {stage === "pool" ? "家" : "条"}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
