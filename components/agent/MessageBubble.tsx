"use client";
import { Sparkles, User } from "lucide-react";
import { cn } from "@/lib/cn";
import Markdown from "./Markdown";
import SourceCardList from "./SourceCardList";
import ReportPanel from "./ReportPanel";
import ActionChips from "./ActionChips";
import { useAgentStore, type ExtendedAssistantMessage } from "@/lib/agent/store";
import type { AgentMessage } from "@/lib/agent-mock";

export function UserBubble({ message }: { message: AgentMessage }) {
  return (
    <div className="flex justify-end">
      <div className="flex items-start gap-2.5 max-w-[80%]">
        <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm text-[13.5px] leading-relaxed whitespace-pre-wrap">
          {message.content}
        </div>
        <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
          <User size={14} />
        </div>
      </div>
    </div>
  );
}

export function AssistantBubble({ message }: { message: ExtendedAssistantMessage }) {
  const ask = useAgentStore((s) => s.ask);
  const status = useAgentStore((s) => s.status);

  return (
    <div className="flex">
      <div className="flex items-start gap-2.5 max-w-[88%] w-full">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} />
        </div>
        <div className="flex-1 min-w-0 bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm px-4 py-3">
          <Markdown source={message.content} />

          {message.report && (
            <ReportPanel
              title={message.report.title}
              filename={message.report.filename}
              markdown={message.report.markdown}
            />
          )}

          {message.sources && message.sources.length > 0 && (
            <SourceCardList sources={message.sources} />
          )}

          {message.actions && message.actions.length > 0 && (
            <ActionChips actions={message.actions} />
          )}

          {message.followUps && message.followUps.length > 0 && (
            <div className="mt-3">
              <div className="text-[11.5px] font-medium text-[#94a3b8] mb-1.5">💡 你也可以问</div>
              <div className="flex flex-wrap gap-1.5">
                {message.followUps.map((q) => (
                  <button
                    key={q}
                    type="button"
                    disabled={status === "thinking"}
                    onClick={() => ask(q)}
                    className={cn(
                      "px-2.5 py-1 text-[12px] rounded-full border border-[#e5e7eb] text-[#475569]",
                      "hover:border-blue-300 hover:text-blue-700 hover:bg-blue-50/40 transition-colors",
                      "disabled:opacity-50 disabled:cursor-not-allowed",
                    )}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ThinkingBubble() {
  return (
    <div className="flex">
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Sparkles size={14} />
        </div>
        <div className="bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
          <Dot delay={0} />
          <Dot delay={150} />
          <Dot delay={300} />
        </div>
      </div>
    </div>
  );
}

function Dot({ delay }: { delay: number }) {
  return (
    <span
      className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"
      style={{ animationDelay: `${delay}ms` }}
    />
  );
}
