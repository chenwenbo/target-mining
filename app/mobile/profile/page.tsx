"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getCurrentVisitor, clearCurrentVisitor, getVisitRecords, getTaskStatusOverrides } from "@/lib/mobile-mock";
import { getAllTasks } from "@/lib/mock-data";
import type { Visitor, TaskStatus } from "@/lib/types";
import { MapPin, Building2, LogOut, ChevronRight, ClipboardList } from "lucide-react";

export default function ProfilePage() {
  const router = useRouter();
  const [visitor, setVisitor] = useState<Visitor | null>(null);

  useEffect(() => {
    const v = getCurrentVisitor();
    if (!v) { router.replace("/mobile/login"); return; }
    setVisitor(v);
  }, [router]);

  if (!visitor) return null;

  const overrides = getTaskStatusOverrides();
  const myTasks = getAllTasks()
    .filter((t) => t.assignee === visitor.name)
    .map((t) => ({ ...t, status: (overrides[t.id] ?? t.status) as TaskStatus }));
  const myRecords = getVisitRecords().filter((r) => r.visitorId === visitor.id);
  const doneCount = myTasks.filter((t) => t.status === "done").length;

  function handleLogout() {
    clearCurrentVisitor();
    router.replace("/mobile/login");
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* 顶部 Header */}
      <div className="bg-blue-600 px-4 pt-3 pb-12">
        <h1 className="text-white font-semibold text-base pt-2">我的</h1>
      </div>

      {/* 头像卡片（悬浮在 header 上） */}
      <div className="mx-4 -mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
            {visitor.name[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800 text-base">{visitor.name}</div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded ${
                visitor.role === "street_officer"
                  ? "bg-amber-100 text-amber-700"
                  : "bg-purple-100 text-purple-700"
              }`}>
                {visitor.role === "street_officer" ? "街道办" : "科技人员"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Building2 size={13} className="text-gray-400 shrink-0" />
            <span>{visitor.dept}</span>
          </div>
          {visitor.street && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <MapPin size={13} className="text-gray-400 shrink-0" />
              <span>管辖区域：{visitor.street}</span>
            </div>
          )}
        </div>
      </div>

      {/* 数据摘要 */}
      <div className="mx-4 bg-white rounded-xl p-4 mb-4">
        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">我的数据</h3>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "分配任务", value: myTasks.length },
            { label: "已完成",  value: doneCount },
            { label: "走访记录", value: myRecords.length },
          ].map(({ label, value }) => (
            <div key={label}>
              <div className="text-2xl font-bold text-blue-600">{value}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 快捷入口 */}
      <div className="mx-4 bg-white rounded-xl overflow-hidden mb-4">
        <button
          onClick={() => router.push("/mobile/tasks")}
          className="w-full flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 active:bg-gray-50"
        >
          <ClipboardList size={18} className="text-blue-500" />
          <span className="flex-1 text-sm text-gray-700 text-left">查看我的任务</span>
          <ChevronRight size={16} className="text-gray-300" />
        </button>
      </div>

      {/* 退出登录 */}
      <div className="mx-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 text-red-500 text-sm font-medium active:bg-red-50"
        >
          <LogOut size={16} />
          切换用户 / 退出
        </button>
      </div>

      <p className="text-center text-[10px] text-gray-300 mt-4">走访摸排助手 · 演示版本</p>
    </div>
  );
}
