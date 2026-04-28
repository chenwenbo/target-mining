"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { getAllTasks, getCompanyById } from "@/lib/mock-data";
import { getCurrentVisitor, } from "@/lib/mobile-mock";
import {
  saveAssessmentDraft,
  getAssessmentDraft,
  clearAssessmentDraft,
} from "@/lib/assessment-store";
import { ASSESSMENT_QUESTIONS } from "@/lib/assessment";
import type { AssessmentAnswers, Visitor } from "@/lib/types";
import { cn } from "@/lib/cn";

const STEP_GROUPS = [
  { title: "研发投入情况", ids: ["rd_expense_ratio", "rd_accounting_separate", "rd_staff_ratio", "has_rd_dept"] },
  { title: "知识产权情况", ids: ["invention_patents", "utility_patents", "software_copyrights"] },
  { title: "收入结构与管理", ids: ["hi_tech_revenue_ratio", "has_accounting_firm", "annual_audit", "compliance_clean"] },
];

const TOTAL_STEPS = STEP_GROUPS.length;

export default function MobileAssessmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswers>({});

  useEffect(() => {
    const v = getCurrentVisitor();
    if (!v) {
      router.replace("/mobile/login");
      return;
    }
    setVisitor(v);
    const draft = getAssessmentDraft(id);
    if (draft) setAnswers(draft);
  }, [id, router]);

  const task = getAllTasks().find((t) => t.id === id);
  const company = task ? getCompanyById(task.companyId) : null;

  if (!task || !company) return null;

  const currentGroup = STEP_GROUPS[step];
  const currentQuestions = ASSESSMENT_QUESTIONS.filter((q) =>
    currentGroup.ids.includes(q.id),
  );
  const stepAnswered = currentQuestions.every((q) => answers[q.id] !== undefined);

  function handleSelect(questionId: string, value: string) {
    const next = { ...answers, [questionId]: value };
    setAnswers(next);
    saveAssessmentDraft(id, next);
  }

  function handleBack() {
    if (step > 0) {
      setStep((s) => s - 1);
    } else {
      saveAssessmentDraft(id, answers);
      router.back();
    }
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      clearAssessmentDraft(id);
      sessionStorage.setItem(
        `assessment_form_${id}`,
        JSON.stringify({ answers, visitorId: visitor!.id, visitorName: visitor!.name }),
      );
      router.push(`/mobile/tasks/${id}/assessment/preview`);
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-3 flex items-center gap-3">
        <button onClick={handleBack} className="p-1.5 -ml-1.5 rounded-lg text-gray-400 active:bg-gray-100">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-400 mb-0.5">填写专业测评</p>
          <h1 className="text-sm font-bold text-gray-800 truncate">{company.name}</h1>
        </div>
      </div>

      {/* Step indicator */}
      <div className="bg-white px-4 py-3 border-b border-gray-100">
        <div className="flex items-center gap-2">
          {STEP_GROUPS.map((g, i) => (
            <div key={i} className="flex-1">
              <div
                className={cn(
                  "h-1.5 rounded-full transition-colors mb-1",
                  i < step ? "bg-blue-600" : i === step ? "bg-blue-400" : "bg-gray-200",
                )}
              />
              <p
                className={cn(
                  "text-[10px] text-center truncate",
                  i === step ? "text-blue-600 font-medium" : "text-gray-400",
                )}
              >
                {g.title}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Questions */}
      <div className="flex-1 px-4 py-4 space-y-4 pb-28">
        <h2 className="text-sm font-semibold text-gray-800">
          {step + 1}. {currentGroup.title}
        </h2>

        {currentQuestions.map((q) => (
          <div key={q.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-800 leading-snug">{q.text}</p>
              {q.hint && (
                <p className="text-xs text-gray-400 mt-1 leading-relaxed">{q.hint}</p>
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
                      "w-full text-left px-4 py-3 rounded-xl border text-sm transition-all active:scale-[0.98]",
                      selected
                        ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                        : "border-gray-200 bg-white text-gray-600",
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

      {/* Bottom button */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 safe-bottom">
        <button
          onClick={handleNext}
          disabled={!stepAnswered}
          className={cn(
            "w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98]",
            stepAnswered
              ? "bg-blue-600 text-white"
              : "bg-gray-200 text-gray-400 cursor-not-allowed",
          )}
        >
          {step < TOTAL_STEPS - 1 ? (
            <>
              下一步 <ChevronRight size={16} />
            </>
          ) : (
            "预览并提交"
          )}
        </button>
        <p className="text-center text-xs text-gray-400 mt-2">
          第 {step + 1} 步，共 {TOTAL_STEPS} 步
        </p>
      </div>
    </div>
  );
}
