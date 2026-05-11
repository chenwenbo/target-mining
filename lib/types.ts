// ─── 八大领域 ───────────────────────────────────────────────────
export const TECH_FIELDS = [
  "电子信息",
  "生物与新医药",
  "航空航天",
  "新材料",
  "高技术服务",
  "新能源与节能",
  "资源与环境",
  "先进制造与自动化",
] as const;

export type TechField = (typeof TECH_FIELDS)[number];

// ─── 街道/园区 ──────────────────────────────────────────────────
export const STREETS = [
  "国家网安基地",
  "临空港经开区",
  "吴家山街道",
  "将军路街道",
  "径河街道",
  "金银湖街道",
  "慈惠街道",
  "走马岭街道",
  "新沟镇街道",
  "东山街道",
] as const;

export type Street = (typeof STREETS)[number];

// ─── 湖北省城市→区县映射 ──────────────────────────────────────────
export const HUBEI_REGIONS: Record<string, string[]> = {
  "武汉市": [
    "东西湖区", "武汉经开区", "东湖高新区",
    "江岸区", "江汉区", "硚口区", "汉阳区", "武昌区", "青山区",
    "洪山区", "蔡甸区", "江夏区", "黄陂区", "新洲区",
  ],
  "宜昌市": [
    "西陵区", "伍家岗区", "点军区", "猇亭区", "夷陵区", "宜昌高新区",
    "宜都市", "当阳市", "枝江市",
    "远安县", "兴山县", "秭归县", "长阳土家族自治县", "五峰土家族自治县",
  ],
  "襄阳市": [
    "樊城区", "襄城区", "高新区", "东津新区",
    "老河口市", "枣阳市", "宜城市",
    "南漳县", "谷城县", "保康县",
  ],
  "荆州市": [
    "沙市区", "荆州区",
    "石首市", "洪湖市", "松滋市",
    "公安县", "监利市", "江陵县",
  ],
  "黄冈市": [
    "黄州区",
    "麻城市", "武穴市",
    "红安县", "罗田县", "英山县", "浠水县", "蕲春县", "黄梅县", "团风县",
  ],
  "孝感市": [
    "孝南区",
    "汉川市", "应城市", "安陆市",
    "孝昌县", "大悟县", "云梦县",
  ],
  "荆门市": [
    "东宝区", "掇刀区",
    "钟祥市", "京山市", "沙洋县",
  ],
  "黄石市": [
    "黄石港区", "西塞山区", "下陆区", "铁山区",
    "大冶市", "阳新县",
  ],
  "十堰市": [
    "茅箭区", "张湾区",
    "丹江口市",
    "郧阳区", "郧西县", "竹山县", "竹溪县", "房县",
  ],
  "咸宁市": [
    "咸安区", "赤壁市",
    "嘉鱼县", "通城县", "崇阳县", "通山县",
  ],
  "随州市": ["曾都区", "广水市", "随县"],
  "恩施土家族苗族自治州": [
    "恩施市", "利川市",
    "建始县", "巴东县", "宣恩县", "咸丰县", "来凤县", "鹤峰县",
  ],
  "鄂州市": ["鄂城区", "华容区", "梁子湖区"],
  "潜江市": ["潜江市"],
  "仙桃市": ["仙桃市"],
  "天门市": ["天门市"],
  "神农架林区": ["神农架林区"],
};

// ─── 申报类型 & 申报意愿 ─────────────────────────────────────────
export type DeclarationType = "新申报" | "复审";
export type DeclarationWillingness = "strong" | "moderate" | "hesitant" | "refused" | "unknown";

export const DECLARATION_WILLINGNESS_LABELS: Record<DeclarationWillingness, string> = {
  strong: "意愿强烈",
  moderate: "基本意愿",
  hesitant: "犹豫观望",
  refused: "明确拒绝",
  unknown: "未接触",
};

// ─── 企业原始数据 ───────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  creditCode: string;
  city: string;
  district: string;
  street: string;
  industry: string;
  techField: TechField | null;
  establishedAt: string; // ISO date string
  registeredCapital: number; // 万元
  employees: number; // 参保人数
  rdEmployees: number; // 研发人员数（招聘推算）
  patents: {
    invention: number;
    utility: number;
    design: number;
  };
  software: number; // 软著数
  alreadyCertified: boolean; // 已是高企
  inSMEDatabase: boolean; // 科技型中小企业入库
  risk: {
    abnormal: boolean;
    penalty: boolean;
  };
  contact: {
    name: string;
    phone: string;
    email: string;
  };
  declarationWillingness: DeclarationWillingness;
}

// ─── 知识产权明细条目 ────────────────────────────────────────────
export type IPType = "invention" | "utility" | "design" | "software";

export interface IPItem {
  name: string;
  number: string;
  type: IPType;
  status: string;
  date: string; // YYYY-MM-DD
}

// ─── 任务 ───────────────────────────────────────────────────────
export type TaskStatus = "pending" | "in_progress" | "done";

export interface Task {
  id: string;
  companyId: string;
  companyName: string;
  assignee: string;
  street: string;
  status: TaskStatus;
  createdAt: string;
  deadline: string;
  notes: string;
}

// ─── 复审状态 ────────────────────────────────────────────────────
export type RenewalStatus =
  | "overdue"     // 已过期未完成复审
  | "critical"    // ≤6个月到期（紧急）
  | "approaching" // 6-12个月（预警）
  | "active";     // >12个月，无需立即行动

