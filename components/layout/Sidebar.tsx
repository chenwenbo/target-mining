"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  UsersRound,
  ClipboardList,
  ClipboardCheck,
  Sparkles,
} from "lucide-react";
import UserSwitcher from "./UserSwitcher";
import { useCurrentPCUser } from "@/lib/account-mock";
import type { LucideIcon } from "lucide-react";
import type { RoleType } from "@/lib/account-mock";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: string;
  title?: string;
}

const REGION_NAV: NavItem[] = [
  { href: "/", label: "驾驶舱", icon: LayoutDashboard, badge: "今日" },
  { href: "/targets", label: "标的池", icon: Target, badge: "246" },
  { href: "/tasks", label: "任务管理", icon: CheckSquare, badge: "10" },
  { href: "/surveys", label: "摸排统计", icon: ClipboardList },
  { href: "/hi-eval", label: "高企测评", icon: ClipboardCheck },
  { href: "/admin/dispatch", label: "摸排小程序", icon: UsersRound, title: "摸排账户分发配置" },
  { href: "/agent", label: "AI 助手", icon: Sparkles },
];

const STREET_NAV: NavItem[] = [
  { href: "/targets", label: "标的池", icon: Target },
  { href: "/tasks", label: "任务管理", icon: CheckSquare },
  { href: "/surveys", label: "摸排统计", icon: ClipboardList },
];

function navForRole(role: RoleType): NavItem[] {
  return role === "region_admin" ? REGION_NAV : STREET_NAV;
}

export default function Sidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user, mounted } = useCurrentPCUser();
  // 首屏 SSR 渲染区域管理员菜单，挂载后才切到真实角色，避免 hydration mismatch
  const items = navForRole(mounted ? user.role : "region_admin");

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
        <div className="px-2">
          {items.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.label}
                href={item.href}
                title={collapsed ? item.title ?? item.label : item.title}
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
      </nav>

      {/* Footer: 用户切换器 */}
      <UserSwitcher collapsed={collapsed} />
    </aside>
  );
}
