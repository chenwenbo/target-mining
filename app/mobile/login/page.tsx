"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOCK_VISITORS, setCurrentVisitor } from "@/lib/mobile-mock";
import { Smartphone } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [selectedId, setSelectedId] = useState<string>("");

  function handleEnter() {
    const visitor = MOCK_VISITORS.find((v) => v.id === selectedId);
    if (!visitor) return;
    setCurrentVisitor(visitor);
    router.push("/mobile/tasks");
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-blue-600 to-blue-700">
      {/* 顶部品牌区 */}
      <div className="flex flex-col items-center pt-16 pb-10 px-6">
        <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
          <Smartphone size={32} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-wide">走访摸排助手</h1>
        <p className="text-blue-200 text-sm mt-1">东西湖区科技局 · 高企走访</p>
      </div>

      {/* 登录卡片 */}
      <div className="flex-1 bg-gray-50 rounded-t-3xl px-6 pt-8 pb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">请选择走访人员</h2>
        <p className="text-xs text-gray-400 mb-5">演示模式，选择身份后进入工作台</p>

        <div className="space-y-3 mb-8">
          {MOCK_VISITORS.map((v) => (
            <button
              key={v.id}
              onClick={() => setSelectedId(v.id)}
              className={`w-full flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                selectedId === v.id
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-200 bg-white"
              }`}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                selectedId === v.id ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500"
              }`}>
                {v.name[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-800 text-sm">{v.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                    v.role === "street_officer"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-purple-100 text-purple-700"
                  }`}>
                    {v.role === "street_officer" ? "街道办" : "科技人员"}
                  </span>
                </div>
                <div className="text-xs text-gray-400 truncate mt-0.5">{v.dept}</div>
              </div>
              {selectedId === v.id && (
                <div className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              )}
            </button>
          ))}
        </div>

        <button
          onClick={handleEnter}
          disabled={!selectedId}
          className="w-full py-3.5 rounded-xl font-semibold text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-blue-600 text-white active:scale-[0.98]"
        >
          进入工作台
        </button>
      </div>
    </div>
  );
}