// ─── 三年期经营指标（复审核心数据）──────────────────────────────
export interface ThreeYearMetrics {
  rdExpenseRatioY1: number;        // 研发费用占收入比(%)
  rdExpenseRatioY2: number;
  rdExpenseRatioY3: number;
  hiTechRevenueRatioY1: number;   // 高新产品收入占比(%)
  hiTechRevenueRatioY2: number;
  hiTechRevenueRatioY3: number;
  rdStaffRatioY1: number;          // 研发人员占比(%)
  rdStaffRatioY2: number;
  rdStaffRatioY3: number;
  newPatentsY1: number;            // 三年内新增专利数
  newPatentsY2: number;
  newPatentsY3: number;
  annualAuditPassedY1: boolean;
  annualAuditPassedY2: boolean;
  annualAuditPassedY3: boolean;
  complianceClean: boolean;        // 近3年无重大违规
}

// ─── 已认定高企（复审扩展类型）──────────────────────────────────
export interface CertifiedCompany extends Company {
  certifiedYear: number;           // 最近一次认定年份
  certNo: string;                  // 证书编号
  expiryYear: number;              // 到期年份 = certifiedYear + 3
  threeYearMetrics: ThreeYearMetrics;
  renewalStatus?: RenewalStatus;   // 运行时计算
}

// ─── 复审准备度评分结果 ──────────────────────────────────────────
export interface RenewalReadinessScore {
  total: number;
  rdRatioScore: number;            // 研发投入比(0-30分)
  hiTechRevenueScore: number;      // 高新收入比(0-30分)
  ipGrowthScore: number;           // 知识产权增长(0-20分)
  complianceScore: number;         // 合规与审计(0-20分)
  gaps: RenewalGap[];
  readyToRenew: boolean;           // total≥70 且无紧迫缺项
}

export interface RenewalGap {
  criterion: string;
  currentValue: string;
  requiredValue: string;
  urgent: boolean;
  suggestion: string;
}

// ─── 走访摸排（移动端）──────────────────────────────────────────

export interface Visitor {
  id: string;
  name: string;
  street: string | null;
  dept: string;
}

export type VisitMethod = "in_person" | "online";
export type WillingnessLevel = "strong" | "moderate" | "hesitant" | "refused" | "unreachable";

export interface VisitRecord {
  id: string;
  taskId: string;
  companyId: string;
  visitorId: string;
  visitorName: string;

  visitMethod: VisitMethod;
  visitedAt: string;
  visitDurationMinutes?: number;
  contactReached: boolean;
  actualContactName?: string;
  actualContactTitle?: string;
  actualContactPhone?: string;

  willingness: WillingnessLevel;
  willingnessNotes?: string;

  fieldVerified: {
    employeeCount?: number;
    rdEmployeeCount?: number;
    annualRevenue?: "under_500w" | "500w_2000w" | "2000w_1yi" | "above_1yi";
    rdExpenseRatio?: "under_3pct" | "3_5pct" | "5_10pct" | "above_10pct";
    rdExpenseSource?: "self_invested" | "government_grant" | "both" | "none";
    hasAccountingFirm?: boolean | null;
    hasTechDept?: boolean | null;
    mainProductDesc?: string;
  };

  acknowledgedGaps: string[];
  keyObstacles?: string;
  followUpDate?: string;
  companyCommitments?: string;
  nextSteps: string[];
  notes?: string;
  submittedAt: string;
}

// ─── 专业测评 ───────────────────────────────────────────────────

export type AssessmentDimension =
  | "rd_expense"
  | "rd_staff"
  | "ip"
  | "hi_tech_revenue"
  | "management";

export interface AssessmentOption {
  value: string;
  label: string;
  score: number;
}

export interface AssessmentQuestion {
  id: string;
  dimension: AssessmentDimension;
  text: string;
  hint?: string;
  options: AssessmentOption[];
  isQualifier: boolean;
}

export type AssessmentAnswers = Record<string, string>;

export interface AssessmentDimensionScore {
  dimension: AssessmentDimension;
  label: string;
  score: number;
  maxScore: number;
}

export interface CultivationSuggestion {
  dimension: AssessmentDimension;
  urgent: boolean;
  title: string;
  body: string;
}

export interface AssessmentScore {
  total: number;
  grade: "优秀" | "符合" | "待培育";
  dimensionScores: AssessmentDimensionScore[];
  suggestions: CultivationSuggestion[];
}

export type AssessmentSource = "enterprise_self" | "staff_agent";
export type AssessmentStatus = "pending" | "completed";

export interface AssessmentRecord {
  id: string;
  companyId: string;
  token: string;
  source: AssessmentSource;
  status: AssessmentStatus;
  createdAt: string;
  submittedAt?: string;
  submitterName?: string;
  answers?: AssessmentAnswers;
  score?: AssessmentScore;
  taskId?: string;
}

// ─── 复审任务 ────────────────────────────────────────────────────
export type RenewalTaskStatus = "pending" | "in_progress" | "submitted" | "approved" | "rejected";

export interface RenewalTask {
  id: string;
  companyId: string;
  companyName: string;
  certNo: string;
  expiryYear: number;
  assignee: string;
  street: string;
  status: RenewalTaskStatus;
  createdAt: string;
  deadline: string;
  notes: string;
  urgency: RenewalStatus;
}
