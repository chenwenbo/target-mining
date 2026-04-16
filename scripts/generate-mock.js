#!/usr/bin/env node
/**
 * 生成东西湖区高企潜在标的 Mock 数据
 * 运行: node scripts/generate-mock.js
 */
const fs = require("fs");
const path = require("path");

// ─── 基础数据池 ───────────────────────────────────────────────

const STREETS_CONFIG = [
  { name: "国家网安基地",  count: 52 },
  { name: "临空港经开区",  count: 48 },
  { name: "吴家山街道",    count: 38 },
  { name: "将军路街道",    count: 28 },
  { name: "径河街道",      count: 22 },
  { name: "金银湖街道",    count: 18 },
  { name: "慈惠街道",      count: 14 },
  { name: "走马岭街道",    count: 12 },
  { name: "新沟镇街道",    count:  8 },
  { name: "东山街道",      count:  6 },
];

const TECH_FIELDS = [
  "电子信息",
  "先进制造与自动化",
  "新材料",
  "生物与新医药",
  "新能源与节能",
  "资源与环境",
  "高技术服务",
];

// 各街道/园区偏重领域
const STREET_FIELD_WEIGHTS = {
  "国家网安基地": { "电子信息": 70, "高技术服务": 20, "先进制造与自动化": 10 },
  "临空港经开区": { "先进制造与自动化": 55, "新材料": 25, "新能源与节能": 20 },
  "吴家山街道":   { "电子信息": 35, "先进制造与自动化": 30, "高技术服务": 20, "新材料": 15 },
  "将军路街道":   { "电子信息": 40, "先进制造与自动化": 30, "生物与新医药": 30 },
  "径河街道":     { "先进制造与自动化": 45, "新材料": 30, "新能源与节能": 25 },
  "金银湖街道":   { "生物与新医药": 45, "高技术服务": 35, "电子信息": 20 },
  "慈惠街道":     { "先进制造与自动化": 50, "新材料": 30, "新能源与节能": 20 },
  "走马岭街道":   { "新能源与节能": 45, "先进制造与自动化": 35, "资源与环境": 20 },
  "新沟镇街道":   { "先进制造与自动化": 60, "新材料": 40 },
  "东山街道":     { "先进制造与自动化": 50, "资源与环境": 30, "新能源与节能": 20 },
};

const COMPANY_PREFIXES = [
  "武汉", "楚天", "江城", "汉水", "东湖", "荆楚", "湖北",
];

const COMPANY_MIDDLES_BY_FIELD = {
  "电子信息":       ["磐石", "云麦", "星纬", "启航", "网安", "数盾", "锋码", "智隼", "脉冲", "光子", "量子", "深蓝", "烽火", "网络", "信安", "数据", "云链", "智算", "芯片", "赛博"],
  "先进制造与自动化": ["鼎盛", "食研坊", "远航", "精工", "铸造", "智造", "机电", "数控", "航宇", "恒力", "宏图", "盛达", "铭科", "晨光", "华兴", "精密", "博联", "创博", "汇聚", "鑫宇"],
  "新材料":         ["锦绣", "晶华", "新材", "碳源", "纤维", "纳米", "复合", "高分子", "陶瓷", "合金", "镀膜", "功能", "稀土", "钛合", "硅材", "氮化", "磁性", "光学", "结构", "导热"],
  "生物与新医药":   ["楚天", "盛源", "康生", "博翔", "济世", "药研", "基因", "免疫", "细胞", "蛋白", "检测", "诊断", "制剂", "植化", "医药", "健康", "生命", "仁济", "弘康", "益生"],
  "新能源与节能":   ["青鸟", "绿能", "光伏", "储能", "绿氢", "风电", "节电", "低碳", "清洁", "太阳", "碳中", "热泵", "变频", "余热", "环保", "能效", "峰谷", "充电", "电网", "新能"],
  "资源与环境":     ["清源", "净水", "环境", "治污", "循环", "固废", "垃圾", "土壤", "废气", "净化", "生态", "监测", "碳排", "湿地", "绿化", "修复", "排放", "清洁", "减排", "回收"],
  "高技术服务":     ["云帆", "智链", "数服", "科创", "孵化", "咨询", "认证", "检测", "标准", "平台", "数字", "智慧", "融合", "跨界", "赋能", "运营", "增效", "优化", "集成", "联盟"],
};

const COMPANY_SUFFIXES = [
  "科技有限公司", "技术有限公司", "股份有限公司", "科技股份有限公司",
  "技术股份有限公司", "科技有限公司", "科技有限公司",
  "有限公司", "技术开发有限公司", "科技开发有限公司",
];

