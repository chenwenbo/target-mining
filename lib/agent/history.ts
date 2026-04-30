import type { AnyMessage } from "./store";

export interface ConversationRecord {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: AnyMessage[];
}

const STORAGE_KEY = "agent_conversations";
const MAX_SAVED = 30;

export function loadHistory(): ConversationRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveConversation(record: ConversationRecord): void {
  if (typeof window === "undefined") return;
  const all = loadHistory().filter((r) => r.id !== record.id);
  all.unshift(record);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all.slice(0, MAX_SAVED)));
}
