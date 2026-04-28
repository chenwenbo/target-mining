"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from "lucide-react";

const NAV_ITEMS = [
  {
    section: "工作台",
    items: [
      { href: "/", label: "驾驶舱", icon: LayoutDashboard, badge: "今日" },
      { href: "/targets", label: "标的池", icon: Target, badge: "246" },
      { href: "/renewal", label: "复审管理", icon: RefreshCcw, badge: "38" },
      { href: "/tasks", label: "任务管理", icon: CheckSquare, badge: "10" },
    ],
  },
  {
    section: "智能分析",
    items: [
      { href: "/agent", label: "AI 助手", icon: Sparkles, badge: "NEW" },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex-shrink-0 bg-white border-r border-[#e5e7eb] flex flex-col h-full transition-all duration-200",
        collapsed ? "w-[60px]" : "w-[220px]"
      )}
    >
      {/* Logo */}
      <div className="px-3 py-5 border-b border-[#e5e7eb] flex items-center gap-3 relative">
        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          TM
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-[#0f172a] leading-tight whitespace-nowrap">标的挖掘</div>
            <div className="text-[11px] text-[#94a3b8] leading-tight mt-0.5 whitespace-nowrap">高企申报 · v0.1</div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-white border border-[#e5e7eb] flex items-center justify-center text-[#94a3b8] hover:text-[#475569] hover:border-[#cbd5e1] transition-colors shadow-sm z-10"
          )}
          title={collapsed ? "展开菜单" : "收起菜单"}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="px-2 mb-1">
            {!collapsed && (
              <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide px-2 py-2 whitespace-nowrap">
                {section.section}
              </div>
            )}
            {collapsed && <div className="py-1" />}
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
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm mb-0.5 transition-colors",
                    collapsed && "justify-center px-0",
                    active
                      ? "bg-blue-50 text-blue-700 font-medium"
                      : "text-[#475569] hover:bg-[#f7f8fa] hover:text-[#0f172a]"
                  )}
                >
                  <Icon size={15} className="flex-shrink-0 opacity-80" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 whitespace-nowrap">{item.label}</span>
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
                    </>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className={cn("p-4 border-t border-[#e5e7eb] flex items-center gap-2.5", collapsed && "justify-center p-3")}>
        <div className="w-7 h-7 flex-shrink-0 rounded-full bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-[11px] font-semibold">
          李
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-xs font-medium text-[#0f172a] whitespace-nowrap">李明</div>
            <div className="text-[11px] text-[#94a3b8] whitespace-nowrap">科创局 · 高新处</div>
          </div>
        )}
      </div>
    </aside>
  );
}
