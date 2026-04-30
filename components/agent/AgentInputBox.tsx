"use client";
import { useState, useRef, useEffect } from "react";
import { ArrowUp, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { useAgentStore } from "@/lib/agent/store";

interface Props {
  placeholder?: string;
  size?: "lg" | "md";
  busy?: boolean;
  autoFocus?: boolean;
  onSend: (value: string) => void;
}

export default function AgentInputBox({
  placeholder = "向智能体提问，例如：未接触的高潜力企业有哪些？",
  size = "lg",
  busy = false,
  autoFocus = false,
  onSend,
}: Props) {
  const [value, setValue] = useState("");
  const ref = useRef<HTMLTextAreaElement>(null);
  const pendingFill = useAgentStore((s) => s.pendingFill);
  const clearFill = useAgentStore((s) => s.clearFill);

  useEffect(() => {
    if (autoFocus) ref.current?.focus();
  }, [autoFocus]);

  useEffect(() => {
    if (!pendingFill) return;
    setValue(pendingFill);
    clearFill();
    ref.current?.focus();
    setTimeout(() => {
      if (ref.current) {
        ref.current.style.height = "auto";
        ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
      }
    }, 0);
  }, [pendingFill]);

  function submit() {
    const v = value.trim();
    if (!v || busy) return;
    onSend(v);
    setValue("");
    if (ref.current) ref.current.style.height = "";
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  }

  function handleInput(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setValue(e.target.value);
    if (ref.current) {
      ref.current.style.height = "auto";
      ref.current.style.height = Math.min(ref.current.scrollHeight, 200) + "px";
    }
  }

  return (
    <div
      className={cn(
        "relative w-full bg-white border border-[#e5e7eb] rounded-2xl shadow-[0_1px_3px_rgba(15,23,42,0.06)] focus-within:border-blue-400 focus-within:shadow-[0_2px_12px_rgba(37,99,235,0.10)] transition-all",
        size === "lg" ? "px-5 py-4" : "px-4 py-3",
      )}
    >
      <textarea
        ref={ref}
        value={value}
        onChange={handleInput}
        onKeyDown={handleKey}
        placeholder={placeholder}
        rows={1}
        disabled={busy}
        className={cn(
          "w-full resize-none outline-none bg-transparent text-[#0f172a] placeholder:text-[#94a3b8]",
          size === "lg" ? "text-[15px] leading-6 pr-12" : "text-[14px] leading-5 pr-10",
        )}
      />
      <button
        type="button"
        onClick={submit}
        disabled={busy || !value.trim()}
        className={cn(
          "absolute rounded-xl flex items-center justify-center transition-all",
          size === "lg" ? "right-3 bottom-3 w-9 h-9" : "right-2.5 bottom-2.5 w-8 h-8",
          value.trim() && !busy
            ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm"
            : "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed",
        )}
        aria-label="发送"
      >
        {busy ? <Loader2 size={16} className="animate-spin" /> : <ArrowUp size={16} />}
      </button>
    </div>
  );
}
