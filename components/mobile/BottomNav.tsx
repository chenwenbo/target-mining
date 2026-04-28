"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, BarChart2, User } from "lucide-react";

const tabs = [
  { label: "我的任务", href: "/mobile/tasks", icon: ClipboardList },
  { label: "走访统计", href: "/mobile/stats", icon: BarChart2 },
  { label: "我的", href: "/mobile/profile", icon: User },
];

export default function BottomNav() {
  const pathname = usePathname();

  // Focused workflows (走访表单流程) hide the global tab bar.
  if (pathname.includes("/visit")) return null;

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-14 bg-white border-t border-gray-200 flex z-50">
      {tabs.map(({ label, href, icon: Icon }) => {
        const active = pathname === href || (href !== "/mobile" && pathname.startsWith(href) && href.split("/").length >= pathname.split("/").length);
        const isTasksTab = href === "/mobile/tasks";
        const active2 = isTasksTab
          ? pathname.startsWith("/mobile/tasks")
          : pathname === href;

        return (
          <Link
            key={href}
            href={href}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] transition-colors ${
              active2
                ? "text-blue-600"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            <Icon size={20} strokeWidth={active2 ? 2.5 : 1.8} />
            <span className="leading-none">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
