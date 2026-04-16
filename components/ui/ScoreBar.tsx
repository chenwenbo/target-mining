import { cn } from "@/lib/cn";

interface Props {
  score: number; // 0-100
  showNumber?: boolean;
  size?: "sm" | "md";
}

function scoreColor(score: number) {
  if (score >= 80) return "bg-emerald-500";
  if (score >= 60) return "bg-blue-500";
  if (score >= 40) return "bg-amber-500";
  return "bg-slate-400";
}

export default function ScoreBar({ score, showNumber = true, size = "md" }: Props) {
  return (
    <div className="flex items-center gap-2">
      {showNumber && (
        <span className={cn("font-bold tabular-nums text-[#0f172a]",
          size === "sm" ? "text-sm w-7" : "text-base w-8"
        )}>{score}</span>
      )}
      <div className={cn("flex-1 bg-[#f1f5f9] rounded-full overflow-hidden",
        size === "sm" ? "h-1.5" : "h-2"
      )}>
        <div
          className={cn("h-full rounded-full transition-all", scoreColor(score))}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  );
}
