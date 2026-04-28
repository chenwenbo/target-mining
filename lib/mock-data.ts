import type { Company, Task, IPItem, IPType } from "./types";
import { getRenewalKPI } from "./renewal";
import { getCertifiedCompanies } from "./renewal-data";

// ─── Raw data (imported at module load) ────────────────────────
// We use require() so this works in both server and client contexts.
// Vercel/Next.js will bundle the JSON at build time.

// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawCompanies: Company[] = require("../mock/companies.json");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const rawTasks: Task[] = require("../mock/tasks.json");

// ─── Public accessors ───────────────────────────────────────────

export function getAllCompanies(): Company[] {
  return rawCompanies;
}

export function getPotentialTargets(): Company[] {
  return rawCompanies.filter((c) => !c.alreadyCertified);
}

export function getCertifiedBenchmarks(): Company[] {
  return rawCompanies.filter((c) => c.alreadyCertified);
}

export function getCompanyById(id: string): Company | undefined {
  return rawCompanies.find((c) => c.id === id);
}

export function getAllTasks(): Task[] {
  return rawTasks;
}

// ─── KPI helpers ────────────────────────────────────────────────

export function getDashboardKPI() {
  const targets = getPotentialTargets();

  const byStreet: Record<string, number> = {};
  for (const c of targets) {
    byStreet[c.street] = (byStreet[c.street] || 0) + 1;
  }

  const byField: Record<string, number> = {};
  for (const c of targets) {
    if (c.techField) byField[c.techField] = (byField[c.techField] || 0) + 1;
  }

  const byAge: Record<string, number> = {
    "1-3 年": 0,
    "3-5 年": 0,
    "5-8 年": 0,
    "8-15 年": 0,
    "15 年+": 0,
  };
  const now = new Date("2026-01-01").getTime();
  for (const c of targets) {
    const years = (now - new Date(c.establishedAt).getTime()) / (1000 * 60 * 60 * 24 * 365);
    if (years < 3) byAge["1-3 年"]++;
    else if (years < 5) byAge["3-5 年"]++;
    else if (years < 8) byAge["5-8 年"]++;
    else if (years < 15) byAge["8-15 年"]++;
    else byAge["15 年+"]++;
  }

  const funnelTech = rawCompanies.filter((c) => c.techField !== null).length;
  const funnelCertified = rawCompanies.filter((c) => c.alreadyCertified).length;

  // ─── 企业漏斗（驾驶舱）─ 6 层从全区企业到认定成功
  const funnelEnterpriseTotal = 8520;
  const funnelEnterpriseTech = 2480;
  const funnelGrowthUnion = 1820;
  const funnelWilling = 412;
  const funnelDeclared = 286;
  const funnelCertifiedFinal = 178;

  const renewalKPI = getRenewalKPI(getCertifiedCompanies());
  const newDeclTargets = targets.filter((c) => !c.alreadyCertified).length;

  // ─── 流失高企（已失效 / 即将失效）─ 用于驾驶舱"流失高企分析"卡
  const churnTotal = 24;
  const churnDeltaPct = 18;
  const churnByReason: Record<string, number> = {
    "研发投入下滑": 8,
    "知识产权增长不足": 6,
    "主营业务变更": 4,
    "高新收入占比下降": 3,
    "主动放弃复审": 2,
    "其他": 1,
  };

  return {
    yearGoal: 120,
    certified: 58,
    total: targets.length,
    newDeclTargets,
    estimatedCompletion: 138,
    byStreet,
    byField,
    byAge,
    funnelTotalInDistrict: 1840,
    funnelTech,
    funnelCertified,
    funnelEnterpriseTotal,
    funnelEnterpriseTech,
    funnelGrowthUnion,
    funnelWilling,
    funnelDeclared,
    funnelCertifiedFinal,
    renewalCritical: renewalKPI.overdue + renewalKPI.critical,
    renewalApproaching: renewalKPI.approaching,
    renewalTotal: renewalKPI.total,
    churnTotal,
    churnDeltaPct,
    churnByReason,
  };
}

// ─── 知识产权明细（确定性生成）─────────────────────────────────

