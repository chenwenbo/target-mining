import type { Company } from "./types";

// ─── 工业"六基"（专精特新"小巨人"申报核心领域）────────────────────
// 第一层：6 大类；第二层：每类下的细分方向。
// mock 企业数据没有六基字段，下面用现有字段（id / techField）确定性派生，
// 与 sme-criteria.deriveSMEFields / mock-data.getIPItems 的派生模式一致。

export interface IndustrialBase {
  category: string;   // 第一层分类
  items: string[];    // 第二层细分
}

export const INDUSTRIAL_SIX_BASES: IndustrialBase[] = [
  { category: "核心基础零部件/元器件", items: ["精密轴承", "齿轮", "液压件", "传感器", "芯片", "伺服电机"] },
  { category: "关键基础材料",         items: ["高性能合金", "半导体材料", "碳纤维", "特种陶瓷", "新能源电池材料"] },
  { category: "先进基础工艺",         items: ["精密加工", "精密铸造", "特种焊接", "3D打印", "表面处理", "集成电路制程"] },
  { category: "产业技术基础",         items: ["标准与计量", "检验检测", "认证认可", "工业互联网平台", "工业数据库"] },
  { category: "高端基础软件",         items: ["工业软件(CAD/CAM/CAE)", "嵌入式系统", "工业控制系统", "操作系统"] },
  { category: "基础关键装备",         items: ["精密机床", "工业机器人", "高端检测设备", "专用生产设备"] },
];

export const INDUSTRIAL_SIX_CATEGORIES = INDUSTRIAL_SIX_BASES.map((b) => b.category);

// 八大领域 → 六基大类的合理偏向（让派生结果与现有技术领域弱相关，更可信）
const TECHFIELD_BASE_BIAS: Record<string, number> = {
  "电子信息":         0, // 核心基础零部件/元器件（芯片、传感器）
  "生物与新医药":     3, // 产业技术基础（检验检测）
  "航空航天":         5, // 基础关键装备
  "新材料":           1, // 关键基础材料
  "高技术服务":       4, // 高端基础软件
  "新能源与节能":     1, // 关键基础材料（电池材料）
  "资源与环境":       3, // 产业技术基础
  "先进制造与自动化": 2, // 先进基础工艺
};

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export interface IndustrialSixAssignment {
  categoryIndex: number;
  category: string;
  subdivision: string;
}

export function deriveIndustrialSix(c: Company): IndustrialSixAssignment {
  const seed = hashStr(c.id);
  const r1 = (seed % 1000) / 1000;
  const bias = c.techField ? TECHFIELD_BASE_BIAS[c.techField] : undefined;

  // 60% 落在 techField 偏向的大类，其余按哈希铺开到 6 大类
  const categoryIndex = bias !== undefined && r1 < 0.6 ? bias : seed % INDUSTRIAL_SIX_BASES.length;

  const base = INDUSTRIAL_SIX_BASES[categoryIndex];
  const subdivision = base.items[Math.floor(seed / 7) % base.items.length];

  return { categoryIndex, category: base.category, subdivision };
}
