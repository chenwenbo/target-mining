"use client";
import { Sparkles } from "lucide-react";
import { useAgentStore } from "@/lib/agent/store";
import { useCurrentPCUser } from "@/lib/account-mock";
import AgentInputBox from "@/components/agent/AgentInputBox";
import RecentConversations from "@/components/agent/RecentConversations";
import ConversationView from "@/components/agent/ConversationView";

interface QAItem {
  label: string;
  prompt: string;
}

const RECOMMENDED_QA: QAItem[] = [
  {
    label: "当前哪些企业最具高企申报潜力？",
    prompt: "请根据当前标的池数据，推荐最具申报潜力的高企候选企业，并说明推荐理由。",
  },
  {
    label: "重点企业的技术实力和合规状况如何？",
    prompt: "请对标的池中的重点企业进行尽职调查分析，包括技术实力、合规状况和申报准备情况。",
  },
  {
    label: "如何合理分配本月走访任务？",
    prompt: "请根据未接触的高潜力企业列表，帮我制定走访任务分配建议，合理分配给各街道负责人。",
  },
  {
    label: "当前标的池的申报进度分布如何？",
    prompt: "请对当前标的池进行全面统计分析，包括企业数量、技术领域分布、街道分布和申报进度。",
  },
  {
    label: "高企认定需要满足哪些基本条件？",
    prompt: "高企认定需要满足哪些基本条件？请详细说明核心指标和评分要求。",
  },
  {
    label: "研发费用如何归集才符合申报要求？",
    prompt: "研发费用如何归集才符合高企申报要求？请说明归集口径和注意事项。",
  },
  {
    label: "知识产权数量和类型对评分有什么影响？",
    prompt: "知识产权数量和类型对高企评分有什么影响？各类型知识产权分别计多少分？",
  },
  {
    label: "企业成立不满三年能否申报高企？",
    prompt: "企业成立不满三年能否申报高新技术企业？有哪些特殊规定或豁免条款？",
  },
];

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
      <div className="text-center mb-6">
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

      {/* 推荐问题 */}
      <div className="mb-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {RECOMMENDED_QA.map((item) => (
            <button
              key={item.label}
              type="button"
              disabled={status === "thinking"}
              onClick={() => ask(item.prompt)}
              className="text-left px-3.5 py-2.5 rounded-xl bg-white border border-[#e5e7eb] text-[12.5px] text-[#374151] hover:border-indigo-300 hover:bg-indigo-50/40 hover:text-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed leading-snug"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* 输入框 */}
      <div className="mb-6">
        <AgentInputBox
          size="lg"
          autoFocus
          busy={status === "thinking"}
          onSend={(v) => ask(v)}
        />
      </div>

      {/* 历史对话 */}
      <RecentConversations />
    </div>
  );
}
