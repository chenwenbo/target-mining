"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, Bot, User, Loader2, ChevronRight, FileSearch, Sparkles, RotateCcw,
  BarChart3, MapPin, Target, Clock, AlertTriangle, CheckCircle2,
  Microscope, TrendingUp, AlertOctagon, Lightbulb, Star, Building2,
  LayoutDashboard, RefreshCw, ClipboardList, FlaskConical, ShieldAlert,
  HelpCircle, Mic, MicOff, type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  askAgent,
  QUESTION_CATEGORIES,
  type AgentMessage,
  type SourceCard,
} from "@/lib/agent-mock";

// ─── Icon maps ────────────────────────────────────────────────────────────────

const QUESTION_ICON_MAP: Record<string, LucideIcon> = {
  BarChart3, MapPin, Target, Clock, AlertTriangle, CheckCircle2,
  Microscope, TrendingUp, AlertOctagon, Lightbulb, Star, Building2,
};

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  overview: LayoutDashboard,
  renewal:  RefreshCw,
  task:     ClipboardList,
  analysis: FlaskConical,
  risk:     ShieldAlert,
  company:  Building2,
};

// ─── Tag styles ───────────────────────────────────────────────────────────────

const TAG_COLORS: Record<string, { badge: string; bar: string }> = {
  blue:   { badge: "bg-blue-50 text-blue-700 border-blue-200",     bar: "bg-blue-400" },
  green:  { badge: "bg-emerald-50 text-emerald-700 border-emerald-200", bar: "bg-emerald-400" },
  yellow: { badge: "bg-amber-50 text-amber-700 border-amber-200",  bar: "bg-amber-400" },
  red:    { badge: "bg-red-50 text-red-700 border-red-200",        bar: "bg-red-400" },
  purple: { badge: "bg-violet-50 text-violet-700 border-violet-200", bar: "bg-violet-400" },
  gray:   { badge: "bg-slate-50 text-slate-600 border-slate-200",  bar: "bg-slate-300" },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function QuestionIcon({ name, size = 14 }: { name: string; size?: number }) {
  const Icon = QUESTION_ICON_MAP[name] ?? HelpCircle;
  return <Icon size={size} />;
}

function SourceCardItem({ source, index }: { source: SourceCard; index?: number }) {
  const colors = TAG_COLORS[source.tagColor] ?? TAG_COLORS.gray;
  return (
    <div className="flex gap-3 p-3 rounded-xl border border-[#f1f5f9] bg-white hover:border-blue-200 hover:shadow-sm transition-all">
      <div className={cn("w-0.5 flex-shrink-0 rounded-full self-stretch", colors.bar)} />
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <span className="text-[13px] font-medium text-[#0f172a] leading-snug line-clamp-2 flex-1">
            {index !== undefined && (
              <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[#f1f5f9] text-[10px] font-bold text-[#94a3b8] mr-1.5 flex-shrink-0 align-middle">
                {index + 1}
              </span>
            )}
            {source.title}
          </span>
          <span className={cn("text-[10px] px-1.5 py-0.5 rounded-md border flex-shrink-0 font-medium", colors.badge)}>
            {source.tag}
          </span>
        </div>
        <div className="text-[11px] text-[#94a3b8] mb-1">{source.subtitle}</div>
        <div className="text-[12px] text-[#64748b] leading-relaxed line-clamp-2">{source.snippet}</div>
      </div>
    </div>
  );
}

function MarkdownContent({ text }: { text: string }) {
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
    if (line.trim() === "") { i++; continue; }

    if (line.startsWith("> ")) {
      elements.push(
        <blockquote key={i} className="border-l-2 border-amber-400 pl-3 py-0.5 bg-amber-50/60 rounded-r text-[13px] text-[#92400e] italic my-1.5">
          {parseInline(line.slice(2))}
        </blockquote>
      );
      i++; continue;
    }

    if (line.includes("|") && lines[i + 1]?.includes("---")) {
      const headers = line.split("|").map((h) => h.trim()).filter(Boolean);
      const bodyLines: string[][] = [];
      i += 2;
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

    if (line.startsWith("**") && line.endsWith("**")) {
      elements.push(
        <p key={i} className="text-[14px] font-semibold text-[#0f172a] mt-3 mb-1 first:mt-0">
          {parseInline(line)}
        </p>
      );
      i++; continue;
    }

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

// ─── Right panel: Sources ─────────────────────────────────────────────────────

function SourcesPanel({
  sources,
  isEmpty,
}: {
  sources: SourceCard[] | undefined;
  isEmpty: boolean;
}) {
  const hasData = sources && sources.length > 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Header */}
      <div className="flex-shrink-0 px-4 py-3 border-b border-[#f1f5f9]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#f1f5f9] flex items-center justify-center">
              <FileSearch size={13} className="text-[#64748b]" />
            </div>
            <span className="text-[13px] font-semibold text-[#334155]">引用来源</span>
          </div>
          {hasData && (
            <span className="text-[11px] px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-600 font-medium border border-blue-100">
              {sources.length} 条
            </span>
          )}
        </div>
        <p className="text-[11px] text-[#94a3b8] mt-0.5 ml-8">最新回答检索到的数据记录</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {hasData ? (
          sources.map((s, i) => <SourceCardItem key={s.id} source={s} index={i} />)
        ) : isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center py-10">
            <div className="w-12 h-12 rounded-2xl bg-[#f8fafc] border border-[#e5e7eb] flex items-center justify-center mb-3">
              <FileSearch size={20} className="text-[#cbd5e1]" />
            </div>
            <div className="text-[13px] font-medium text-[#94a3b8]">暂无引用来源</div>
            <div className="text-[12px] text-[#cbd5e1] mt-1 max-w-[160px] leading-relaxed">
              提问后，RAG 检索到的相关企业数据将显示在此处
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full py-10">
            <div className="text-[13px] text-[#94a3b8]">该回答无具体引用来源</div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Right panel: Quick questions ────────────────────────────────────────────

function QuickQuestionsPanel({
  onAsk,
  setActiveCategory,
}: {
  onAsk: (label: string, id: string) => void;
  setActiveCategory: (key: string) => void;
}) {
  return (
    <div className="flex-shrink-0 border-t border-[#f1f5f9]">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-[#f1f5f9]">
        <div className="w-6 h-6 rounded-md bg-[#f1f5f9] flex items-center justify-center">
          <HelpCircle size={13} className="text-[#64748b]" />
        </div>
        <span className="text-[13px] font-semibold text-[#334155]">快捷提问</span>
      </div>

      {/* Category list */}
      <div className="overflow-y-auto max-h-[260px] p-3 space-y-3">
        {QUESTION_CATEGORIES.map((cat) => {
          const CatIcon = CATEGORY_ICON_MAP[cat.key] ?? HelpCircle;
          return (
            <div key={cat.key}>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CatIcon size={11} className="text-[#94a3b8] flex-shrink-0" />
                <span className="text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">
                  {cat.label}
                </span>
              </div>
              <div className="space-y-0.5">
                {cat.questions.slice(0, 2).map((q) => (
                  <button
                    key={q.id}
                    onClick={() => {
                      setActiveCategory(cat.key);
                      onAsk(q.label, q.id);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-left hover:bg-blue-50 transition-colors group"
                  >
                    <div className="flex-shrink-0 w-5 h-5 rounded-md bg-[#f8fafc] border border-[#f1f5f9] flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                      <QuestionIcon name={q.icon} size={11} />
                    </div>
                    <span className="text-[12px] text-[#475569] group-hover:text-blue-700 transition-colors line-clamp-1 flex-1">
                      {q.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
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
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const toggleVoiceInput = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition =
      (window as typeof window & { SpeechRecognition?: typeof window.SpeechRecognition; webkitSpeechRecognition?: typeof window.SpeechRecognition }).SpeechRecognition ??
      (window as typeof window & { webkitSpeechRecognition?: typeof window.SpeechRecognition }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("您的浏览器不支持语音输入，请使用 Chrome 或 Edge");
      return;
    }

    const rec = new SpeechRecognition();
    rec.lang = "zh-CN";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + transcript : transcript));
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
          inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + "px";
        }
      }, 0);
    };

    rec.onend = () => setIsRecording(false);
    rec.onerror = () => setIsRecording(false);

    recognitionRef.current = rec;
    rec.start();
    setIsRecording(true);
  }, [isRecording]);

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
  const activeQuestions = QUESTION_CATEGORIES.find((c) => c.key === activeCategory)?.questions ?? [];

  return (
    <div className="flex h-full bg-[#f8fafc] overflow-hidden">

      {/* ── Left: Chat panel ──────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">

        {/* Header */}
        <div className="flex-shrink-0 px-5 py-3.5 border-b border-[#e5e7eb] bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
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
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
          {isEmpty ? (
            /* ── Empty state ── */
            <div className="flex flex-col items-center justify-center h-full pb-10 select-none">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg mb-4">
                <Sparkles size={26} className="text-white" />
              </div>
              <h2 className="text-[17px] font-semibold text-[#0f172a] mb-1">AI 分析助手</h2>
              <p className="text-[13px] text-[#94a3b8] text-center max-w-xs leading-relaxed">
                基于标的库实时检索，帮您深度分析企业数据、复审状态与申报进度
              </p>

              {/* Category tabs */}
              <div className="mt-8 w-full max-w-xl">
                <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
                  {QUESTION_CATEGORIES.map((cat) => {
                    const CatIcon = CATEGORY_ICON_MAP[cat.key] ?? HelpCircle;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setActiveCategory(cat.key)}
                        className={cn(
                          "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors border",
                          activeCategory === cat.key
                            ? "bg-blue-600 text-white border-blue-600"
                            : "bg-white text-[#475569] border-[#e5e7eb] hover:border-blue-300 hover:text-blue-600"
                        )}
                      >
                        <CatIcon size={12} />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                {/* Question grid */}
                <div className="grid grid-cols-2 gap-2">
                  {activeQuestions.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => sendQuestion(q.label, q.id)}
                      className="flex items-center gap-2.5 px-3.5 py-3 rounded-xl border border-[#e5e7eb] bg-white hover:border-blue-300 hover:bg-blue-50/50 transition-all text-left group"
                    >
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center group-hover:bg-blue-100 group-hover:border-blue-200 transition-colors">
                        <QuestionIcon name={q.icon} size={14} />
                      </div>
                      <span className="text-[13px] text-[#334155] group-hover:text-blue-700 transition-colors flex-1 leading-snug line-clamp-2">
                        {q.label}
                      </span>
                      <ChevronRight size={12} className="text-[#cbd5e1] group-hover:text-blue-400 transition-colors flex-shrink-0" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* ── Conversation ── */
            <>
              {messages.map((msg, idx) => (
                <div key={idx} className={cn("flex gap-3 items-start", msg.role === "user" && "flex-row-reverse")}>
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

                  {msg.role === "user" ? (
                    <div className="bg-blue-600 text-white px-4 py-2.5 rounded-2xl rounded-tr-sm max-w-[70%] text-[13px] leading-relaxed shadow-sm">
                      {msg.content}
                    </div>
                  ) : (
                    <div className="bg-white border border-[#e5e7eb] rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm max-w-[85%] space-y-3">
                      <MarkdownContent text={msg.content} />

                      {msg.sources && msg.sources.length > 0 && (
                        <div className="pt-2 border-t border-[#f1f5f9]">
                          <div className="flex items-center gap-1.5 mb-2">
                            <FileSearch size={12} className="text-[#94a3b8]" />
                            <span className="text-[11px] text-[#94a3b8] font-medium">
                              检索到 {msg.sources.length} 条相关记录
                            </span>
                          </div>
                          <div className="space-y-2">
                            {msg.sources.map((s, i) => <SourceCardItem key={s.id} source={s} index={i} />)}
                          </div>
                        </div>
                      )}

                      {msg.followUps && msg.followUps.length > 0 && (
                        <div className="pt-2 border-t border-[#f1f5f9]">
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
          {!isEmpty && !loading && (
            <div className="flex gap-1.5 mb-2.5 overflow-x-auto pb-0.5 scrollbar-none">
              {activeQuestions.slice(0, 3).map((q) => (
                <button
                  key={q.id}
                  onClick={() => sendQuestion(q.label, q.id)}
                  className="flex-shrink-0 flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-full border border-[#e5e7eb] bg-white text-[#475569] hover:border-blue-300 hover:text-blue-700 transition-all"
                >
                  <QuestionIcon name={q.icon} size={11} />
                  {q.label}
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
              onClick={toggleVoiceInput}
              title={isRecording ? "停止录音" : "语音输入"}
              className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-all shadow-sm",
                isRecording
                  ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
                  : "bg-[#f1f5f9] text-[#94a3b8] hover:bg-[#e2e8f0] hover:text-[#475569]"
              )}
            >
              {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
            </button>
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

    </div>
  );
}
