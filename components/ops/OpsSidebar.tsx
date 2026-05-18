"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const OPS_NAV: NavItem[] = [
  { href: "/ops/tenants", label: "租户管理", icon: Building2 },
  { href: "/ops/leads", label: "留资记录", icon: ClipboardList },
];

export default function OpsSidebar() {
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
        <div className="w-8 h-8 flex-shrink-0 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
          OP
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <div className="text-sm font-semibold text-[#0f172a] leading-tight whitespace-nowrap">
              运营管理后台
            </div>
            <div className="text-[11px] text-[#94a3b8] leading-tight mt-0.5 whitespace-nowrap">
              SaaS 平台 · v0.1
            </div>
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
        <div className="px-2">
          {OPS_NAV.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn(
                  "flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm mb-0.5 transition-colors",
                  collapsed && "justify-center px-0",
                  active
                    ? "bg-amber-50 text-amber-700 font-medium"
                    : "text-[#475569] hover:bg-[#f7f8fa] hover:text-[#0f172a]"
                )}
              >
                <Icon size={15} className="flex-shrink-0 opacity-80" />
                {!collapsed && (
                  <span className="flex-1 whitespace-nowrap">{item.label}</span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </aside>
  );
}
