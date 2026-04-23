"use client";
import { Search, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Topbar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/targets?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <header className="h-14 flex-shrink-0 bg-white border-b border-[#e5e7eb] px-6 flex items-center justify-between">
      {/* Region selector */}
      <div className="flex items-center gap-3">
        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#f7f8fa] border border-[#e5e7eb] rounded-md text-sm text-[#475569] hover:bg-[#f1f5f9] transition-colors">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
          武汉市 · 东西湖区
          <ChevronDown size={12} />
        </button>
        <span className="text-[12px] text-[#94a3b8]">数据更新于 14:28</span>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]"
        />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-52 pl-8 pr-3 py-1.5 text-sm bg-[#f7f8fa] border border-[#e5e7eb] rounded-md text-[#0f172a] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
          placeholder="搜索企业名称…"
        />
      </form>
    </header>
  );
}
