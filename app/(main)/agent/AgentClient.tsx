"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2, ChevronRight, FileSearch, Sparkles, RotateCcw } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  askAgent,
  QUESTION_CATEGORIES,
  type AgentMessage,
  type SourceCard,
} from "@/lib/agent-mock";

// ─── Tag color map ────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, string> = {
  blue:   "bg-blue-50 text-blue-700 border-blue-200",
  green:  "bg-emerald-50 text-emerald-700 border-emerald-200",
  yellow: "bg-amber-50 text-amber-700 border-amber-200",
  red:    "bg-red-50 text-red-700 border-red-200",
  purple: "bg-violet-50 text-violet-700 border-violet-200",
  gray:   "bg-slate-50 text-slate-600 border-slate-200",
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SourceCardItem({ source }: { source: SourceCard }) {
  return (
    <div className="border border-[#e5e7eb] rounded-lg p-3 bg-white hover:border-blue-200 hover:shadow-sm transition-all">
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-[13px] font-medium text-[#0f172a] leading-snug line-clamp-1">
          {source.title}
        </span>
        <span className={cn("text-[11px] px-2 py-0.5 rounded-full border flex-shrink-0 font-medium", TAG_COLORS[source.tagColor])}>
          {source.tag}
        </span>
      </div>
      <div className="text-[11px] text-[#94a3b8] mb-1.5">{source.subtitle}</div>
      <div className="text-[12px] text-[#64748b] leading-relaxed">{source.snippet}</div>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
  // Minimal markdown: bold, tables, bullet lists, numbered lists, blockquotes, line breaks
  const lines = text.split("\n");
  const elements: React.ReactNode[] = [];
  let i = 0;

  const parseInline = (line: string): React.ReactNode => {
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((p, idx) =>
      p.startsWith("**") && p.endsWith("**")
        ? <strong key={idx} className="font-semibold text-[#0f172a]">{p.slice(2, -2)}</strong>
        : p
    );
  };

  while (i < lines.length) {
    const line = lines[i];

    // Blank line
    if (line.trim() === "") { i++; continue; }

    // Blockquote
    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-3 border-amber-400 pl-3 py-0.5 bg-amber-50/60 rounded-r text-[13px] text-[#92400e] italic my-1.5">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    // Table
    if (line.includes("|") && lines[i + 1]?.includes("---")) {
      const headers = line.split("|").map((h) => h.trim()).filter(Boolean);
      const bodyLines: string[][] = [];
      i += 2; // skip separator
      while (i < lines.length && lines[i].includes("|")) {
        bodyLines.push(lines[i].split("|").map((c) => c.trim()).filter(Boolean));
        i++;
      }
      elements.push(
        <div key={`table-${i}`} className="overflow-auto my-2 rounded-lg border border-[#e5e7eb]">
          <table className="w-full text-[12px]">
            <thead className="bg-[#f8fafc]">
              <tr>{headers.map((h, hi) => <th key={hi} className="px-3 py-2 text-left font-semibold text-[#475569] border-b border-[#e5e7eb]">{parseInline(h)}</th>)}</tr>
            </thead>
            <tbody>
              {bodyLines.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white" : "bg-[#f8fafc]"}>
                  {row.map((cell, ci) => <td key={ci} className="px-3 py-1.5 text-[#334155] border-b border-[#f1f5f9]">{parseInline(cell)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      continue;
    }

    // Heading
    if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="text-[14px] font-semibold text-[#0f172a] mt-3 mb-1 first:mt-0">
          {parseInline(line)}
        </p>
      );
      i++; continue;
    }

    // Bullet list
    if (line.startsWith("- ") || line.startsWith("• ")) {
      const bullets: string[] = [];
      while (i < lines.length && (lines[i].startsWith("- ") || lines[i].startsWith("• "))) {
        bullets.push(lines[i].slice(2));
        i++;
      }
      elements.push(
        <ul key={`ul-${i}`} className="space-y-0.5 my-1.5 pl-1">
          {bullets.map((b, bi) => (
            <li key={bi} className="flex items-start gap-2 text-[13px] text-[#334155]">
              <span className="mt-1.5 w-1 h-1 rounded-full bg-blue-400 flex-shrink-0" />
              <span>{parseInline(b)}</span>
            </li>
          ))}
        </ul>
      );
      continue;
    }

    // Numbered list
    if (/^\d+\./.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\d+\./.test(lines[i])) {
        items.push(lines[i].replace(/^\d+\.\s*/, ""));
        i++;
      }
      elements.push(
        <ol key={`ol-${i}`} className="space-y-0.5 my-1.5 pl-1">
          {items.map((item, ii) => (
            <li key={ii} className="flex items-start gap-2 text-[13px] text-[#334155]">
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-[11px] font-bold flex items-center justify-center mt-0.5">{ii + 1}</span>
              <span>{parseInline(item)}</span>
            </li>
          ))}
        </ol>
      );
      continue;
    }

    // Normal paragraph
    elements.push(
      <p key={i} className="text-[13px] text-[#334155] leading-relaxed">
        {parseInline(line)}
      </p>
    );
    i++;
  }

  return <div className="space-y-0.5">{elements}</div>;
}

function ThinkingBubble() {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
        <Bot size={14} className="text-white" />
      </div>
      <div className="bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
        <div className="flex items-center gap-2 text-[12px] text-[#94a3b8]">
          <Loader2 size={13} className="animate-spin text-blue-500" />
          <span>正在检索数据库并生成回答…</span>
        </div>
        <div className="flex gap-1 mt-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function AgentClient() {
  const [messages, setMessages] = useState<AgentMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>("overview");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const latestAssistant = [...messages].reverse().find((m) => m.role === "assistant");

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function sendQuestion(text: string, qid?: string) {
    if (!text.trim() || loading) return;
    const userMsg: AgentMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const response = await askAgent(text, qid);
      setMessages((prev) => [...prev, response]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendQuestion(input);
    }
  }

  function handleReset() {
    setMessages([]);
    setInput("");
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden">
      {/* ── Left: Chat panel ──────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0 border-r border-[#e5e7eb]">
        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-[#e5e7eb] bg-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm">
              <Sparkles size={15} className="text-white" />
            </div>
            <div>
              <div className="text-[14px] font-semibold text-[#0f172a]">AI 分析助手</div>
              <div className="text-[11px] text-[#94a3b8]">基于标的库实时检索 · RAG 增强问答</div>
            </div>
          </div>
          {!isEmpty && (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 text-[12px] text-[#94a3b8] hover:text-[#475569] transition-colors px-2.5 py-1.5 rounded-md hover:bg-[#f1f5f9]"
            >
              <RotateCcw size={13} />
              清空对话
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full pb-16 select-none">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-4">
                <Sparkles size={26} className="text-white" />
              </div>
              <h2 className="text-[17px] font-semibold text-[#0f172a] mb-1">AI 分析助手</h2>
              <p className="text-[13px] text-[#94a3b8] text-center max-w-xs leading-relaxed">
                基于标的库实时检索，帮您深度分析企业数据、复审状态与申报进度
              </p>

              {/* Category tabs */}
              <div className="mt-8 w-full max-w-lg">
                <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-none">
                  {QUESTION_CATEGORIES.map((cat) => (
                    <button
                      key={cat.key}
                      onClick={() => setActiveCategory(cat.key)}
                      className={cn(
                        "flex-shrink-0 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border",
                        activeCategory === cat.key
                          ? "bg-blue-600 text-white border-blue-600"
                          : "bg-white text-[#475569] border-[#e5e7eb] hover:border-blue-300 hover:text-blue-600"
                      )}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="space-y-2">
                  {QUESTION_CATEGORIES.find((c) => c.key === activeCategory)?.questions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => sendQuestion(q.label, q.id)}
                      className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl border border-[#e5e7eb] bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                    >
                      <span className="text-lg flex-shrink-0">{q.icon}</span>
                      <span className="text-[13px] text-[#334155] group-hover:text-blue-700 transition-colors flex-1">
                        {q.label}
                      </span>
                      <ChevronRight size={13} className="text-[#cbd5e1] group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-3 items-start", msg.role === "user" && "flex-row-reverse")}>
                  {/* Avatar */}
                  <div className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                    msg.role === "assistant"
                      ? "bg-gradient-to-br from-blue-500 to-indigo-600"
                      : "bg-gradient-to-br from-slate-400 to-slate-600"
                  )}>
                    {msg.role === "assistant"
                      ? <Bot size={14} className="text-white" />
                      : <User size={14} className="text-white" />}
                  </div>

                  {/* Bubble */}
                  {msg.role === "user" ? (
                    <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[70%] text-[13px] leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%] space-y-3">
                      <MarkdownContent text={msg.content} />

                      {/* Inline source citations */}
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-1 border-t border-[#f1f5f9]">
                          <div className="flex items-center gap-1.5 mb-2">
                            <FileSearch size={12} className="text-[#94a3b8]" />
                            <span className="text-[11px] text-[#94a3b8] font-medium">检索到 {msg.sources.length} 条相关记录</span>
                          </div>
                          <div className="space-y-2">
                            {msg.sources.map((s) => <SourceCardItem key={s.id} source={s} />)}
                          </div>
                        </div>
                      )}

                      {/* Follow-up suggestions */}
                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="pt-1 border-t border-[#f1f5f9]">
                          <div className="text-[11px] text-[#94a3b8] font-medium mb-1.5">相关追问</div>
                          <div className="flex flex-wrap gap-1.5">
                            {msg.followUps.map((fu, fi) => (
                              <button
                                key={fi}
                                onClick={() => sendQuestion(fu)}
                                className="text-[12px] px-2.5 py-1 rounded-full border border-[#e5e7eb] bg-[#f8fafc] text-[#475569] hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 transition-all"
                              >
                                {fu}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {loading && <ThinkingBubble />}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input bar */}
        <div className="flex-shrink-0 px-5 pb-5 pt-3 bg-white border-t border-[#e5e7eb]">
          {/* Quick pills — show top 3 from active category when not empty */}
          {!isEmpty && !loading && (
            <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-0.5 scrollbar-none">
              {QUESTION_CATEGORIES.find((c) => c.key === activeCategory)?.questions.slice(0, 3).map((q) => (
                <button
                  key={q.id}
                  onClick={() => sendQuestion(q.label, q.id)}
                  className="flex-shrink-0 text-[12px] px-3 py-1 rounded-full border border-[#e5e7eb] bg-white text-[#475569] hover:border-blue-300 hover:text-blue-700 transition-all"
                >
                  {q.icon} {q.label}
                </button>
              ))}
            </div>
          )}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="输入问题，或选择上方引导问题… (Enter 发送，Shift+Enter 换行)"
              rows={1}
              className="flex-1 resize-none rounded-xl border border-[#e5e7eb] px-3.5 py-2.5 text-[13px] text-[#334155] placeholder:text-[#cbd5e1] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-all bg-[#f8fafc] min-h-[42px] max-h-[120px] leading-relaxed"
              style={{ height: "auto" }}
              onInput={(e) => {
                const el = e.currentTarget;
                el.style.height = "auto";
                el.style.height = Math.min(el.scrollHeight, 120) + "px";
              }}
            />
            <button
              onClick={() => sendQuestion(input)}
              disabled={!input.trim() || loading}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm",
                input.trim() && !loading
                  ? "bg-blue-600 text-white hover:bg-blue-700 active:scale-95"
                  : "bg-[#f1f5f9] text-[#cbd5e1] cursor-not-allowed"
              )}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
          <div className="text-[11px] text-[#cbd5e1] text-center mt-2">
            数据来源：标的库实时检索 · 仅供参考，请结合实际情况判断
          </div>
        </div>
      </div>

      {/* ── Right: Sources & context panel ───────────────────────── */}
      <div className="w-[300px] flex-shrink-0 flex flex-col bg-white overflow-hidden">
        <div className="px-4 py-3.5 border-b border-[#e5e7eb]">
          <div className="flex items-center gap-2">
            <FileSearch size={14} className="text-[#94a3b8]" />
            <span className="text-[13px] font-semibold text-[#334155]">引用来源</span>
          </div>
          <div className="text-[11px] text-[#94a3b8] mt-0.5">最新回答检索到的数据记录</div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
          {latestAssistant?.sources && latestAssistant.sources.length > 0 ? (
            <>
              {latestAssistant.sources.map((s) => <SourceCardItem key={s.id} source={s} />)}
              <div className="text-[11px] text-[#cbd5e1] text-center pt-1">
                共 {latestAssistant.sources.length} 条相关记录
              </div>
            </>
          ) : isEmpty ? (
            <div className="flex flex-col items-center justify-center h-full text-center pb-10">
              <div className="w-10 h-10 rounded-xl bg-[#f1f5f9] flex items-center justify-center mb-3">
                <FileSearch size={18} className="text-[#cbd5e1]" />
              </div>
              <div className="text-[13px] text-[#94a3b8] font-medium">暂无引用来源</div>
              <div className="text-[12px] text-[#cbd5e1] mt-1 max-w-[180px] leading-relaxed">
                提问后，RAG 检索到的相关企业数据将显示在此处
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center pb-10">
              <div className="text-[13px] text-[#94a3b8]">该回答无具体引用来源</div>
            </div>
          )}
        </div>

        {/* Guide panel bottom: all question categories */}
        <div className="border-t border-[#e5e7eb] p-3 space-y-3">
          <div className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">常用问题</div>
          {QUESTION_CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <div className="text-[11px] text-[#94a3b8] mb-1">{cat.label}</div>
              <div className="space-y-1">
                {cat.questions.slice(0, 2).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => { setActiveCategory(cat.key); sendQuestion(q.label, q.id); }}
                    className="w-full text-left text-[12px] text-[#475569] hover:text-blue-700 flex items-center gap-1.5 px-2 py-1 rounded-md hover:bg-blue-50 transition-colors"
                  >
                    <span className="text-sm">{q.icon}</span>
                    <span className="line-clamp-1">{q.label}</span>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
