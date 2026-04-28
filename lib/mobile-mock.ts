import type { Visitor, VisitRecord, TaskStatus } from "./types";

// ─── Mock 走访人员（与 tasks.json 的 assignee 字段对应）──────────
export const MOCK_VISITORS: Visitor[] = [
  { id: "v1", name: "王科员", street: "国家网安基地", dept: "国家网安基地管委会" },
  { id: "v2", name: "李科员", street: null,          dept: "科创局·高新处" },
  { id: "v3", name: "张科员", street: "金银湖街道",   dept: "金银湖街道办事处" },
  { id: "v4", name: "赵科员", street: "将军路街道",   dept: "将军路街道办事处" },
];

// ─── SessionStorage：当前用户 ────────────────────────────────────
const VISITOR_KEY = "current_visitor";

export function getCurrentVisitor(): Visitor | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(VISITOR_KEY);
    return raw ? (JSON.parse(raw) as Visitor) : null;
  } catch {
    return null;
  }
}

export function setCurrentVisitor(visitor: Visitor): void {
  sessionStorage.setItem(VISITOR_KEY, JSON.stringify(visitor));
}

export function clearCurrentVisitor(): void {
  sessionStorage.removeItem(VISITOR_KEY);
}

// ─── LocalStorage：走访记录 ──────────────────────────────────────
const RECORDS_KEY = "visit_records";

