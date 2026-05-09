import { cn } from "@/lib/cn";
import type { TenantStatus } from "@/lib/ops-mock";

const STATUS_CONFIG: Record<TenantStatus, { label: string; className: string }> = {
  active: { label: "活跃", className: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  trial: { label: "试用中", className: "bg-blue-50 text-blue-700 border-blue-200" },
  expired: { label: "已到期", className: "bg-amber-50 text-amber-700 border-amber-200" },
  disabled: { label: "已禁用", className: "bg-slate-50 text-slate-500 border-slate-200" },
};

export default function TenantStatusBadge({ status }: { status: TenantStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border",
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  );
}
