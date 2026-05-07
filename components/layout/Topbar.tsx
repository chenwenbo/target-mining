"use client";
import { ChevronDown } from "lucide-react";

export default function Topbar() {
  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-[#e5e7eb] px-6 flex items-center">
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f8fa] border border-[#e5e7eb] rounded-md text-sm text-[#475569] hover:bg-[#f1f5f9] transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          武汉市 · 东西湖区
          <ChevronDown size={12} />
        </button>
        <span className="text-[12px] text-[#94a3b8]">数据更新于 14:28</span>
      </div>
    </header>
  );
}
