/**
 * Mock RAG engine for the AI agent Q&A section.
 * Simulates retrieval-augmented generation by matching user questions
 * to templates and pulling live statistics from mock-data.ts / renewal-data.ts.
 */

import { getAllCompanies, getPotentialTargets, getDashboardKPI, getAllTasks } from "./mock-data";
import { getCertifiedCompanies } from "./renewal-data";
import type { Company } from "./types";

// ─── Public types ────────────────────────────────────────────────────────────

export interface SourceCard {
  id: string;
  title: string;
  subtitle: string;
  tag: string;
  tagColor: "blue" | "green" | "yellow" | "red" | "purple" | "gray";
  snippet: string;
}

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
  sources?: SourceCard[];
  followUps?: string[];
  thinkingMs?: number;
}

// ─── Guided question bank ────────────────────────────────────────────────────

export interface GuidedQuestion {
  id: string;
  label: string;
  category: "overview" | "renewal" | "task" | "analysis" | "risk" | "company";
  icon: string;
}

export const GUIDED_QUESTIONS: GuidedQuestion[] = [
  // 概览
  { id: "q1", label: "当前标的池整体情况如何？", category: "overview", icon: "📊" },
  { id: "q2", label: "各街道高潜力企业分布情况？", category: "overview", icon: "🗺️" },
  { id: "q3", label: "今年高企申报目标完成进度？", category: "overview", icon: "🎯" },
  // 复审
  { id: "q4", label: "哪些企业复审期限最紧迫？", category: "renewal", icon: "⏰" },
  { id: "q5", label: "复审准备度不足的企业有哪些？", category: "renewal", icon: "⚠️" },
  // 任务
  { id: "q6", label: "本期任务完成情况如何？", category: "task", icon: "✅" },
  // 分析
  { id: "q7", label: "电子信息领域企业研发投入分析", category: "analysis", icon: "🔬" },
  { id: "q8", label: "哪类技术领域企业数量最多？", category: "analysis", icon: "📈" },
  // 风险
  { id: "q9", label: "有哪些企业存在合规或经营风险？", category: "risk", icon: "🚨" },
  // 企业画像
  { id: "q10", label: "近三年知识产权增长最快的企业？", category: "company", icon: "💡" },
  { id: "q11", label: "未接触的高潜力企业有哪些？", category: "company", icon: "🌟" },
  { id: "q12", label: "注册资本最高的潜在标的企业？", category: "company", icon: "🏢" },
];

// ─── Category pill groups for the UI ────────────────────────────────────────

export interface QuestionCategory {
  key: string;
  label: string;
  questions: GuidedQuestion[];
}

export const QUESTION_CATEGORIES: QuestionCategory[] = [
  { key: "overview", label: "全局概览", questions: GUIDED_QUESTIONS.filter((q) => q.category === "overview") },
  { key: "renewal",  label: "复审预警", questions: GUIDED_QUESTIONS.filter((q) => q.category === "renewal") },
  { key: "task",     label: "任务进度", questions: GUIDED_QUESTIONS.filter((q) => q.category === "task") },
  { key: "analysis", label: "技术分析", questions: GUIDED_QUESTIONS.filter((q) => q.category === "analysis") },
  { key: "risk",     label: "风险预警", questions: GUIDED_QUESTIONS.filter((q) => q.category === "risk") },
  { key: "company",  label: "企业画像", questions: GUIDED_QUESTIONS.filter((q) => q.category === "company") },
];

// ─── Follow-up banks per question ───────────────────────────────────────────

