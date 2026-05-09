"use client";
import { X, Plus, ArrowLeft, Sparkles } from "lucide-react";
import { useLayoutStore } from "@/lib/layout-store";
import { useAgentStore } from "@/lib/agent/store";
import { useCurrentPCUser } from "@/lib/account-mock";
import AgentInputBox from "./AgentInputBox";
import QuickCommandChips from "./QuickCommandChips";
import RecentConversations from "./RecentConversations";
import ConversationView from "./ConversationView";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "凌晨好";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export default function AgentPanel() {
  const closeAgentPanel = useLayoutStore((s) => s.closeAgentPanel);
  const view = useAgentStore((s) => s.view);
  const ask = useAgentStore((s) => s.ask);
  const reset = useAgentStore((s) => s.reset);
  const status = useAgentStore((s) => s.status);
  const { user, mounted } = useCurrentPCUser();
  const name = mounted ? user.displayName : "";

  return (
    <div className="w-[400px] flex-shrink-0 flex flex-col h-full bg-white border-l border-[#e5e7eb] shadow-[-4px_0_16px_rgba(15,23,42,0.04)]">
      {/* 顶栏：h-14 与 Topbar 对齐 */}
      <div className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-[#e5e7eb]">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
            <Sparkles size={13} />
          </div>
          <span className="text-sm font-semibold text-[#0f172a]">智能体</span>
        </div>

        <div className="flex items-center gap-1">
          {/* conversation 视图：返回首页 + 新对话 */}
          {view === "conversation" && (
            <>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-[12.5px] text-[#475569] hover:text-blue-700 transition-colors px-2 py-1 rounded-md hover:bg-[#f7f8fa]"
              >
                <ArrowLeft size={13} />
                首页
              </button>
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center gap-1 text-[12.5px] text-[#475569] hover:text-blue-700 transition-colors px-2 py-1 rounded-md border border-[#e5e7eb] hover:border-blue-300"
              >
                <Plus size={12} />
                新对话
              </button>
            </>
          )}

          {/* 关闭按钮 */}
          <button
            type="button"
            onClick={closeAgentPanel}
            className="w-7 h-7 rounded-md flex items-center justify-center text-[#94a3b8] hover:text-[#475569] hover:bg-[#f7f8fa] transition-colors ml-1"
            title="关闭面板"
          >
            <X size={15} />
          </button>
        </div>
      </div>

      {/* 内容区 */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {view === "conversation" ? (
          <ConversationView hideHeader />
        ) : (
          <div className="flex-1 overflow-y-auto px-4 pt-6 pb-4">
            {/* 欢迎区 */}
            <div className="text-center mb-5">
              <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-3 shadow-[0_4px_12px_rgba(79,70,229,0.18)]">
                <Sparkles size={20} />
              </div>
              <h2 className="text-base font-semibold text-[#0f172a]">
                {greeting()}{name ? `，${name}` : ""}
              </h2>
              <p className="text-xs text-[#64748b] mt-1 leading-relaxed">
                查数据、生成简报、安排任务
              </p>
            </div>

            {/* 输入框 */}
            <div className="mb-3">
              <AgentInputBox
                size="md"
                placeholder="向智能体提问..."
                autoFocus
                busy={status === "thinking"}
                onSend={(v) => ask(v)}
              />
            </div>

            {/* 快捷指令 */}
            <div className="mb-3">
              <QuickCommandChips />
            </div>

            {/* 历史对话 */}
            <RecentConversations />
          </div>
        )}
      </div>
    </div>
  );
}