// 种子数据：当 localStorage 为空时提供默认走访记录
const SEED_VISIT_RECORDS: VisitRecord[] = [
  // ── 王科员 (v1) ──
  {
    id: "vr001", taskId: "t001", companyId: "c0061", visitorId: "v1", visitorName: "王科员",
    visitMethod: "in_person", visitedAt: "2026-04-15T10:30:00", visitDurationMinutes: 65,
    contactReached: true, actualContactName: "刘总", actualContactTitle: "总经理", actualContactPhone: "13800138001",
    willingness: "strong", willingnessNotes: "企业非常积极，已有研发团队和专利储备，主动询问申报时间节点",
    fieldVerified: { employeeCount: 128, rdEmployeeCount: 34, annualRevenue: "2000w_1yi", rdExpenseRatio: "5_10pct", rdExpenseSource: "self_invested", hasAccountingFirm: true, hasTechDept: true, mainProductDesc: "网络安全态势感知平台" },
    acknowledgedGaps: ["研发费用台账需规范化", "需补充近三年财务审计报告"],
    keyObstacles: "财务账套尚未完全分离，需协调财务团队",
    followUpDate: "2026-05-10", companyCommitments: "承诺在5月底前完成账套整理",
    nextSteps: ["申报材料清单与流程指导", "研发费用归集与加计扣除辅导", "财务规范化（事务所/审计对接）"],
    notes: "企业在网安基地有独立研发中心，条件较成熟", submittedAt: "2026-04-15T12:00:00",
  },
  {
    id: "vr002", taskId: "t003", companyId: "c0063", visitorId: "v1", visitorName: "王科员",
    visitMethod: "in_person", visitedAt: "2026-04-02T14:00:00", visitDurationMinutes: 90,
    contactReached: true, actualContactName: "陈总", actualContactTitle: "CEO", actualContactPhone: "13900139001",
    willingness: "strong", willingnessNotes: "明确表示今年一定要申报，已自行联系代理机构",
    fieldVerified: { employeeCount: 86, rdEmployeeCount: 22, annualRevenue: "500w_2000w", rdExpenseRatio: "5_10pct", rdExpenseSource: "both", hasAccountingFirm: true, hasTechDept: true, mainProductDesc: "大数据分析与云计算平台" },
    acknowledgedGaps: [],
    followUpDate: "2026-04-20", companyCommitments: "4月底前完成材料整理并提交",
    nextSteps: ["申报材料清单与流程指导"],
    notes: "已完成初审，材料齐全，已提交区局审核", submittedAt: "2026-04-02T16:00:00",
  },
  {
    id: "vr003", taskId: "t007", companyId: "c0114", visitorId: "v1", visitorName: "王科员",
    visitMethod: "online", visitedAt: "2026-04-18T09:00:00", visitDurationMinutes: 25,
    contactReached: true, actualContactName: "周经理", actualContactTitle: "研发总监", actualContactPhone: "13700137001",
    willingness: "moderate", willingnessNotes: "有意向但担心今年研发投入比例不够，需要核实",
    fieldVerified: { employeeCount: 45, rdEmployeeCount: 11, annualRevenue: "500w_2000w", rdExpenseRatio: "3_5pct", rdExpenseSource: "self_invested", hasAccountingFirm: false, hasTechDept: true, mainProductDesc: "工业自动化控制系统" },
    acknowledgedGaps: ["研发费用占比偏低（约3.8%，需达5%）", "尚未聘请专业会计师事务所"],
    keyObstacles: "今年产值增长较快但研发费用增长慢，比例可能不达标",
    followUpDate: "2026-05-05", companyCommitments: "考虑追加研发投入或推迟至明年申报",
    nextSteps: ["研发费用归集与加计扣除辅导", "财务规范化（事务所/审计对接）"],
    notes: "需继续跟进，有一定风险", submittedAt: "2026-04-18T09:30:00",
  },

  // ── 李科员 (v2) ──
  {
    id: "vr004", taskId: "t005", companyId: "c0065", visitorId: "v2", visitorName: "李科员",
    visitMethod: "in_person", visitedAt: "2026-04-11T10:00:00", visitDurationMinutes: 80,
    contactReached: true, actualContactName: "吴博士", actualContactTitle: "技术总监", actualContactPhone: "13600136001",
    willingness: "strong", willingnessNotes: "量子通信领域领军企业，专利储备丰富，强烈希望通过高企认定提升品牌背书",
    fieldVerified: { employeeCount: 62, rdEmployeeCount: 28, annualRevenue: "500w_2000w", rdExpenseRatio: "above_10pct", rdExpenseSource: "both", hasAccountingFirm: true, hasTechDept: true, mainProductDesc: "量子加密通信设备及解决方案" },
    acknowledgedGaps: ["专利转化收入需进一步核实"],
    followUpDate: "2026-04-25", companyCommitments: "本周内完成专利清单整理",
    nextSteps: ["知识产权培育（专利/软著）", "申报材料清单与流程指导"],
    notes: "企业在准备专利清单，进展顺利", submittedAt: "2026-04-11T11:30:00",
  },
  {
    id: "vr005", taskId: "t002", companyId: "c0062", visitorId: "v2", visitorName: "李科员",
    visitMethod: "online", visitedAt: "2026-04-14T15:30:00", visitDurationMinutes: 20,
    contactReached: true, actualContactName: "张副总", actualContactTitle: "副总经理", actualContactPhone: "13500135001",
    willingness: "hesitant", willingnessNotes: "企业认为申报工作量大，不确定是否值得，需要进一步沟通",
    fieldVerified: { employeeCount: 210, rdEmployeeCount: 38, annualRevenue: "above_1yi", rdExpenseRatio: "3_5pct", rdExpenseSource: "self_invested", hasAccountingFirm: true, hasTechDept: true, mainProductDesc: "智能装备及工业机器人" },
    acknowledgedGaps: ["研发费用占比偏低", "高新产品收入认定需梳理"],
    keyObstacles: "管理层认为认定流程繁琐，性价比不高",
    followUpDate: "2026-04-28", companyCommitments: "下周与管理层开会讨论",
    nextSteps: ["高新政策详解与一对一辅导"],
    notes: "等待企业回复，态度观望", submittedAt: "2026-04-14T16:00:00",
  },
  {
    id: "vr006", taskId: "t010", companyId: "c0117", visitorId: "v2", visitorName: "李科员",
    visitMethod: "online", visitedAt: "2026-04-20T14:00:00", visitDurationMinutes: 45,
    contactReached: true, actualContactName: "林总", actualContactTitle: "董事长", actualContactPhone: "13400134001",
    willingness: "moderate", willingnessNotes: "有一定意愿，但关注税收减免政策细节",
    fieldVerified: { employeeCount: 55, rdEmployeeCount: 15, annualRevenue: "500w_2000w", rdExpenseRatio: "5_10pct", rdExpenseSource: "self_invested", hasAccountingFirm: true, hasTechDept: false, mainProductDesc: "新能源储能系统" },
    acknowledgedGaps: ["缺乏独立研发部门", "部分核心技术人员学历证明需补全"],
    keyObstacles: "没有设立独立研发部门，研发人员分散在各业务部门",
    followUpDate: "2026-05-08",
    nextSteps: ["高新政策详解与一对一辅导", "研发费用归集与加计扣除辅导"],
    notes: "新能源领域，有一定申报价值", submittedAt: "2026-04-20T15:00:00",
  },

  // ── 张科员 (v3) ──
  {
    id: "vr007", taskId: "t008", companyId: "c0115", visitorId: "v3", visitorName: "张科员",
    visitMethod: "in_person", visitedAt: "2026-04-16T09:30:00", visitDurationMinutes: 55,
    contactReached: true, actualContactName: "赵总", actualContactTitle: "总经理", actualContactPhone: "13300133001",
    willingness: "strong", willingnessNotes: "积极配合，已提前准备好大量材料，财务规范",
    fieldVerified: { employeeCount: 78, rdEmployeeCount: 20, annualRevenue: "500w_2000w", rdExpenseRatio: "5_10pct", rdExpenseSource: "both", hasAccountingFirm: true, hasTechDept: true, mainProductDesc: "医疗器械智能检测设备" },
    acknowledgedGaps: ["部分软著尚在登记中"],
    followUpDate: "2026-04-30",
    nextSteps: ["知识产权培育（专利/软著）", "申报材料清单与流程指导"],
    notes: "进展顺利，预计5月可提交", submittedAt: "2026-04-16T11:00:00",
  },
  {
    id: "vr008", taskId: "t004", companyId: "c0064", visitorId: "v3", visitorName: "张科员",
    visitMethod: "online", visitedAt: "2026-04-17T16:00:00", visitDurationMinutes: 30,
    contactReached: false,
    willingness: "unreachable", willingnessNotes: "多次拨打无人接听，发送短信后无回复",
    fieldVerified: {},
    acknowledgedGaps: [],
    keyObstacles: "联系不上企业负责人",
    followUpDate: "2026-04-24",
    nextSteps: ["暂无明确需求"],
    notes: "研发费用占比需补材料，但暂时无法联系", submittedAt: "2026-04-17T16:30:00",
  },

  // ── 赵科员 (v4) ──
  {
    id: "vr009", taskId: "t006", companyId: "c0113", visitorId: "v4", visitorName: "赵科员",
    visitMethod: "in_person", visitedAt: "2026-04-19T10:00:00", visitDurationMinutes: 70,
    contactReached: true, actualContactName: "孙总", actualContactTitle: "CEO", actualContactPhone: "13200132001",
    willingness: "moderate", willingnessNotes: "了解过高企申报，有基本意愿，但担心材料准备时间不够",
    fieldVerified: { employeeCount: 35, rdEmployeeCount: 9, annualRevenue: "under_500w", rdExpenseRatio: "5_10pct", rdExpenseSource: "self_invested", hasAccountingFirm: false, hasTechDept: true, mainProductDesc: "工业物联网传感器及平台" },
    acknowledgedGaps: ["员工总数偏少，研发人员比例勉强达标", "尚无知识产权中介合作"],
    keyObstacles: "企业规模较小，人手有限，申报材料整理压力大",
    followUpDate: "2026-05-03", companyCommitments: "愿意配合，请求提供材料模板",
    nextSteps: ["申报材料清单与流程指导", "知识产权培育（专利/软著）", "科技金融（贷款/担保/投融资）"],
    notes: "初创型IoT企业，有潜力，需重点帮扶", submittedAt: "2026-04-19T11:30:00",
  },
  {
    id: "vr010", taskId: "t009", companyId: "c0116", visitorId: "v4", visitorName: "赵科员",
    visitMethod: "online", visitedAt: "2026-04-21T14:30:00", visitDurationMinutes: 15,
    contactReached: true, actualContactName: "钱经理", actualContactTitle: "财务总监", actualContactPhone: "13100131001",
    willingness: "refused", willingnessNotes: "明确表示今年不考虑申报，业务调整期内不想增加额外工作",
    fieldVerified: { employeeCount: 120, rdEmployeeCount: 18, annualRevenue: "2000w_1yi", rdExpenseRatio: "3_5pct", rdExpenseSource: "self_invested", hasAccountingFirm: true, hasTechDept: false },
    acknowledgedGaps: [],
    keyObstacles: "企业正在进行内部架构调整，管理层明确拒绝",
    nextSteps: ["暂无明确需求"],
    notes: "今年无法推进，保持联系留待明年", submittedAt: "2026-04-21T14:50:00",
  },
];

