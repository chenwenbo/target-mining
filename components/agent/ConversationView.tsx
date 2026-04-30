"use client";
import { useEffect, useRef } from "react";
import { ArrowLeft, Plus } from "lucide-react";
import { useAgentStore, type ExtendedAssistantMessage } from "@/lib/agent/store";
import AgentInputBox from "./AgentInputBox";
import { UserBubble, AssistantBubble, ThinkingBubble } from "./MessageBubble";

export default function ConversationView() {
  const { messages, status, ask, reset } = useAgentStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  return (
    <div className="flex flex-col h-full max-h-[calc(100vh-100px)]">
      {/* 顶栏 */}
      <div className="flex items-center justify-between px-1 pb-3 border-b border-[#e5e7eb]">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-[13px] text-[#475569] hover:text-blue-700 transition-colors"
        >
          <ArrowLeft size={14} />
          返回首页
        </button>
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 text-[12.5px] text-[#475569] px-2.5 py-1 rounded-md border border-[#e5e7eb] hover:border-blue-300 hover:text-blue-700 transition-colors"
        >
          <Plus size={12} />
          新建对话
        </button>
      </div>

      {/* 消息流 */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto py-5 space-y-4 pr-1">
        {messages.map((m, i) =>
          m.role === "user" ? (
            <UserBubble key={i} message={m} />
          ) : (
            <AssistantBubble key={i} message={m as ExtendedAssistantMessage} />
          ),
        )}
        {status === "thinking" && <ThinkingBubble />}
      </div>

      {/* 输入框 */}
      <div className="pt-3 border-t border-[#e5e7eb]">
        <AgentInputBox
          size="md"
          placeholder="继续提问..."
          busy={status === "thinking"}
          autoFocus
          onSend={(v) => ask(v)}
        />
      </div>
    </div>
  );
}
