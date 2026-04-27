import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

interface SubItem {
  label: string;
  value: string | number;
  unit?: string;
}

interface Props {
  label: string;
  value: string | number;
  unit?: string;
  delta?: string;
  deltaUp?: boolean;
  icon?: LucideIcon;
  iconColor?: string;
  iconBg?: string;
  subItems?: SubItem[];
}

export default function KPICard({
  label, value, unit, delta, deltaUp = true, icon: Icon, iconColor, iconBg, subItems,
}: Props) {
  return (
    <div className="bg-white rounded-xl border border-[#e5e7eb] p-5 shadow-[0_1px_2px_0_rgba(15,23,42,0.04)] relative overflow-hidden">
      {Icon && (
        <div className={cn("absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
          <Icon size={15} className={iconColor} />
        </div>
      )}
      <div className="text-xs text-[#94a3b8] font-medium mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1.5">
        <span className="text-3xl font-bold text-[#0f172a] tabular-nums leading-none">{value}</span>
        {unit && <span className="text-sm text-[#94a3b8]">{unit}</span>}
      </div>
      {subItems && subItems.length > 0 && (
        <div className="mt-3 flex gap-3 border-t border-[#f1f5f9] pt-3">
          {subItems.map((item) => (
            <div key={item.label} className="flex-1">
              <div className="text-[10px] text-[#94a3b8] mb-0.5">{item.label}</div>
              <div className="flex items-baseline gap-0.5">
                <span className="text-base font-semibold text-[#0f172a] tabular-nums leading-none">{item.value}</span>
                {item.unit && <span className="text-[10px] text-[#94a3b8]">{item.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}
      {delta && (
        <div className="mt-2.5 text-xs text-[#94a3b8] flex items-center gap-1">
          <span className={cn("font-semibold", deltaUp ? "text-emerald-600" : "text-amber-600")}>
            {deltaUp ? "↑" : "▲"} {delta}
          </span>
        </div>
      )}
    </div>
  );
}
