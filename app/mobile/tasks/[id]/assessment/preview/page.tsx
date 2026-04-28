"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllTasks } from "@/lib/mock-data";
import {
  generateToken,
  saveAssessmentRecord,
  getLatestPendingByCompany,
} from "@/lib/assessment-store";
import { scoreAssessment, ASSESSMENT_QUESTIONS } from "@/lib/assessment";
import type { AssessmentAnswers, AssessmentRecord } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function AssessmentPreviewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [answers, setAnswers] = useState<AssessmentAnswers | null>(null);
  const [visitorName, setVisitorName] = useState("");
  const [visitorId, setVisitorId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const raw = sessionStorage.getItem(`assessment_form_${id}`);
    if (!raw) {
      router.replace(`/mobile/tasks/${id}/assessment`);
      return;
    }
    const parsed = JSON.parse(raw) as {
      answers: AssessmentAnswers;
      visitorId: string;
      visitorName: string;
    };
    setAnswers(parsed.answers);
    setVisitorId(parsed.visitorId);
    setVisitorName(parsed.visitorName);
  }, [id, router]);

  const task = getAllTasks().find((t) => t.id === id);
  if (!task) return null;

  function handleSubmit() {
    if (!answers) return;
    setSubmitting(true);
    const score = scoreAssessment(answers);

    const existing = getLatestPendingByCompany(task!.companyId);
    const token = existing?.token ?? generateToken();
    const baseId = existing?.id ?? `ar_${Date.now()}`;

    const record: AssessmentRecord = {
      id: baseId,
      companyId: task!.companyId,
      token,
      source: "staff_agent",
      status: "completed",
      createdAt: existing?.createdAt ?? new Date().toISOString(),
      submittedAt: new Date().toISOString(),
      submitterName: visitorName,
      answers,
      score,
      taskId: id,
    };
    saveAssessmentRecord(record);
    sessionStorage.removeItem(`assessment_form_${id}`);
    router.replace(`/mobile/tasks/${id}/assessment/success`);
  }

  if (!answers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-400 text-sm">加载中…</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-12 pb-3 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-1.5 -ml-1.5 rounded-lg text-gray-400 active:bg-gray-100"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="text-xs text-gray-400">确认提交</p>
          <h1 className="text-sm font-bold text-gray-800">测评内容预览</h1>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-4 pb-28">
        <p className="text-xs text-gray-400">请核对以下答案，确认无误后提交</p>

        {ASSESSMENT_QUESTIONS.map((q) => {
          const chosenValue = answers[q.id];
          const chosenOpt = q.options.find((o) => o.value === chosenValue);
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
            >
              <p className="text-xs text-gray-500 leading-snug mb-2">{q.text}</p>
              <div
                className={cn(
                  "px-3 py-2 rounded-xl text-sm font-medium",
                  chosenOpt
                    ? "bg-blue-50 text-blue-700 border border-blue-200"
                    : "bg-gray-100 text-gray-400",
                )}
              >
                {chosenOpt?.label ?? "未作答"}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 space-y-2 safe-bottom">
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className={cn(
            "w-full py-3.5 rounded-xl text-sm font-semibold transition-colors active:scale-[0.98]",
            submitting
              ? "bg-gray-200 text-gray-400 cursor-not-allowed"
              : "bg-blue-600 text-white",
          )}
        >
          {submitting ? "提交中…" : "确认提交"}
        </button>
        <button
          onClick={() => router.back()}
          className="w-full py-2.5 rounded-xl text-sm font-medium text-gray-500"
        >
          返回修改
        </button>
      </div>
    </div>
  );
}