function seededRand(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

const IP_TERMS_BY_FIELD: Record<string, string[]> = {
  "电子信息":     ["数据处理", "网络安全防护", "信息加密传输", "嵌入式控制", "边缘计算", "流量检测", "协议解析", "日志审计", "身份认证", "威胁感知"],
  "生物与新医药": ["基因检测", "药物筛选", "细胞培养", "蛋白质纯化", "微生物发酵", "免疫诊断", "靶向给药", "生物传感", "样本处理", "诊断试剂"],
  "航空航天":     ["飞行控制", "结构减重", "热防护", "姿态解算", "导航定位", "液压传动", "复合材料成型", "密封结构", "发动机冷却", "无人机飞控"],
  "新材料":       ["纳米复合", "表面涂层", "高强合金", "功能薄膜", "导热界面", "阻燃改性", "多孔陶瓷", "碳纤维预浸料", "相变储能", "磁性粉末"],
  "高技术服务":   ["智能调度", "大数据分析", "机器学习推理", "知识图谱", "自然语言处理", "图像识别", "数字孪生", "云原生部署", "低代码平台", "流程自动化"],
  "新能源与节能": ["光伏逆变", "储能管理", "热泵控制", "能耗监测", "充电管理", "电池均衡", "风机变桨", "电网调频", "节能控制器", "余热回收"],
  "资源与环境":   ["污水处理", "废气净化", "固废分选", "土壤修复", "环境监测", "碳捕集", "重金属去除", "膜分离", "絮凝处理", "在线检测"],
  "先进制造与自动化": ["数控加工", "机器人抓取", "视觉检测", "精密传动", "柔性夹具", "焊接控制", "激光切割", "装配规划", "运动控制", "伺服驱动"],
};

const FALLBACK_TERMS = ["技术处理", "系统控制", "智能优化", "数据采集", "自动检测"];

const INVENTION_SUFFIXES  = ["方法", "系统", "装置及方法", "方法及系统", "优化方法"];
const UTILITY_SUFFIXES    = ["装置", "设备", "结构", "模块", "系统"];
const DESIGN_KEYWORDS     = ["外壳", "显示界面", "包装结构", "操作面板", "控制终端"];
const SOFTWARE_SUFFIXES   = ["管理系统", "监控平台", "数据分析系统", "自动化平台", "调度系统", "报表工具", "智能助手"];

const PATENT_STATUSES = ["授权", "授权", "授权", "公开", "审中"];
const SOFTWARE_STATUS = "登记";

function pickOne<T>(arr: T[], rand: () => number): T {
  return arr[Math.floor(rand() * arr.length)];
}

function generatePatentNo(type: IPType, idx: number, rand: () => number): string {
  const yr = 2018 + Math.floor(rand() * 7);
  const seq = String(Math.floor(rand() * 9000000) + 1000000);
  if (type === "invention") return `ZL${yr}1${seq}`;
  if (type === "utility")   return `ZL${yr}2${seq}`;
  if (type === "design")    return `ZL${yr}3${seq}`;
  return `2${yr}SR${String(idx + 1).padStart(6, "0")}${String(Math.floor(rand() * 1000)).padStart(3, "0")}`;
}

function generateDate(rand: () => number): string {
  const yr = 2018 + Math.floor(rand() * 7);
  const mo = String(1 + Math.floor(rand() * 12)).padStart(2, "0");
  const dy = String(1 + Math.floor(rand() * 28)).padStart(2, "0");
  return `${yr}-${mo}-${dy}`;
}

export function getIPItems(company: Company): IPItem[] {
  const terms = IP_TERMS_BY_FIELD[company.techField ?? ""] ?? FALLBACK_TERMS;
  const shortName = company.name.replace(/（.*?）|（.*|有限.*|股份.*|集团.*/g, "").slice(0, 6);

  const items: IPItem[] = [];

  const types: [IPType, number][] = [
    ["invention", company.patents.invention],
    ["utility",   company.patents.utility],
    ["design",    company.patents.design],
    ["software",  company.software],
  ];

  let globalIdx = 0;
  for (const [type, count] of types) {
    for (let i = 0; i < count; i++) {
      const rand = seededRand(company.id.charCodeAt(company.id.length - 1) * 31 + globalIdx * 7919 + type.length * 1009);
      const term = pickOne(terms, rand);

      let name: string;
      if (type === "invention") {
        name = `一种${term}的${pickOne(INVENTION_SUFFIXES, rand)}`;
      } else if (type === "utility") {
        name = `一种${shortName}${term}${pickOne(UTILITY_SUFFIXES, rand)}`;
      } else if (type === "design") {
        name = `${shortName}${pickOne(DESIGN_KEYWORDS, rand)}`;
      } else {
        name = `${shortName}${term}${pickOne(SOFTWARE_SUFFIXES, rand)}V${1 + Math.floor(rand() * 3)}.0`;
      }

      items.push({
        name,
        number: generatePatentNo(type, globalIdx, rand),
        type,
        status: type === "software" ? SOFTWARE_STATUS : pickOne(PATENT_STATUSES, rand),
        date: generateDate(rand),
      });
      globalIdx++;
    }
  }

  return items;
}
