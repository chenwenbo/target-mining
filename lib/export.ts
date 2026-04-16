import Papa from "papaparse";
import type { ScoredCompany } from "./types";

export function exportToCSV(companies: ScoredCompany[], filename = "高企潜在标的名单.csv") {
  const rows = companies.map((c) => ({
    企业名称: c.name,
    统一社会信用代码: c.creditCode,
    所在街道园区: c.street,
    所属领域: c.techField ?? "未分类",
    细分行业: c.industry,
    综合评分: c.score.total,
    置信度分档: `${c.score.tier} 类`,
    注册资本万元: c.registeredCapital,
    参保人数: c.employees,
    研发人员数: c.rdEmployees,
    发明专利: c.patents.invention,
    实用新型专利: c.patents.utility,
    外观设计专利: c.patents.design,
    软件著作权: c.software,
    是否入库科技型中小企业: c.inSMEDatabase ? "是" : "否",
    经营风险: c.risk.abnormal || c.risk.penalty ? "有" : "无",
    联系人: c.contact.name,
    联系电话: c.contact.phone,
    成立日期: c.establishedAt,
  }));

  const csv = Papa.unparse(rows, { header: true });
  // Add UTF-8 BOM so Excel doesn't garble Chinese
  const bom = "\uFEFF";
  const blob = new Blob([bom + csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
