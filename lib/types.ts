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

// ─── 置信度分档 ─────────────────────────────────────────────────
export type Tier = "A" | "B" | "C" | "D";

// ─── 企业原始数据 ───────────────────────────────────────────────
export interface Company {
  id: string;
  name: string;
  creditCode: string;
  street: Street;
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
}

// ─── 打分权重 ───────────────────────────────────────────────────
export interface Weights {
  ip: number; // 知识产权 0-1
  scale: number; // 规模与成长
  field: number; // 领域匹配
  rd: number; // 研发强度
  compliance: number; // 合规
  growth: number; // 成长性
}

export const DEFAULT_WEIGHTS: Weights = {
  ip: 0.30,
  scale: 0.20,
  field: 0.15,
  rd: 0.15,
  compliance: 0.10,
  growth: 0.10,
};

// ─── 评分结果 ───────────────────────────────────────────────────
export interface DimensionScore {
  name: string;
  score: number; // 0-100 normalized
  rawScore: number;
  maxRaw: number;
  weight: number;
  hits: ScoreHit[];
}

export interface ScoreHit {
  label: string;
  value: string;
  points: number;
  passed: boolean;
}

export interface ScoreResult {
  total: number; // 0-100
  tier: Tier;
  dimensions: DimensionScore[];
  gaps: Gap[];
}

export interface Gap {
  dimension: string;
  description: string;
  suggestion: string;
  urgent: boolean;
}

// ─── 打过分的企业（用于展示）────────────────────────────────────
export interface ScoredCompany extends Company {
  score: ScoreResult;
}

// ─── 任务 ───────────────────────────────────────────────────────
export type TaskStatus = "pending" | "in_progress" | "done";

export interface Task {
  id: string;
  companyId: string;
  companyName: string;
  assignee: string;
  street: Street;
  status: TaskStatus;
  createdAt: string;
  deadline: string;
  notes: string;
  tier: Tier;
}