const INDUSTRIES_BY_FIELD = {
  "电子信息":        ["网络安全", "信息技术服务", "软件开发", "集成电路", "通信设备", "人工智能"],
  "先进制造与自动化": ["智能装备", "工业自动化", "机器人", "数控设备", "航空配件", "食品机械"],
  "新材料":          ["功能材料", "复合材料", "高分子材料", "新型建材", "光电材料", "纳米材料"],
  "生物与新医药":    ["生物技术", "医疗器械", "体外诊断", "医药研发", "基因检测", "医疗服务"],
  "新能源与节能":    ["光伏发电", "储能技术", "节能环保", "新能源汽车配件", "氢能", "风电"],
  "资源与环境":      ["环境监测", "水处理", "固废处理", "大气治理", "土壤修复", "碳减排"],
  "高技术服务":      ["科技中介", "检验检测", "研究开发", "数字化服务", "智慧供应链", "云服务"],
};

const SURNAMES = ["王", "李", "张", "刘", "陈", "杨", "赵", "黄", "周", "吴", "徐", "孙", "朱", "马", "胡", "林", "郭", "何", "高", "罗"];
const GIVEN_NAMES = ["伟", "芳", "娜", "秀英", "敏", "静", "丽", "强", "磊", "军", "洋", "勇", "艳", "杰", "娟", "涛", "明", "超", "秀兰", "霞"];

// ─── 工具函数 ─────────────────────────────────────────────────

let seed = 42;
function rng() {
  seed = (seed * 1664525 + 1013904223) & 0xffffffff;
  return (seed >>> 0) / 0xffffffff;
}

function randInt(min, max) { return min + Math.floor(rng() * (max - min + 1)); }
function pick(arr) { return arr[Math.floor(rng() * arr.length)]; }

function pickWeighted(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  let r = rng() * total;
  for (const [k, v] of entries) {
    r -= v;
    if (r <= 0) return k;
  }
  return entries[entries.length - 1][0];
}

function genCreditCode(id) {
  return "91420100" + String(id).padStart(9, "0") + "X";
}

function genPhone() {
  const prefix = ["138", "139", "150", "151", "158", "182", "186"][Math.floor(rng() * 7)];
  return prefix + "0000" + String(randInt(1000, 9999));
}

function genDate(minYears, maxYears) {
  const now = new Date("2026-01-01");
  const years = minYears + rng() * (maxYears - minYears);
  const ms = now.getTime() - years * 365 * 24 * 60 * 60 * 1000;
  return new Date(ms).toISOString().slice(0, 10);
}

function genCompanyName(field, usedNames) {
  const prefix = pick(COMPANY_PREFIXES);
  const middles = COMPANY_MIDDLES_BY_FIELD[field] || ["科技"];
  const middle = pick(middles);
  const suffix = pick(COMPANY_SUFFIXES);
  let name = prefix + middle + suffix;
  // Avoid exact duplicates by adding a distinguisher
  if (usedNames.has(name)) {
    name = prefix + middle + ["智能", "创新", "新型", "精密", "高端"][Math.floor(rng() * 5)] + suffix;
  }
  usedNames.add(name);
  return name;
}

// ─── 企业数据生成 ─────────────────────────────────────────────

