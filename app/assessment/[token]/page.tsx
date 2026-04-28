"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ASSESSMENT_QUESTIONS } from "@/lib/assessment";
import { scoreAssessment } from "@/lib/assessment";
import {
  getAssessmentRecordByToken,
  saveAssessmentRecord,
} from "@/lib/assessment-store";
import type { AssessmentAnswers, AssessmentRecord } from "@/lib/types";
import { getCompanyById } from "@/lib/mock-data";
import { cn } from "@/lib/cn";

// Group questions into 3 steps
const STEP_GROUPS = [
  { title: "研发投入情况", ids: ["rd_expense_ratio", "rd_accounting_separate", "rd_staff_ratio", "has_rd_dept"] },
  { title: "知识产权情况", ids: ["invention_patents", "utility_patents", "software_copyrights"] },
  { title: "收入结构与管理", ids: ["hi_tech_revenue_ratio", "has_accounting_firm", "annual_audit", "compliance_clean"] },
];

const TOTAL_STEPS = STEP_GROUPS.length;

function ProgressBar({ step }: { step: number }) {
  return (
    <div className="flex items-center gap-2 mb-6">
      {STEP_GROUPS.map((g, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1">
          <div
            className={cn(
              "w-full h-1.5 rounded-full transition-colors",
              i < step ? "bg-blue-600" : i === step ? "bg-blue-400" : "bg-[#e5e7eb]",
            )}
          />
          <span
            className={cn(
              "text-[10px]",
              i === step ? "text-blue-600 font-medium" : "text-[#94a3b8]",
            )}
          >
            {g.title}
          </span>
        </div>
      ))}
    </div>
  );
}

export default function AssessmentPublicPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();

  const [record, setRecord] = useState<AssessmentRecord | null | undefined>(undefined);
  const [companyName, setCompanyName] = useState("");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const r = getAssessmentRecordByToken(token) ?? null;
    setRecord(r);
    if (r) {
      const company = getCompanyById(r.companyId);
      setCompanyName(company?.name ?? "企业测评");
    }
  }, [token]);

  // Loading
  if (record === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa]">
        <p className="text-[#94a3b8] text-sm">加载中…</p>
      </div>
    );
  }

  // Invalid token
  if (record === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-6">
        <div className="text-center space-y-3">
          <div className="text-4xl">🔗</div>
          <p className="text-lg font-semibold text-[#0f172a]">链接无效或已过期</p>
          <p className="text-sm text-[#94a3b8]">请联系发送测评链接的工作人员重新生成</p>
        </div>
      </div>
    );
  }

  // Already submitted
  if (record.status === "completed") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f7f8fa] p-6">
        <div className="text-center space-y-3">
          <div className="text-4xl">✅</div>
          <p className="text-lg font-semibold text-[#0f172a]">该问卷已提交</p>
          <p className="text-sm text-[#94a3b8]">如需重新测评，请联系主管部门重新发起</p>
        </div>
      </div>
    );
  }

  const currentGroup = STEP_GROUPS[step];
  const currentQuestions = ASSESSMENT_QUESTIONS.filter((q) =>
    currentGroup.ids.includes(q.id),
  );

  const stepAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);

  function handleSelect(questionId: string, value: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      handleSubmit();
    }
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function handleSubmit() {
    setSubmitting(true);
    const score = scoreAssessment(answers);
    const updated: AssessmentRecord = {
      ...record!,
      status: "completed",
      source: "enterprise_self",
      submitterName: "企业自填",
      answers,
      score,
      submittedAt: new Date().toISOString(),
    };
    saveAssessmentRecord(updated);
    router.push(`/assessment/${token}/result`);
  }

  return (
    <div className="min-h-screen bg-[#f7f8fa]">
      {/* Header */}
      <div className="bg-white border-b border-[#e5e7eb] px-4 py-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto">
          <p className="text-xs text-[#94a3b8] mb-0.5">高企资质测评</p>
          <h1 className="text-base font-bold text-[#0f172a] truncate">{companyName}</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Progress */}
        <ProgressBar step={step} />

        {/* Step title */}
        <h2 className="text-base font-semibold text-[#0f172a] mb-4">
          {step + 1}. {currentGroup.title}
        </h2>

        {/* Questions */}
        <div className="space-y-5">
          {currentQuestions.map((q) => (
            <div key={q.id} className="bg-white rounded-xl border border-[#e5e7eb] p-4 space-y-3">
              <div>
                <p className="text-sm font-medium text-[#0f172a] leading-snug">{q.text}</p>
                {q.hint && (
                  <p className="text-xs text-[#94a3b8] mt-1 leading-relaxed">{q.hint}</p>
                )}
              </div>
              <div className="space-y-2">
                {q.options.map((opt) => {
                  const selected = answers[q.id] === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(q.id, opt.value)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all",
                        selected
                          ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                          : "border-[#e5e7eb] bg-white text-[#475569] hover:border-blue-300 hover:bg-blue-50/50",
                      )}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Nav buttons */}
        <div className="flex gap-3 mt-6">
          {step > 0 && (
            <button
              onClick={handleBack}
              className="flex items-center gap-1 px-4 py-3 border border-[#e5e7eb] rounded-xl text-sm text-[#475569] hover:bg-[#f7f8fa] transition-colors"
            >
              <ChevronLeft size={16} />
              上一步
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!stepAnswered || submitting}
            className={cn(
              "flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium transition-colors",
              stepAnswered && !submitting
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-[#e5e7eb] text-[#94a3b8] cursor-not-allowed",
            )}
          >
            {step < TOTAL_STEPS - 1 ? (
              <>
                下一步 <ChevronRight size={16} />
              </>
            ) : submitting ? (
              "提交中…"
            ) : (
              "提交测评"
            )}
          </button>
        </div>

        <p className="text-center text-xs text-[#94a3b8] mt-4">
          第 {step + 1} 步，共 {TOTAL_STEPS} 步
        </p>
      </div>
    </div>
  );
}
