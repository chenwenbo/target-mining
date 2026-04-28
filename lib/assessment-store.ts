import type { AssessmentRecord, AssessmentAnswers } from "./types";

const RECORDS_KEY = "assessment_records";
const DRAFT_KEY_PREFIX = "assessment_draft_";

export function generateToken(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return "arm_" + crypto.randomUUID().replace(/-/g, "");
  }
  return (
    "arm_" +
    Array.from({ length: 32 }, () =>
      Math.floor(Math.random() * 16).toString(16),
    ).join("")
  );
}

export function buildShareUrl(token: string): string {
  if (typeof window === "undefined") return `/assessment/${token}`;
  return `${window.location.origin}/assessment/${token}`;
}

function readRecords(): AssessmentRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? (JSON.parse(raw) as AssessmentRecord[]) : [];
  } catch {
    return [];
  }
}

function writeRecords(records: AssessmentRecord[]): void {
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function getAssessmentRecords(): AssessmentRecord[] {
  return readRecords();
}

export function saveAssessmentRecord(record: AssessmentRecord): void {
  const records = readRecords();
  const idx = records.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    records[idx] = record;
  } else {
    records.push(record);
  }
  writeRecords(records);
}

export function getAssessmentRecordsByCompany(
  companyId: string,
): AssessmentRecord[] {
  return readRecords().filter((r) => r.companyId === companyId);
}

export function getAssessmentRecordByToken(
  token: string,
): AssessmentRecord | undefined {
  return readRecords().find((r) => r.token === token);
}

export function getLatestCompletedByCompany(
  companyId: string,
): AssessmentRecord | undefined {
  return readRecords()
    .filter((r) => r.companyId === companyId && r.status === "completed")
    .sort(
      (a, b) =>
        new Date(b.submittedAt!).getTime() - new Date(a.submittedAt!).getTime(),
    )[0];
}

export function getLatestPendingByCompany(
  companyId: string,
): AssessmentRecord | undefined {
  return readRecords()
    .filter((r) => r.companyId === companyId && r.status === "pending")
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )[0];
}

export function saveAssessmentDraft(
  taskId: string,
  data: AssessmentAnswers,
): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    `${DRAFT_KEY_PREFIX}${taskId}`,
    JSON.stringify(data),
  );
}

export function getAssessmentDraft(taskId: string): AssessmentAnswers | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(`${DRAFT_KEY_PREFIX}${taskId}`);
    return raw ? (JSON.parse(raw) as AssessmentAnswers) : null;
  } catch {
    return null;
  }
}

export function clearAssessmentDraft(taskId: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${DRAFT_KEY_PREFIX}${taskId}`);
}