function generateCompany(id, street, isCertified, targetTier, usedNames) {
  const fieldWeights = STREET_FIELD_WEIGHTS[street];
  const field = pickWeighted(fieldWeights);
  const name = genCompanyName(field, usedNames);
  const industry = pick(INDUSTRIES_BY_FIELD[field]);
  const surname = pick(SURNAMES);
  const givenName = pick(GIVEN_NAMES);
  const contactName = surname + givenName;

  // 已认定高企: 较高指标
  if (isCertified) {
    const inv = randInt(5, 20);
    const util = randInt(8, 25);
    const des = randInt(1, 5);
    const sw = randInt(5, 20);
    const emp = randInt(60, 300);
    return {
      id: `c${String(id).padStart(4, "0")}`,
      name,
      creditCode: genCreditCode(id),
      street,
      industry,
      techField: field,
      establishedAt: genDate(3, 12),
      registeredCapital: randInt(500, 5000),
      employees: emp,
      rdEmployees: Math.floor(emp * (0.15 + rng() * 0.25)),
      patents: { invention: inv, utility: util, design: des },
      software: sw,
      alreadyCertified: true,
      inSMEDatabase: true,
      risk: { abnormal: false, penalty: false },
      contact: { name: contactName, phone: genPhone(), email: `${surname.toLowerCase()}@${name.slice(0, 2).toLowerCase()}.com` },
    };
  }

  // 潜在标的: 按目标分档生成
  let inv, util, des, sw, emp, rdRatio, capital, age, risk;

  switch (targetTier) {
    case "A": // 高分 80-95
      inv = randInt(3, 12);
      util = randInt(5, 18);
      des = randInt(1, 4);
      sw = randInt(3, 15);
      emp = randInt(50, 200);
      rdRatio = 0.15 + rng() * 0.2;
      capital = randInt(500, 3000);
      age = 2 + rng() * 6; // 2-8 years
      risk = { abnormal: false, penalty: false };
      break;
    case "B": // 中高分 60-79
      inv = randInt(0, 4);
      util = randInt(2, 10);
      des = randInt(0, 3);
      sw = randInt(1, 8);
      emp = randInt(30, 100);
      rdRatio = 0.08 + rng() * 0.12;
      capital = randInt(200, 1000);
      age = 1.5 + rng() * 7;
      risk = { abnormal: rng() < 0.05, penalty: rng() < 0.03 };
      break;
    case "C": // 中低分 40-59
      inv = randInt(0, 2);
      util = randInt(0, 5);
      des = randInt(0, 2);
      sw = randInt(0, 4);
      emp = randInt(15, 60);
      rdRatio = 0.04 + rng() * 0.08;
      capital = randInt(100, 500);
      age = 1 + rng() * 9;
      risk = { abnormal: rng() < 0.1, penalty: rng() < 0.05 };
      break;
    default: // D 低分 < 40
      inv = 0;
      util = randInt(0, 2);
      des = 0;
      sw = randInt(0, 2);
      emp = randInt(5, 30);
      rdRatio = 0 + rng() * 0.05;
      capital = randInt(30, 200);
      age = 0.5 + rng() * 10;
      risk = { abnormal: rng() < 0.2, penalty: rng() < 0.15 };
  }

  const empCount = emp;
  const techFieldVal = rng() < (targetTier === "D" ? 0.4 : 0.85) ? field : null;

  return {
    id: `c${String(id).padStart(4, "0")}`,
    name,
    creditCode: genCreditCode(id),
    street,
    industry,
    techField: techFieldVal,
    establishedAt: genDate(age, age + 0.5),
    registeredCapital: capital,
    employees: empCount,
    rdEmployees: Math.max(1, Math.floor(empCount * rdRatio)),
    patents: { invention: inv, utility: util, design: des },
    software: sw,
    alreadyCertified: false,
    inSMEDatabase: targetTier === "A" ? rng() < 0.7 : targetTier === "B" ? rng() < 0.4 : rng() < 0.2,
    risk,
    contact: { name: contactName, phone: genPhone(), email: `${surname.toLowerCase()}${randInt(100,999)}@example.com` },
  };
}

// ─── 分档分配 ────────────────────────────────────────────────

// 潜在标的 A/B/C/D 各街道分配
function distributeTiers(total, tierCounts) {
  // 将 total 按比例拆成 A/B/C/D
  const tiers = [];
  const totalTier = tierCounts.A + tierCounts.B + tierCounts.C + tierCounts.D;
  let remaining = total;
  const counts = {
    A: 0, B: 0, C: 0, D: 0,
  };
  for (const t of ["A", "B", "C", "D"]) {
    if (t === "D") {
      counts[t] = remaining;
    } else {
      counts[t] = Math.round(total * (tierCounts[t] / totalTier));
      remaining -= counts[t];
    }
  }
  for (const [tier, cnt] of Object.entries(counts)) {
    for (let i = 0; i < cnt; i++) tiers.push(tier);
  }
  return tiers;
}

// ─── 主生成逻辑 ──────────────────────────────────────────────

const GLOBAL_TIER_COUNTS = { A: 42, B: 76, C: 82, D: 46 };
const CERTIFIED_COUNT = 60;

const usedNames = new Set();
const companies = [];
let globalId = 1;

// 生成已认定高企（benchmarks）
// 分布到各街道，偏向高密度区
const certStreets = [
  ...Array(20).fill("国家网安基地"),
  ...Array(18).fill("临空港经开区"),
  ...Array(10).fill("吴家山街道"),
  ...Array(6).fill("将军路街道"),
  ...Array(4).fill("径河街道"),
  ...Array(2).fill("金银湖街道"),
];
for (let i = 0; i < CERTIFIED_COUNT; i++) {
  const street = certStreets[i] || pick(STREETS_CONFIG.map(s => s.name));
  companies.push(generateCompany(globalId++, street, true, null, usedNames));
}

// 生成潜在标的 246 家
const totalPotential = STREETS_CONFIG.reduce((s, c) => s + c.count, 0); // 246
for (const sc of STREETS_CONFIG) {
  const tiers = distributeTiers(sc.count, GLOBAL_TIER_COUNTS);
  for (const tier of tiers) {
    companies.push(generateCompany(globalId++, sc.name, false, tier, usedNames));
  }
}

// ─── 输出 ─────────────────────────────────────────────────────

const outPath = path.join(__dirname, "../mock/companies.json");
fs.writeFileSync(outPath, JSON.stringify(companies, null, 2), "utf-8");
console.log(`✓ Generated ${companies.length} companies → ${outPath}`);
console.log(`  已认定高企: ${companies.filter(c => c.alreadyCertified).length}`);
console.log(`  潜在标的:   ${companies.filter(c => !c.alreadyCertified).length}`);