const FOLLOW_UPS: Record<string, string[]> = {
  q1:  ["各技术领域潜在标的各有多少？", "申报意愿强烈的企业集中在哪些街道？", "标的池中有多少企业已进入科技型中小企业库？"],
  q2:  ["临空港经开区的企业以哪些技术领域为主？", "哪些街道拥有最多发明专利的企业？", "各街道企业的平均成立年限如何？"],
  q3:  ["距年度目标还差多少家？", "上半年完成率与去年同期对比？", "哪些街道今年申报成功率最高？"],
  q4:  ["这些紧迫企业的复审准备度评分如何？", "已逾期未完成复审的企业有几家？", "6个月内到期的企业主要集中在哪些领域？"],
  q5:  ["研发投入比不达标的企业有哪些？", "知识产权增长不足的企业如何补救？", "针对这些企业有哪些辅导建议？"],
  q6:  ["未完成任务中哪些已超出截止日期？", "哪位走访员完成率最高？", "任务积压最多的是哪个街道？"],
  q7:  ["生物与新医药领域的研发投入如何对比？", "电子信息企业平均研发人员占比是多少？", "研发投入最高的前五家电子信息企业？"],
  q8:  ["增速最快的技术领域是？", "各领域企业平均成立年龄对比？", "知识产权最密集的是哪个领域？"],
  q9:  ["这些风险企业是否已被纳入走访任务？", "有处罚记录的企业还能申报高企吗？", "经营异常的企业数量近年趋势？"],
  q10: ["这些企业知识产权以哪类为主？", "发明专利占比高的企业有哪些优势？", "如何对知识产权薄弱的企业提供指导？"],
  q11: ["未接触企业的规模分布如何？", "如何优先安排走访顺序？", "这些企业在哪些街道最集中？"],
  q12: ["注册资本高是否意味着研发投入更高？", "这些大型企业的申报意愿如何？", "注册资本与知识产权数量是否正相关？"],
  default: ["能否给出更详细的数据分析？", "相关企业有哪些应对建议？", "这些数据与去年同期相比如何？"],
};

// ─── RAG response generator ──────────────────────────────────────────────────

function topN<T>(arr: T[], n: number, score: (x: T) => number): T[] {
  return [...arr].sort((a, b) => score(b) - score(a)).slice(0, n);
}

function companyToSource(c: Company, tag: string, tagColor: SourceCard["tagColor"]): SourceCard {
  const totalIP = c.patents.invention + c.patents.utility + c.patents.design + c.software;
  return {
    id: c.id,
    title: c.name,
    subtitle: `${c.street} · ${c.techField ?? "未分类"} · 成立于 ${c.establishedAt.slice(0, 4)}`,
    tag,
    tagColor,
    snippet: `参保人数 ${c.employees} 人，研发人员 ${c.rdEmployees} 人，知识产权合计 ${totalIP} 项（发明 ${c.patents.invention}）`,
  };
}

