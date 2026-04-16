import { cn } from "@/lib/cn";
import { getTierConfig } from "@/lib/tiers";
import type { Tier } from "@/lib/types";

interface Props {
  tier: Tier;
  showDesc?: boolean;
  size?: "sm" | "md";
}

export default function TierBadge({ tier, showDesc = false, size = "md" }: Props) {
  const cfg = getTierConfig(tier);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 font-semibold rounded-full border",
        cfg.bg, cfg.color, cfg.border,
        size === "sm" ? "text-[11px] px-2 py-0.5" : "text-xs px-2.5 py-1"
      )}
    >
      {cfg.label}
      {showDesc && <span className="font-normal opacity-75">· {cfg.desc}</span>}
    </span>
  );
}
