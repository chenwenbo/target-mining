"use client";
import { Sparkles } from "lucide-react";
import { useAgentStore } from "@/lib/agent/store";
import { useCurrentPCUser } from "@/lib/account-mock";
import AgentInputBox from "@/components/agent/AgentInputBox";
import QuickCommandChips from "@/components/agent/QuickCommandChips";
import RecentConversations from "@/components/agent/RecentConversations";
import ConversationView from "@/components/agent/ConversationView";

function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "凌晨好";
  if (h < 12) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export default function AgentHomeClient() {
  const view = useAgentStore((s) => s.view);
  const ask = useAgentStore((s) => s.ask);
  const status = useAgentStore((s) => s.status);
  const { user, mounted } = useCurrentPCUser();

  if (view === "conversation") {
    return <ConversationView />;
  }

  const name = mounted ? user.displayName : "";

  return (
    <div className="max-w-3xl mx-auto pt-10 pb-12">
      {/* 欢迎区 */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white mb-4 shadow-[0_4px_16px_rgba(79,70,229,0.25)]">
          <Sparkles size={26} />
        </div>
        <h1 className="text-2xl font-semibold text-[#0f172a]">
          {greeting()}{name ? `，${name}` : ""}
        </h1>
        <p className="text-[#64748b] text-[14px] mt-2">
          我是高企标的挖掘智能体，可以帮你查数据、生成简报、安排任务
        </p>
      </div>

      {/* 输入框 */}
      <div className="mb-4">
        <AgentInputBox
          size="lg"
          autoFocus
          busy={status === "thinking"}
          onSend={(v) => ask(v)}
        />
      </div>

      {/* 快捷指令 */}
      <div className="mb-4">
        <QuickCommandChips />
      </div>

      {/* 历史对话 */}
      <RecentConversations />
    </div>
  );
}
