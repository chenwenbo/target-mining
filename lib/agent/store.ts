"use client";
import { create } from "zustand";
import type { AgentMessage, SourceCard } from "../agent-mock";
import { askAgent } from "../agent-mock";
import { detectIntent, isCandidateListQuestion } from "./intents";
import { generateReport, type ReportKey } from "./report-templates";
import { buildCreateTasksAction, type AgentAction } from "./actions";
import { loadHistory, saveConversation, type ConversationRecord } from "./history";

export interface ExtendedAssistantMessage extends AgentMessage {
  actions?: AgentAction[];
  report?: { key: ReportKey; title: string; filename: string; markdown: string };
}

export type AnyMessage = AgentMessage | ExtendedAssistantMessage;

export type AgentView = "home" | "conversation";

interface AgentStore {
  view: AgentView;
  messages: AnyMessage[];
  status: "idle" | "thinking" | "error";
  pendingFill: string;
  conversationId: string | null;
  history: ConversationRecord[];
  ask: (question: string, qid?: string) => Promise<void>;
  reset: () => void;
  setFill: (text: string) => void;
  clearFill: () => void;
  loadConversation: (id: string) => void;
}

export const useAgentStore = create<AgentStore>((set, get) => ({
  view: "home",
  messages: [],
  status: "idle",
  pendingFill: "",
  conversationId: null,
  history: loadHistory(),

  reset: () =>
    set({ view: "home", messages: [], status: "idle", conversationId: null, history: loadHistory() }),
  setFill: (text) => set({ pendingFill: text }),
  clearFill: () => set({ pendingFill: "" }),

  loadConversation: (id) => {
    const record = get().history.find((r) => r.id === id);
    if (!record) return;
    set({ view: "conversation", messages: record.messages, status: "idle", conversationId: id });
  },

  ask: async (question, qid) => {
    if (!question.trim()) return;

    let convId = get().conversationId;
    if (!convId) convId = `conv_${Date.now()}`;

    const userMsg: AgentMessage = { role: "user", content: question };
    set({
      view: "conversation",
      messages: [...get().messages, userMsg],
      status: "thinking",
      conversationId: convId,
    });

    const persist = (msgs: AnyMessage[]) => {
      const firstUser = msgs.find((m) => m.role === "user");
      const title = ((firstUser?.content ?? question) as string).slice(0, 40);
      const existing = get().history.find((r) => r.id === convId);
      saveConversation({
        id: convId!,
        title,
        createdAt: existing?.createdAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: msgs,
      });
      set({ history: loadHistory() });
    };

    try {
      const intent = detectIntent(question, qid);

      if (intent.intent === "report" && intent.reportKey) {
        const report = generateReport(intent.reportKey);
        const reply: ExtendedAssistantMessage = {
          role: "assistant",
          content: report.markdown,
          report,
          followUps: ["生成任务执行简报", "本周新发现的候选企业有哪些？", "技术领域企业数量最多的是？"],
        };
        await new Promise((r) => setTimeout(r, 700));
        const finalMsgs = [...get().messages, reply];
        set({ messages: finalMsgs, status: "idle" });
        persist(finalMsgs);
        return;
      }

      const reply = await askAgent(question, qid);
      const extended: ExtendedAssistantMessage = { ...reply };

      if (intent.intent === "action" || isCandidateListQuestion(qid)) {
        const sourceIds = (reply.sources ?? []).map((s) => s.id);
        const sourceNames = (reply.sources ?? []).map((s: SourceCard) => s.title);
        if (sourceIds.length > 0) {
          extended.actions = [buildCreateTasksAction(sourceIds, sourceNames)];
        }
      }

      const finalMsgs = [...get().messages, extended];
      set({ messages: finalMsgs, status: "idle" });
      persist(finalMsgs);
    } catch (e) {
      console.error(e);
      set({
        messages: [
          ...get().messages,
          {
            role: "assistant",
            content: "抱歉，智能体暂时无法响应，请稍后再试。",
          } as AgentMessage,
        ],
        status: "error",
      });
    }
  },
}));
