"use client";
import { use, useState } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft, Building2,
} from "lucide-react";
import { getCompanyById } from "@/lib/mock-data";
import { getCertifiedCompanyById } from "@/lib/renewal-data";
import TabRenewalAnalysis from "./TabRenewalAnalysis";
import TabAssessment from "./TabAssessment";
import { cn } from "@/lib/cn";
import { DECLARATION_WILLINGNESS_LABELS } from "@/lib/types";

// ─── Tab: 企业画像 ────────────────────────────────────────────
function TabCompanyProfile({ company }: { company: NonNullable<ReturnType<typeof getCompanyById>> }) {
  const scale = company.employees > 100 ? "中型" : company.employees > 20 ? "小型" : "XS(微型)";

  const rows: [string, string, string, string][] = [
    ["注册资本", `${company.registeredCapital}万元`, "经营状态", "存续（在营、开业、在册）"],
    ["统一社会信用代码", company.creditCode, "工商注册号", "—"],
    ["法人", company.contact.name, "组织机构代码", company.creditCode.slice(8, 17)],
    ["成立时间", company.establishedAt, "企业规模", scale],
    ["实缴资本", "暂无", "所属行业", company.industry],
    ["公司类型", "有限责任公司（自然人投资或控股）", "登记机关", "暂无"],
    ["办公地址", "—", "注册地址", `${company.street}`],
  ];

  const { patents, software } = company;
  const totalPatents = patents.invention + patents.utility + patents.design;

  const ipStats = [
    {
      title: "发明专利",
      rows: [
        ["前三年授权数", patents.invention > 0 ? Math.max(0, patents.invention - 1) : 0],
        ["当年授权数", patents.invention > 0 ? 1 : 0],
        ["申请中", Math.floor(patents.invention * 0.3)],
        ["其他年份授权数", 0],
      ],
    },
    {
      title: "二类知识产权",
      rows: [
        ["前三年授权数", patents.utility > 0 ? patents.utility - 1 : 0],
        ["当年授权数", patents.utility > 0 ? 1 : 0],
        ["申请中", Math.floor(patents.utility * 0.2)],
        ["其他年份授权数", 0],
      ],
    },
    {
      title: "特殊类专利",
      rows: [
        ["前三年授权数", 0],
        ["当年授权数", 0],
        ["申请中", 0],
        ["其他年份授权数", 0],
      ],
    },
  ];

  const patentRows = Array.from({ length: Math.min(totalPatents, 5) }, (_, i) => ({
    seq: i + 1,
    appNo: `202${2 + (i % 3)}${company.creditCode.slice(2, 8)}${String(i + 1).padStart(4, "0")}`,
    appDate: `202${2 + (i % 3)}-${String((i % 12) + 1).padStart(2, "0")}-15`,
    grantDate: i < 3 ? `202${3 + (i % 2)}-06-20` : "—",
    title: `${company.industry}相关专利（${i + 1}）`,
    pubNo: `CN${company.creditCode.slice(2, 12)}${i + 1}A`,
    type: i === 0 ? "发明专利" : i < 3 ? "实用新型" : "外观设计",
    status: i < 3 ? "有效" : "审中",
  }));

  const trademarkCount = Math.max(1, Math.floor((patents.invention + patents.utility) / 4));
  const trademarkRows = Array.from({ length: Math.min(trademarkCount, 4) }, (_, i) => ({
    seq: i + 1,
    regNo: `${62000000 + parseInt(company.creditCode.slice(4, 8)) + i * 317}`,
    name: `${company.name.slice(0, 2)}${["智联", "云享", "数创", "科芯"][i % 4]}`,
    applyDate: `202${1 + (i % 3)}-${String((i * 3 + 4) % 12 + 1).padStart(2, "0")}-${String((i * 7 + 10) % 28 + 1).padStart(2, "0")}`,
    status: i < trademarkCount - 1 ? "已注册" : "审中",
  }));

  const domainBase = company.name.slice(0, 2).split("").map(c => c.charCodeAt(0).toString(16)).join("").slice(0, 6);
  const websiteRows = [
    {
      seq: 1,
      approveDate: `${parseInt(company.establishedAt.slice(0, 4)) + 1}-06-15`,
      siteName: `${company.name}官方网站`,
      homepage: `www.${domainBase}tech.com`,
      icp: `鄂ICP备${company.creditCode.slice(2, 8)}号`,
    },
    {
      seq: 2,
      approveDate: `${parseInt(company.establishedAt.slice(0, 4)) + 2}-03-20`,
      siteName: `${company.name.slice(0, 4)}产品服务平台`,
      homepage: `app.${domainBase}tech.com`,
      icp: `鄂ICP备${company.creditCode.slice(2, 8)}号-2`,
    },
  ];

  const copyrightRows = Array.from({ length: Math.min(software, 5) }, (_, i) => ({
    seq: i + 1,
    approveDate: `202${2 + (i % 3)}-${String((i % 12) + 1).padStart(2, "0")}-01`,
    fullName: `${company.name.slice(0, 4)}${["管理系统", "平台软件", "控制系统", "分析工具", "数据平台"][i % 5]}V${i + 1}.0`,
    shortName: `${["管理系统", "平台", "控制系统", "分析工具", "数据平台"][i % 5]}`,
    regNo: `2023SR${String(100000 + i * 1234).padStart(6, "0")}`,
    category: "应用软件",
    version: `V${i + 1}.0`,
  }));

  return (
    <div className="space-y-6">
      {/* 工商信息 */}
      <div>
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">工商信息</h3>
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <tbody>
              {rows.map(([k1, v1, k2, v2], i) => (
                <tr key={i} className={i % 2 === 1 ? "bg-[#f7f8fa]" : "bg-white"}>
                  <td className="px-4 py-3 text-[#64748b] w-[130px] border-r border-[#e5e7eb] font-medium text-xs">{k1}</td>
                  <td className="px-4 py-3 text-[#0f172a] text-xs border-r border-[#e5e7eb]">{v1}</td>
                  <td className="px-4 py-3 text-[#64748b] w-[130px] border-r border-[#e5e7eb] font-medium text-xs">{k2}</td>
                  <td className="px-4 py-3 text-[#0f172a] text-xs">{v2}</td>
                </tr>
              ))}
              <tr className="bg-[#f7f8fa]">
                <td className="px-4 py-3 text-[#64748b] w-[130px] border-r border-[#e5e7eb] font-medium text-xs align-top">经营范围</td>
                <td colSpan={3} className="px-4 py-3 text-[#0f172a] text-xs leading-relaxed">
                  {company.industry}技术研发；软件开发；计算机软硬件研发及批零兼营；物联网技术服务。（涉及许可经营项目，应取得相关部门许可后方可经营）
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 知识产权信息 */}
      <div className="text-xs text-[#94a3b8] bg-[#f7f8fa] rounded-lg px-4 py-3 leading-relaxed">
        知识产权来源于第三方平台，会根据近年的专利或软著申请，结合国网申请书数据，过滤出当前状态有效的知产数据显示。
      </div>

      <div className="grid grid-cols-3 gap-4">
        {ipStats.map((stat) => (
          <div key={stat.title} className="border border-[#e5e7eb] rounded-lg overflow-hidden">
            <div className="bg-[#f7f8fa] px-4 py-2 border-b border-[#e5e7eb]">
              <span className="text-xs font-semibold text-[#0f172a]">{stat.title}</span>
            </div>
            <div className="divide-y divide-[#f1f5f9]">
              {stat.rows.map(([label, val]) => (
                <div key={label as string} className="flex items-center justify-between px-4 py-2.5">
                  <span className="text-xs text-[#64748b]">{label}</span>
                  <span className="text-sm font-semibold text-[#0f172a] tabular-nums">{val as number}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">专利信息（共{totalPatents}条）</h3>
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7f8fa] border-b border-[#e5e7eb]">
                {["序号", "申请号", "申请日期", "授权日期", "专利名称", "申请公布号", "专利类型", "法律状态"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[#64748b] font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {patentRows.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-6 text-center text-[#94a3b8]">暂无数据</td></tr>
              ) : patentRows.map((row) => (
                <tr key={row.seq} className="hover:bg-[#f7f8fa]">
                  <td className="px-3 py-2.5 text-[#94a3b8]">{row.seq}</td>
                  <td className="px-3 py-2.5 text-blue-600 font-mono">{row.appNo}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.appDate}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.grantDate}</td>
                  <td className="px-3 py-2.5 text-[#0f172a]">{row.title}</td>
                  <td className="px-3 py-2.5 text-[#475569] font-mono">{row.pubNo}</td>
                  <td className="px-3 py-2.5">
                    <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-[11px]">{row.type}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[11px]",
                      row.status === "有效" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">著作权信息（共{software}条）</h3>
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7f8fa] border-b border-[#e5e7eb]">
                {["序号", "批准日期", "软件全称", "软件简称", "登记号", "分类号", "版本号"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[#64748b] font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {copyrightRows.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-6 text-center text-[#94a3b8]">暂无数据</td></tr>
              ) : copyrightRows.map((row) => (
                <tr key={row.seq} className="hover:bg-[#f7f8fa]">
                  <td className="px-3 py-2.5 text-[#94a3b8]">{row.seq}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.approveDate}</td>
                  <td className="px-3 py-2.5 text-[#0f172a]">{row.fullName}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.shortName}</td>
                  <td className="px-3 py-2.5 text-blue-600 font-mono">{row.regNo}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.category}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.version}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">商标信息（共{trademarkRows.length}条）</h3>
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7f8fa] border-b border-[#e5e7eb]">
                {["序号", "注册号", "图片", "商标名", "申请日期", "商标状态"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[#64748b] font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {trademarkRows.map((row) => (
                <tr key={row.seq} className="hover:bg-[#f7f8fa]">
                  <td className="px-3 py-2.5 text-[#94a3b8]">{row.seq}</td>
                  <td className="px-3 py-2.5 text-blue-600 font-mono">{row.regNo}</td>
                  <td className="px-3 py-2.5">
                    <div className="w-10 h-10 rounded bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {row.name.slice(0, 1)}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 text-[#0f172a] font-medium">{row.name}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.applyDate}</td>
                  <td className="px-3 py-2.5">
                    <span className={cn("px-1.5 py-0.5 rounded text-[11px]",
                      row.status === "已注册" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
                    )}>{row.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-semibold text-[#0f172a] mb-3">网站备案（共{websiteRows.length}条）</h3>
        <div className="border border-[#e5e7eb] rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#f7f8fa] border-b border-[#e5e7eb]">
                {["序号", "审核日期", "网站名称", "网站首页", "网站备案/许可证号"].map((h) => (
                  <th key={h} className="px-3 py-2.5 text-left text-[#64748b] font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f5f9]">
              {websiteRows.map((row) => (
                <tr key={row.seq} className="hover:bg-[#f7f8fa]">
                  <td className="px-3 py-2.5 text-[#94a3b8]">{row.seq}</td>
                  <td className="px-3 py-2.5 text-[#475569]">{row.approveDate}</td>
                  <td className="px-3 py-2.5 text-[#0f172a]">{row.siteName}</td>
                  <td className="px-3 py-2.5 text-blue-600">{row.homepage}</td>
                  <td className="px-3 py-2.5 text-[#475569] font-mono">{row.icp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────
type Tab = "企业画像" | "复审分析" | "专业测评";

export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [activeTab, setActiveTab] = useState<Tab>("企业画像");

  const company = getCompanyById(id);
  if (!company) notFound();

  const certifiedCompany = company.alreadyCertified ? getCertifiedCompanyById(id) : undefined;

  const TABS: Tab[] = [
    "企业画像",
    ...(certifiedCompany ? ["复审分析" as Tab] : []),
    "专业测评",
  ];

  const updateDate = "2026-02-27";

  return (
    <div>
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-5">
        <Link href="/targets" className="flex items-center gap-1.5 text-sm text-[#94a3b8] hover:text-blue-600 transition-colors">
          <ArrowLeft size={14} /> 标的池
        </Link>
        <span className="text-[#cbd5e1]">/</span>
        <span className="text-sm text-[#475569] truncate max-w-xs">{company.name}</span>
      </div>

      {/* ─── Company Header Card ─── */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] p-6 mb-4">
        <div className="flex items-start gap-4">
          {/* Logo placeholder */}
          <div className="w-16 h-16 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 size={28} className="text-blue-400" />
          </div>

          {/* Name + meta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-[#0f172a] truncate">{company.name}</h1>
              <span className="text-xs text-[#94a3b8] whitespace-nowrap flex-shrink-0">
                {updateDate} 更新
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-[#475569]">
              <span>法人：<strong className="text-[#0f172a] font-medium">{company.contact.name}</strong></span>
              <span>注册资本：<strong className="text-[#0f172a] font-medium">{company.registeredCapital}万元</strong></span>
              <span>成立时间：<strong className="text-[#0f172a] font-medium">{company.establishedAt}</strong></span>
              <span>地区：<strong className="text-[#0f172a] font-medium">{company.street}</strong></span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <span className={cn(
                "inline-flex items-center px-2.5 py-1 text-xs rounded-full font-medium border",
                company.alreadyCertified
                  ? "bg-purple-50 text-purple-700 border-purple-200"
                  : "bg-blue-50 text-blue-700 border-blue-200"
              )}>
                {company.alreadyCertified ? "复审" : "新申报"}
              </span>
              {(() => {
                const w = company.declarationWillingness;
                const styles: Record<string, string> = {
                  strong: "bg-emerald-50 text-emerald-700 border-emerald-200",
                  moderate: "bg-teal-50 text-teal-700 border-teal-200",
                  hesitant: "bg-amber-50 text-amber-700 border-amber-200",
                  refused: "bg-red-50 text-red-600 border-red-200",
                  unknown: "bg-[#f1f5f9] text-[#94a3b8] border-[#e5e7eb]",
                };
                return (
                  <span className={cn("inline-flex items-center px-2.5 py-1 text-xs rounded-full border", styles[w])}>
                    申报意愿：{DECLARATION_WILLINGNESS_LABELS[w]}
                  </span>
                );
              })()}
            </div>
          </div>

        </div>
      </div>

      {/* ─── Tab bar ─── */}
      <div className="bg-white rounded-xl border border-[#e5e7eb] overflow-hidden">
        <div className="flex border-b border-[#e5e7eb]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-6 py-3.5 text-sm font-medium transition-colors relative whitespace-nowrap",
                activeTab === tab
                  ? "text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600"
                  : "text-[#94a3b8] hover:text-[#475569]"
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="p-6">
          {activeTab === "企业画像" && <TabCompanyProfile company={company} />}
          {activeTab === "复审分析" && certifiedCompany && <TabRenewalAnalysis company={certifiedCompany} />}
          {activeTab === "专业测评" && <TabAssessment company={company} />}
        </div>
      </div>
    </div>
  );
}
