"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  SlidersHorizontal,
  RefreshCcw,
} from "lucide-react";

const NAV_ITEMS = [
  {
    section: "工作台",
    items: [
      { href: "/", label: "驾驶舱", icon: LayoutDashboard, badge: "今日" },
      { href: "/targets", label: "标的池", icon: Target, badge: "246" },
      { href: "/renewal", label: "复审管理", icon: RefreshCcw, badge: "38" },
      { href: "/tasks", label: "任务管理", icon: CheckSquare, badge: "10" },
      { href: "/model", label: "算法模型", icon: SlidersHorizontal },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-[220px] flex-shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-[#e5e7eb] flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          TM
        </div>
        <div>
          <div className="text-sm font-semibold text-[#0f172a] leading-tight">标的挖掘</div>
          <div className="text-[11px] text-[#94a3b8] leading-tight mt-0.5">高企申报 · v0.1</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV_ITEMS.map((section) => (
            <div key={section.section} className="px-3 mb-1">
              <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide px-2 py-2">
                {section.section}
              </div>
              {section.items.map((item) => {
                const Icon = item.icon;
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm mb-0.5 transition-colors",
                      active
                        ? "bg-blue-50 text-blue-700 font-medium"
                        : "text-[#475569] hover:bg-[#f7f8fa] hover:text-[#0f172a]"
                    )}
                  >
                    <Icon size={15} className="flex-shrink-0 opacity-80" />
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span
                        className={cn(
                          "text-[11px] px-1.5 py-0.5 rounded-full font-medium",
                          active
                            ? "bg-white text-blue-700"
                            : "bg-[#f1f5f9] text-[#64748b]"
                        )}
                      >
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-[#e5e7eb] flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-[11px] font-semibold">
          李
        </div>
        <div>
          <div className="text-xs font-medium text-[#0f172a]">李明</div>
          <div className="text-[11px] text-[#94a3b8]">科创局 · 高新处</div>
        </div>
      </div>
    </aside>
  );
}
