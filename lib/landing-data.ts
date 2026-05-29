import rawCompanies from "../mock/companies.json";
import { HUBEI_REGIONS, STREETS } from "./types";

interface RawCompany {
  id: string;
  name: string;
  street: string;
  industry: string;
  techField: string | null;
  employees: number;
  rdEmployees: number;
  patents: { invention: number; utility: number; design: number };
  software: number;
  alreadyCertified: boolean;
}

export interface PreviewCompany {
  name: string;
  industry: string;
}

export interface StreetStats {
  total: number;         // 企业总数
  techCount: number;     // 泛科技企业
  highPotential: number; // 高潜力企业
  preview: PreviewCompany[];
  blurredCount: number;
}

function isTech(c: RawCompany): boolean {
  return c.techField !== null;
}

function isHighPotential(c: RawCompany): boolean {
  const totalPatents = c.patents.invention + c.patents.utility + c.patents.design + c.software;
  return isTech(c) && (totalPatents > 0 || c.employees >= 30 || c.rdEmployees >= 10);
}

function scoreCompany(c: RawCompany): number {
  return Math.min(100, c.patents.invention * 10 + c.patents.utility * 3 + c.software * 2 + Math.floor(c.employees / 10));
}

export function getStreetStats(street: string): StreetStats {
  const all = (rawCompanies as RawCompany[]).filter((c) => c.street === street);
  const techCompanies = all.filter(isTech);
  const highPotentialCompanies = all.filter(isHighPotential);

  const scored = highPotentialCompanies
    .map((c) => ({ c, score: scoreCompany(c) }))
    .sort((a, b) => b.score - a.score);

  const preview: PreviewCompany[] = scored.slice(0, 3).map(({ c }) => ({
    name: c.name,
    industry: c.industry,
  }));

  return {
    total: all.length,
    techCount: techCompanies.length,
    highPotential: highPotentialCompanies.length,
    preview,
    blurredCount: Math.max(0, highPotentialCompanies.length - 3),
  };
}

export function getStreets(): string[] {
  return [...STREETS];
}

// ─── 湖北省区县级数据 ────────────────────────────────────────────

export type DistrictStats = StreetStats;

// 简单确定性哈希，用于 mock 数据生成
function strHash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

const CITY_BASE: Record<string, number> = {
  "武汉市": 800,
  "宜昌市": 280,
  "襄阳市": 320,
};

const MOCK_NAME_A = ["华","联","中","兴","恒","鑫","宏","永","新","盛"];
const MOCK_NAME_B = ["科","创","通","达","远","泰","元","立","志","合"];
const MOCK_SUFFIX = [
  "科技有限公司", "技术有限公司", "科技股份有限公司",
  "电子有限公司", "新材料有限公司", "智能科技有限公司",
];
const MOCK_INDUSTRIES = [
  "电子信息", "生物医药", "新材料", "智能制造", "新能源",
  "光电技术", "高端装备", "信息安全", "软件服务", "节能环保",
];

function mockPreview(district: string, idx: number): PreviewCompany {
  const seed = strHash(district + String(idx));
  const name =
    district.slice(0, 2) +
    MOCK_NAME_A[seed % MOCK_NAME_A.length] +
    MOCK_NAME_B[(seed >> 4) % MOCK_NAME_B.length] +
    MOCK_SUFFIX[(seed >> 8) % MOCK_SUFFIX.length];
  const industry = MOCK_INDUSTRIES[(seed >> 12) % MOCK_INDUSTRIES.length];
  return { name, industry };
}

export function getHubeiCities(): string[] {
  return Object.keys(HUBEI_REGIONS);
}

export function getDistrictsForCity(city: string): string[] {
  return HUBEI_REGIONS[city] ?? [];
}

// 落地页支持的两类申报资质
export type LandingQual = "high_tech" | "little_giant";

// 不同资质的高潜力企业占比系数（小巨人远比高企稀缺）
const QUAL_POTENTIAL_FACTOR: Record<LandingQual, number> = {
  high_tech: 1,
  little_giant: 0.12,
};

export function getDistrictStats(
  city: string,
  district: string,
  qual: LandingQual = "high_tech",
): DistrictStats {
  const factor = QUAL_POTENTIAL_FACTOR[qual];

  // 东西湖区使用真实数据
  if (district === "东西湖区") {
    const all = rawCompanies as RawCompany[];
    const techCompanies = all.filter(isTech);
    const highPotentialCompanies = all.filter(isHighPotential);
    const scored = highPotentialCompanies
      .map((c) => ({ c, score: scoreCompany(c) }))
      .sort((a, b) => b.score - a.score);
    const preview = scored.slice(0, 3).map(({ c }) => ({ name: c.name, industry: c.industry }));
    const highPotential = Math.max(3, Math.round(highPotentialCompanies.length * factor));
    return {
      total: all.length,
      techCount: techCompanies.length,
      highPotential,
      preview,
      blurredCount: Math.max(0, highPotential - 3),
    };
  }

  // 其他区县：基于城市等级 + 确定性 seed 生成合理数字
  const seed = strHash(city + district);
  const base = CITY_BASE[city] ?? 150;
  const total = base + (seed % (base * 2));
  const techCount = Math.floor(total * (0.28 + (seed % 28) / 100));
  const highPotential = Math.max(
    3,
    Math.round(techCount * (0.28 + ((seed >> 8) % 22) / 100) * factor),
  );
  const preview = [0, 1, 2].map((i) => mockPreview(district, i));

  return {
    total,
    techCount,
    highPotential,
    preview,
    blurredCount: Math.max(0, highPotential - 3),
  };
}
