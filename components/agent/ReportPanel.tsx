"use client";
import { useState } from "react";
import { Copy, Download, Check } from "lucide-react";

interface Props {
  title: string;
  filename: string;
  markdown: string;
}

export default function ReportPanel({ title, filename, markdown }: Props) {
  const [copied, setCopied] = useState(false);

  function copy() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(markdown).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      });
    }
  }

  function download() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50/60 border border-blue-100">
      <span className="text-[12px] text-blue-700 font-medium flex-1">📄 {title}</span>
      <button
        type="button"
        onClick={copy}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-md bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 transition-colors"
      >
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "已复制" : "复制"}
      </button>
      <button
        type="button"
        onClick={download}
        className="inline-flex items-center gap-1 px-2.5 py-1 text-[12px] rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
      >
        <Download size={12} />
        下载 .md
      </button>
    </div>
  );
}