const SEED_IDS = new Set(SEED_VISIT_RECORDS.map((r) => r.id));

// 将种子数据写入 localStorage，始终以最新种子覆盖旧版种子记录，保留用户自建记录
export function initSeedVisitRecords(): void {
  if (typeof window === "undefined") return;
  const raw = localStorage.getItem(RECORDS_KEY);
  if (raw) {
    try {
      const stored = JSON.parse(raw) as VisitRecord[];
      // 过滤掉旧种子记录（ID 在 SEED_IDS 内），保留用户新建的记录
      const userRecords = stored.filter((r) => !SEED_IDS.has(r.id));
      localStorage.setItem(RECORDS_KEY, JSON.stringify([...SEED_VISIT_RECORDS, ...userRecords]));
    } catch { /* ignore */ }
  } else {
    localStorage.setItem(RECORDS_KEY, JSON.stringify(SEED_VISIT_RECORDS));
  }
}

export function getVisitRecords(): VisitRecord[] {
  if (typeof window === "undefined") return SEED_VISIT_RECORDS;
  try {
    const raw = localStorage.getItem(RECORDS_KEY);
    return raw ? (JSON.parse(raw) as VisitRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveVisitRecord(record: VisitRecord): void {
  const existing = getVisitRecords();
  const idx = existing.findIndex((r) => r.id === record.id);
  if (idx >= 0) {
    existing[idx] = record;
  } else {
    existing.push(record);
  }
  localStorage.setItem(RECORDS_KEY, JSON.stringify(existing));
}

export function getVisitRecordsByTask(taskId: string): VisitRecord[] {
  return getVisitRecords().filter((r) => r.taskId === taskId);
}

// ─── LocalStorage：任务状态覆盖（模拟状态同步）────────────────────
const TASK_STATUS_KEY = "task_status_overrides";

type StatusOverrides = Record<string, TaskStatus>;

export function getTaskStatusOverrides(): StatusOverrides {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(TASK_STATUS_KEY);
    return raw ? (JSON.parse(raw) as StatusOverrides) : {};
  } catch {
    return {};
  }
}

export function setTaskStatus(taskId: string, status: TaskStatus): void {
  const overrides = getTaskStatusOverrides();
  overrides[taskId] = status;
  localStorage.setItem(TASK_STATUS_KEY, JSON.stringify(overrides));
}

// ─── 走访记录草稿 ────────────────────────────────────────────────
const DRAFT_KEY_PREFIX = "visit_draft_";

export function saveDraft(taskId: string, data: Partial<VisitRecord>): void {
  localStorage.setItem(DRAFT_KEY_PREFIX + taskId, JSON.stringify(data));
}

export function getDraft(taskId: string): Partial<VisitRecord> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(DRAFT_KEY_PREFIX + taskId);
    return raw ? (JSON.parse(raw) as Partial<VisitRecord>) : null;
  } catch {
    return null;
  }
}

export function clearDraft(taskId: string): void {
  localStorage.removeItem(DRAFT_KEY_PREFIX + taskId);
}

// ─── LocalStorage：手动派发的任务 ────────────────────────────────
import type { Task } from "./types";

const DISPATCHED_TASKS_KEY = "dispatched_tasks";

export function getDispatchedTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(DISPATCHED_TASKS_KEY);
    return raw ? (JSON.parse(raw) as Task[]) : [];
  } catch {
    return [];
  }
}

export function saveDispatchedTask(task: Task): void {
  const tasks = getDispatchedTasks();
  tasks.push(task);
  localStorage.setItem(DISPATCHED_TASKS_KEY, JSON.stringify(tasks));
}