export async function askAgent(question: string, questionId?: string): Promise<AgentMessage> {
  // Simulate retrieval latency
  await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));

  const companies = getAllCompanies();
  const targets = getPotentialTargets();
  const certified = getCertifiedCompanies();
  const tasks = getAllTasks();
  const kpi = getDashboardKPI();

  const qid = questionId ?? "default";
  const followUps = FOLLOW_UPS[qid] ?? FOLLOW_UPS.default;

  // ─── q1 全局概览 ────────────────────────────────────────────────
  if (qid === "q1" || question.includes("标的池") || question.includes("整体")) {
    const topTargets = topN(targets, 3, (c) => c.patents.invention * 3 + c.rdEmployees);
    return {
      role: "assistant",
      content: `**当前标的池概况**

截至今日，标的池共收录潜在申报企业 **${targets.length}** 家，其中：

- **申报意愿强烈** 的企业 ${targets.filter((c) => c.declarationWillingness === "strong").length} 家，可直接启动辅导流程
- **基本意愿** 企业 ${targets.filter((c) => c.declarationWillingness === "moderate").length} 家，建议近期跟进
- **未接触** 企业 ${targets.filter((c) => c.declarationWillingness === "unknown").length} 家，需排查走访优先级

从技术领域看，**电子信息**（${kpi.byField["电子信息"] ?? 0} 家）和**先进制造与自动化**（${kpi.byField["先进制造与自动化"] ?? 0} 家）是最大的两个赛道。

知识产权维度，综合发明专利与研发人员规模，以下三家企业综合指标最突出，建议优先跟进。`,
      sources: topTargets.map((c) => companyToSource(c, "高潜力", "blue")),
      followUps,
    };
  }

  // ─── q2 街道分布 ────────────────────────────────────────────────
  if (qid === "q2" || question.includes("街道") || question.includes("分布")) {
    const sorted = Object.entries(kpi.byStreet).sort((a, b) => b[1] - a[1]);
    const top3Streets = sorted.slice(0, 3).map(([s, n]) => `**${s}**（${n} 家）`).join("、");
    const topStreetName = sorted[0]?.[0];
    const topStreetCompanies = topN(
      targets.filter((c) => c.street === topStreetName),
      3,
      (c) => c.rdEmployees + c.patents.invention * 2
    );
    return {
      role: "assistant",
      content: `**各街道高潜力企业分布**

标的池中企业分布最集中的三个园区/街道为：${top3Streets}，合计占全部潜在标的的 ${Math.round(sorted.slice(0, 3).reduce((s, [, n]) => s + n, 0) / targets.length * 100)}%。

**${topStreetName}** 以 ${sorted[0]?.[1]} 家高居首位，该园区以电子信息和高技术服务为主，企业整体研发密度较高，是今年申报攻坚的核心区域。

以下是该园区综合得分最高的代表性企业：`,
      sources: topStreetCompanies.map((c) => companyToSource(c, topStreetName ?? "重点街道", "purple")),
      followUps,
    };
  }

  // ─── q3 目标进度 ────────────────────────────────────────────────
  if (qid === "q3" || question.includes("目标") || question.includes("进度") || question.includes("完成")) {
    const pct = Math.round((kpi.certified / kpi.yearGoal) * 100);
    const gap = kpi.yearGoal - kpi.certified;
    return {
      role: "assistant",
      content: `**年度高企申报目标完成进度**

| 指标 | 数值 |
|------|------|
| 年度申报目标 | **${kpi.yearGoal}** 家 |
| 已认定通过 | **${kpi.certified}** 家 |
| 完成率 | **${pct}%** |
| 尚需完成 | **${gap}** 家 |
| 预测全年完成 | **${kpi.estimatedCompletion}** 家 |

当前进度超过目标的 **${kpi.estimatedCompletion - kpi.yearGoal}** 家，预测全年可超额完成。

主要驱动因素：
1. 标的池中意愿强烈的企业存量充足（${targets.filter((c) => c.declarationWillingness === "strong").length} 家）
2. 复审企业 ${certified.length} 家，贡献稳定增量
3. 各街道任务跟进率持续提升

建议关注尚未接触的 **${targets.filter((c) => c.declarationWillingness === "unknown").length}** 家未接触企业，可能存在潜在申报机会。`,
      sources: [],
      followUps,
    };
  }

  // ─── q4 复审紧迫 ────────────────────────────────────────────────
  if (qid === "q4" || question.includes("复审") || question.includes("紧迫") || question.includes("到期")) {
    const urgent = certified.filter((c) => c.renewalStatus === "critical" || c.renewalStatus === "overdue");
    const top3 = urgent.slice(0, 3);
    return {
      role: "assistant",
      content: `**复审紧迫企业清单**

当前共有 **${urgent.length}** 家已认定高企处于紧急或逾期状态：

- **已逾期**（overdue）：${certified.filter((c) => c.renewalStatus === "overdue").length} 家，需立即启动补救流程
- **6 个月内到期**（critical）：${certified.filter((c) => c.renewalStatus === "critical").length} 家，建议本周内完成材料预审

另有 **${certified.filter((c) => c.renewalStatus === "approaching").length}** 家处于 6-12 个月预警期，需纳入近期走访计划。

以下为最紧迫的几家企业（按到期紧迫度排序）：`,
      sources: top3.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: `${c.street} · 认定年份 ${c.certifiedYear} · 到期年份 ${c.expiryYear}`,
        tag: c.renewalStatus === "overdue" ? "已逾期" : "6个月内到期",
        tagColor: c.renewalStatus === "overdue" ? "red" : "yellow",
        snippet: `证书编号 ${c.certNo}，研发投入比近三年均值 ${((c.threeYearMetrics.rdExpenseRatioY1 + c.threeYearMetrics.rdExpenseRatioY2 + c.threeYearMetrics.rdExpenseRatioY3) / 3).toFixed(1)}%`,
      } as SourceCard)),
      followUps,
    };
  }

  // ─── q5 复审准备度不足 ──────────────────────────────────────────
  if (qid === "q5" || question.includes("准备度") || question.includes("不足")) {
    const weak = certified
      .filter((c) => {
        const avgRd = (c.threeYearMetrics.rdExpenseRatioY1 + c.threeYearMetrics.rdExpenseRatioY2 + c.threeYearMetrics.rdExpenseRatioY3) / 3;
        const avgHi = (c.threeYearMetrics.hiTechRevenueRatioY1 + c.threeYearMetrics.hiTechRevenueRatioY2 + c.threeYearMetrics.hiTechRevenueRatioY3) / 3;
        return avgRd < 5 || avgHi < 60;
      })
      .slice(0, 3);
    return {
      role: "assistant",
      content: `**复审准备度不足的企业分析**

根据高企认定标准，复审核心指标要求：
- 研发费用占收入比 ≥ **3%**（500强以上企业 ≥ 2%）
- 高新技术产品（服务）收入占总收入 ≥ **60%**
- 研发人员占比 ≥ **10%**

当前有 **${certified.filter((c) => {
  const avg = (c.threeYearMetrics.rdExpenseRatioY1 + c.threeYearMetrics.rdExpenseRatioY2 + c.threeYearMetrics.rdExpenseRatioY3) / 3;
  return avg < 5;
}).length}** 家企业研发投入比偏低（均值 < 5%），**${certified.filter((c) => {
  const avg = (c.threeYearMetrics.hiTechRevenueRatioY1 + c.threeYearMetrics.hiTechRevenueRatioY2 + c.threeYearMetrics.hiTechRevenueRatioY3) / 3;
  return avg < 60;
}).length}** 家高新收入占比未达标。

建议针对这些企业制定专项辅导方案，重点提升研发投入归集规范性和高新产品收入核算。`,
      sources: weak.map((c) => {
        const avgRd = ((c.threeYearMetrics.rdExpenseRatioY1 + c.threeYearMetrics.rdExpenseRatioY2 + c.threeYearMetrics.rdExpenseRatioY3) / 3).toFixed(1);
        return {
          id: c.id,
          title: c.name,
          subtitle: `${c.street} · ${c.techField ?? "未分类"}`,
          tag: "需辅导",
          tagColor: "yellow" as const,
          snippet: `三年研发投入比均值 ${avgRd}%，高新收入比均值 ${((c.threeYearMetrics.hiTechRevenueRatioY1 + c.threeYearMetrics.hiTechRevenueRatioY2 + c.threeYearMetrics.hiTechRevenueRatioY3) / 3).toFixed(1)}%`,
        };
      }),
      followUps,
    };
  }

  // ─── q6 任务进度 ─────────────────────────────────────────────────
  if (qid === "q6" || question.includes("任务") || question.includes("走访")) {
    const done = tasks.filter((t) => t.status === "done").length;
    const inProgress = tasks.filter((t) => t.status === "in_progress").length;
    const pending = tasks.filter((t) => t.status === "pending").length;
    const overdue = tasks.filter((t) => t.status !== "done" && new Date(t.deadline) < new Date("2026-04-28")).length;
    return {
      role: "assistant",
      content: `**本期任务完成情况**

| 状态 | 数量 | 占比 |
|------|------|------|
| ✅ 已完成 | ${done} | ${Math.round(done / tasks.length * 100)}% |
| 🔄 进行中 | ${inProgress} | ${Math.round(inProgress / tasks.length * 100)}% |
| ⏳ 待启动 | ${pending} | ${Math.round(pending / tasks.length * 100)}% |
| 🔴 已超期 | ${overdue} | — |

整体完成率 **${Math.round(done / tasks.length * 100)}%**，当前有 **${overdue}** 条任务已超出截止日期，建议立即跟进。

进行中的任务主要分布在：${[...new Set(tasks.filter((t) => t.status === "in_progress").map((t) => t.street))].join("、") || "各街道均有分布"}。`,
      sources: tasks
        .filter((t) => t.status !== "done" && new Date(t.deadline) < new Date("2026-04-28"))
        .slice(0, 3)
        .map((t) => ({
          id: t.id,
          title: t.companyName,
          subtitle: `${t.street} · 负责人：${t.assignee}`,
          tag: "已超期",
          tagColor: "red" as const,
          snippet: `截止日期 ${t.deadline}，${t.notes || "暂无备注"}`,
        })),
      followUps,
    };
  }

  // ─── q7 电子信息研发 ─────────────────────────────────────────────
  if (qid === "q7" || (question.includes("电子信息") && (question.includes("研发") || question.includes("投入")))) {
    const eiCompanies = targets.filter((c) => c.techField === "电子信息");
    const avgRdRatio = eiCompanies.reduce((s, c) => s + (c.rdEmployees / Math.max(c.employees, 1)), 0) / Math.max(eiCompanies.length, 1);
    const top3 = topN(eiCompanies, 3, (c) => c.rdEmployees);
    return {
      role: "assistant",
      content: `**电子信息领域企业研发投入分析**

标的池中电子信息领域共有 **${eiCompanies.length}** 家潜在标的企业，主要分布于国家网安基地和临空港经开区。

**研发人员结构：**
- 研发人员占比均值：**${(avgRdRatio * 100).toFixed(1)}%**（高企要求 ≥10%）
- 达标企业（研发占比 ≥10%）：${eiCompanies.filter((c) => c.rdEmployees / Math.max(c.employees, 1) >= 0.1).length} 家
- 研发人员总数最高企业：${top3[0]?.name ?? "—"}（${top3[0]?.rdEmployees ?? 0} 人）

**知识产权密度：**
- 电子信息企业平均发明专利 ${(eiCompanies.reduce((s, c) => s + c.patents.invention, 0) / Math.max(eiCompanies.length, 1)).toFixed(1)} 项
- 软件著作权均值 ${(eiCompanies.reduce((s, c) => s + c.software, 0) / Math.max(eiCompanies.length, 1)).toFixed(1)} 项

以下为研发人员规模最大的代表企业：`,
      sources: top3.map((c) => companyToSource(c, "电子信息", "blue")),
      followUps,
    };
  }

  // ─── q8 技术领域分布 ─────────────────────────────────────────────
  if (qid === "q8" || question.includes("领域") || question.includes("技术")) {
    const sorted = Object.entries(kpi.byField).sort((a, b) => b[1] - a[1]);
    const top1 = sorted[0];
    const top1Companies = topN(targets.filter((c) => c.techField === top1?.[0]), 3, (c) => c.patents.invention + c.rdEmployees);
    return {
      role: "assistant",
      content: `**技术领域企业数量分布**

${sorted.map(([field, count], i) => `${i + 1}. **${field}**：${count} 家（${Math.round(count / targets.length * 100)}%）`).join("\n")}

**${top1?.[0]}** 以 ${top1?.[1]} 家高居首位，占全部潜在标的的 **${Math.round((top1?.[1] ?? 0) / targets.length * 100)}%**。

该领域企业知识产权密集度高，平均发明专利 ${(
  targets.filter((c) => c.techField === top1?.[0]).reduce((s, c) => s + c.patents.invention, 0) /
  Math.max(targets.filter((c) => c.techField === top1?.[0]).length, 1)
).toFixed(1)} 项，是最具申报优势的赛道。`,
      sources: top1Companies.map((c) => companyToSource(c, top1?.[0] ?? "重点领域", "blue")),
      followUps,
    };
  }

  // ─── q9 风险企业 ─────────────────────────────────────────────────
  if (qid === "q9" || question.includes("风险") || question.includes("合规") || question.includes("异常")) {
    const risky = companies.filter((c) => c.risk.abnormal || c.risk.penalty);
    const top3 = risky.slice(0, 3);
    return {
      role: "assistant",
      content: `**企业风险预警分析**

当前全库共有 **${risky.length}** 家企业存在合规或经营风险：

- **经营异常**：${companies.filter((c) => c.risk.abnormal).length} 家（列入工商异常名录，申报前须移除）
- **行政处罚记录**：${companies.filter((c) => c.risk.penalty).length} 家（近三年有处罚记录，影响高企资质认定）

> ⚠️ 高企申报要求企业近三年内无重大违法违规记录，上述企业须在整改完成后方可申报。

建议将这些企业暂时移出主动申报跟进队列，待合规状态恢复后再行评估。`,
      sources: top3.map((c) => ({
        id: c.id,
        title: c.name,
        subtitle: `${c.street} · ${c.techField ?? "未分类"}`,
        tag: c.risk.penalty ? "处罚记录" : "经营异常",
        tagColor: "red" as const,
        snippet: `${c.risk.abnormal ? "列入经营异常名录；" : ""}${c.risk.penalty ? "近三年有行政处罚记录" : ""}`,
      })),
      followUps,
    };
  }

  // ─── q10 知识产权增长 ────────────────────────────────────────────
  if (qid === "q10" || question.includes("知识产权") || question.includes("专利")) {
    const top5 = topN(targets, 5, (c) => c.patents.invention * 3 + c.patents.utility + c.software);
    return {
      role: "assistant",
      content: `**知识产权综合增长最快企业 TOP 5**

（综合评分 = 发明专利 × 3 + 实用新型 + 软著）

${top5.map((c, i) => {
  const score = c.patents.invention * 3 + c.patents.utility + c.software;
  return `${i + 1}. **${c.name}** — 综合得分 ${score}（发明 ${c.patents.invention} / 实用 ${c.patents.utility} / 软著 ${c.software}）`;
}).join("\n")}

发明专利是高企认定的核心加分项，建议重点关注排名前三的企业，在申报前协助其完善专利文献和知识产权维权体系。`,
      sources: top5.slice(0, 3).map((c) => companyToSource(c, "IP 强", "green")),
      followUps,
    };
  }

  // ─── q11 未接触企业 ──────────────────────────────────────────────
  if (qid === "q11" || question.includes("未接触")) {
    const untouched = topN(
      targets.filter((c) => c.declarationWillingness === "unknown"),
      3,
      (c) => c.rdEmployees + c.patents.invention * 2
    );
    const total = targets.filter((c) => c.declarationWillingness === "unknown").length;
    return {
      role: "assistant",
      content: `**未接触高潜力企业分析**

标的池中共有 **${total}** 家企业尚未进行任何接触（意愿状态为"未接触"）。

这些企业虽然未有明确申报意愿记录，但按研发指标综合评估，部分企业的潜力可能不亚于已在跟进的企业。

**推荐优先走访的未接触企业**（按研发规模 × 知识产权综合排序）：`,
      sources: untouched.map((c) => companyToSource(c, "待挖掘", "gray")),
      followUps,
    };
  }

  // ─── q12 注册资本 ────────────────────────────────────────────────
  if (qid === "q12" || question.includes("注册资本") || question.includes("规模")) {
    const top3 = topN(targets, 3, (c) => c.registeredCapital);
    return {
      role: "assistant",
      content: `**注册资本最高的潜在标的企业**

| 排名 | 企业名称 | 注册资本（万元）| 技术领域 | 街道 |
|------|----------|----------------|----------|------|
${top3.map((c, i) => `| ${i + 1} | ${c.name} | **${c.registeredCapital.toLocaleString()}** | ${c.techField ?? "—"} | ${c.street} |`).join("\n")}

注意：注册资本规模与研发投入强度并非线性正相关。大型企业申报高企时需重点审查高新技术产品收入占比，避免因主营业务过于多元化而导致收入占比不达标。`,
      sources: top3.map((c) => companyToSource(c, `${c.registeredCapital.toLocaleString()} 万`, "purple")),
      followUps,
    };
  }

  // ─── 默认兜底回答 ────────────────────────────────────────────────
  const topTargets = topN(targets, 3, (c) => c.patents.invention + c.rdEmployees);
  return {
    role: "assistant",
    content: `我已检索标的库中 **${companies.length}** 家企业数据，但暂时没有找到与您问题完全匹配的精确答案。

以下是一些可能相关的信息：
- 当前标的池中潜在申报企业 **${targets.length}** 家
- 已认定高企 **${certified.length}** 家，其中 ${certified.filter((c) => c.renewalStatus === "critical" || c.renewalStatus === "overdue").length} 家处于复审紧迫状态
- 本期任务总计 **${tasks.length}** 条，完成率 ${Math.round(tasks.filter((t) => t.status === "done").length / tasks.length * 100)}%

您可以尝试使用下方的引导问题，或换一种表述方式提问。`,
    sources: topTargets.map((c) => companyToSource(c, "高潜力", "blue")),
    followUps: FOLLOW_UPS.default,
  };
}
