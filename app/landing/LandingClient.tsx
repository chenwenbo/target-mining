"use client";

import { useRef, useState } from "react";
import {
  BarChart3,
  Building2,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  MapPin,
  Search,
  Smartphone,
  Target,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { getStreetStats, getStreets, type StreetStats } from "@/lib/landing-data";

interface Props {
  from: string;
}

interface LeadForm {
  name: string;
  unit: string;
  phone: string;
}

const BLURRED_ROWS = 4;

export default function LandingClient({ from }: Props) {
  const streets = getStreets();
  const [selectedStreet, setSelectedStreet] = useState("");
  const [stats, setStats] = useState<StreetStats | null>(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const [lead, setLead] = useState<LeadForm>({ name: "", unit: "", phone: "" });
  const [leadSubmitted, setLeadSubmitted] = useState(false);
  const [finalFormSubmitted, setFinalFormSubmitted] = useState(false);
  const [finalLead, setFinalLead] = useState<LeadForm>({ name: "", unit: "", phone: "" });
  const ctaRef = useRef<HTMLDivElement>(null);

  function handleAnalyze() {
    if (!selectedStreet) return;
    setStats(getStreetStats(selectedStreet));
    setAnalyzed(true);
    setUnlocked(false);
  }

  function handleUnlock() {
    setShowModal(true);
  }

  function handleLeadSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!lead.name || !lead.phone) return;
    const record = { ...lead, street: selectedStreet, from, submittedAt: new Date().toISOString() };
    const stored = JSON.parse(localStorage.getItem("landing_leads") ?? "[]");
    stored.push(record);
    localStorage.setItem("landing_leads", JSON.stringify(stored));
    setLeadSubmitted(true);
    setTimeout(() => {
      setShowModal(false);
      setUnlocked(true);
      setLeadSubmitted(false);
      setLead({ name: "", unit: "", phone: "" });
    }, 1200);
  }

  function handleFinalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!finalLead.name || !finalLead.phone) return;
    const record = { ...finalLead, from, source: "final_cta", submittedAt: new Date().toISOString() };
    const stored = JSON.parse(localStorage.getItem("landing_leads") ?? "[]");
    stored.push(record);
    localStorage.setItem("landing_leads", JSON.stringify(stored));
    setFinalFormSubmitted(true);
  }

  function scrollToCTA() {
    ctaRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const isWuhanSource = from === "wuhan-chuangke";

  return (
    <div className="min-h-screen bg-white text-[#0f172a] font-sans">
      {/* ── 粘性导航 ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-[#e5e7eb]">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
              TM
            </div>
            <span className="text-sm font-semibold text-[#0f172a]">标的挖掘平台</span>
          </div>
          <button
            onClick={scrollToCTA}
            className="px-4 py-1.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
          >
            申请演示
          </button>
        </div>
      </header>

      {/* ── Hero + 数据钩子 ── */}
      <section className="pt-16 pb-12 px-4 bg-gradient-to-b from-blue-50/60 to-white">
        <div className="max-w-3xl mx-auto text-center">
          {isWuhanSource && (
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full mb-5">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              武汉市科创平台 · 合作产品
            </div>
          )}
          <h1 className="text-3xl sm:text-4xl font-bold leading-tight mb-3 text-[#0f172a]">
            每年高企申报季<br />
            <span className="text-blue-600">你们辖区还有多少潜在标的没挖到？</span>
          </h1>
          <p className="text-base text-[#475569] mb-10 max-w-xl mx-auto">
            从标的挖掘到摸排闭环，帮助区县科技局完成全年高企申报任务
          </p>

          {/* 数据钩子卡 */}
          <div className="bg-white rounded-2xl shadow-[0_4px_24px_0_rgba(15,23,42,0.08)] border border-[#e5e7eb] p-6 text-left">
            <p className="text-sm font-semibold text-[#0f172a] mb-3">选择你的辖区街道 / 园区</p>
            <div className="flex gap-2 mb-5">
              <div className="relative flex-1">
                <select
                  value={selectedStreet}
                  onChange={(e) => { setSelectedStreet(e.target.value); setAnalyzed(false); setStats(null); setUnlocked(false); }}
                  className="w-full appearance-none px-3.5 py-2.5 pr-9 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-blue-500 text-[#0f172a]"
                >
                  <option value="">-- 请选择街道 / 园区 --</option>
                  {streets.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94a3b8] pointer-events-none" />
              </div>
              <button
                onClick={handleAnalyze}
                disabled={!selectedStreet}
                className="px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5"
              >
                <Search size={14} />
                立即分析
              </button>
            </div>

            {/* 分析结果 */}
            {analyzed && stats && (
              <div className="border-t border-[#e5e7eb] pt-5">
                {/* 统计概览 */}
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold text-[#0f172a]">
                    {selectedStreet} · 潜在高企分析
                  </p>
                  <span className="text-xs text-[#94a3b8]">共 {stats.total} 家</span>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <StatChip color="slate" label="企业总数" value={stats.total} />
                  <StatChip color="blue" label="泛科技企业" value={stats.techCount} />
                  <StatChip color="emerald" label="高潜力企业" value={stats.highPotential} />
                </div>

                {/* 企业列表 */}
                <div className="rounded-xl border border-[#e5e7eb] overflow-hidden">
                  {/* 表头 */}
                  <div className="grid grid-cols-12 gap-2 px-4 py-2 bg-[#f7f8fa] text-[11px] font-semibold text-[#94a3b8] uppercase tracking-wide">
                    <div className="col-span-6">企业名称</div>
                    <div className="col-span-3">主营行业</div>
                    <div className="col-span-3 text-right">潜力评价</div>
                  </div>

                  {/* 真实前3条 */}
                  {stats.preview.map((c, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-[#f1f5f9] items-center">
                      <div className="col-span-6 text-sm font-medium text-[#0f172a] truncate">{c.name}</div>
                      <div className="col-span-3 text-xs text-[#475569]">{c.industry}</div>
                      <div className="col-span-3 text-right">
                        <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-emerald-50 text-emerald-700">
                          高潜力
                        </span>
                      </div>
                    </div>
                  ))}

                  {/* 模糊行（未解锁状态） */}
                  {!unlocked && Array.from({ length: BLURRED_ROWS }).map((_, i) => (
                    <div key={`blur-${i}`} className="grid grid-cols-12 gap-2 px-4 py-3 border-t border-[#f1f5f9] items-center select-none">
                      <div className="col-span-6">
                        <div className="h-3.5 rounded bg-[#e5e7eb] blur-[3px]" style={{ width: `${55 + (i * 13) % 30}%` }} />
                      </div>
                      <div className="col-span-3">
                        <div className="h-3 rounded bg-[#e5e7eb] blur-[3px] w-3/4" />
                      </div>
                      <div className="col-span-3 flex justify-end">
                        <div className="h-5 w-8 rounded bg-[#e5e7eb] blur-[3px]" />
                      </div>
                    </div>
                  ))}

                  {/* 解锁后额外展示 */}
                  {unlocked && (
                    <div className="px-4 py-3 border-t border-[#f1f5f9] bg-emerald-50/50">
                      <p className="text-xs text-emerald-700 font-medium text-center">
                        ✓ 已解锁，顾问将携完整高潜力名单（{stats.highPotential} 家）联系您
                      </p>
                    </div>
                  )}
                </div>

                {/* 底部 CTA */}
                {!unlocked ? (
                  <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 px-1">
                    <p className="text-xs text-[#94a3b8]">
                      高潜力企业共 <span className="font-semibold text-[#475569]">{stats.highPotential}</span> 家，仅展示前3条
                    </p>
                    <button
                      onClick={handleUnlock}
                      className="w-full sm:w-auto px-5 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
                    >
                      解锁完整名单 · 免费申请
                    </button>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 px-1 text-emerald-700 text-sm">
                    <CheckCircle2 size={16} className="shrink-0" />
                    申请已提交，1个工作日内联系您
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ── 三大痛点 ── */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">每到申报季，这些问题是否困扰着你</h2>
          <p className="text-sm text-[#94a3b8] text-center mb-10">区县科技局的真实痛点</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <PainCard
              icon={<BarChart3 size={20} className="text-blue-600" />}
              bg="bg-blue-50"
              title="标的难挖掘"
              desc="企业数据分散，潜在高企靠人工排查，容易漏掉符合条件的企业"
            />
            <PainCard
              icon={<ClipboardList size={20} className="text-amber-600" />}
              bg="bg-amber-50"
              title="任务难管理"
              desc="Excel + 微信群分配任务，进度不透明，结果无法实时汇总"
            />
            <PainCard
              icon={<MapPin size={20} className="text-emerald-600" />}
              bg="bg-emerald-50"
              title="结果难闭环"
              desc="线下摸排全靠电话汇报，数据无法沉淀，年度报告难出具"
            />
          </div>
        </div>
      </section>

      {/* ── 四步工作流 ── */}
      <section className="py-16 px-4 bg-[#f7f8fa]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold text-center mb-2">一个平台，覆盖全流程</h2>
          <p className="text-sm text-[#94a3b8] text-center mb-12">从挖掘到闭环，四步完成高企申报任务管理</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { step: "01", icon: <Target size={22} className="text-blue-600" />, title: "标的挖掘", desc: "AI筛选潜在高企，按潜力分层评级" },
              { step: "02", icon: <ClipboardList size={22} className="text-indigo-600" />, title: "任务派发", desc: "按街道分配摸排任务，一键下发" },
              { step: "03", icon: <Smartphone size={22} className="text-violet-600" />, title: "移动摸排", desc: "线下走访记录实时上传，随时随地" },
              { step: "04", icon: <BarChart3 size={22} className="text-emerald-600" />, title: "PC 闭环", desc: "汇总分析报告，驾驶舱全局呈现" },
            ].map(({ step, icon, title, desc }, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-[#e5e7eb] relative">
                <div className="text-[10px] font-bold text-[#cbd5e1] tracking-widest mb-3">{step}</div>
                <div className="w-10 h-10 rounded-xl bg-[#f7f8fa] flex items-center justify-center mb-3">
                  {icon}
                </div>
                <div className="text-sm font-semibold mb-1">{title}</div>
                <div className="text-xs text-[#94a3b8] leading-relaxed">{desc}</div>
                {i < 3 && (
                  <div className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 z-10 text-[#d4d7dd] text-base">›</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 信任数字 ── */}
      <section className="py-14 px-4 bg-blue-600">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center text-white">
          {[
            { value: "12+", label: "服务区县科技局" },
            { value: "3,800+", label: "协助摸排企业" },
            { value: "91%", label: "高企申报任务完成率" },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl sm:text-4xl font-bold mb-1">{value}</div>
              <div className="text-sm text-blue-200">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 最终留资区 ── */}
      <section ref={ctaRef} className="py-20 px-4 bg-white">
        <div className="max-w-md mx-auto text-center">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center mx-auto mb-5">
            <Building2 size={22} className="text-blue-600" />
          </div>
          <h2 className="text-2xl font-bold mb-2">立即获取辖区完整高企潜在标的名单</h2>
          <p className="text-sm text-[#94a3b8] mb-8">填写信息，1个工作日内安排产品演示（约30分钟）</p>

          {finalFormSubmitted ? (
            <div className="flex flex-col items-center gap-3 py-8 text-emerald-700">
              <CheckCircle2 size={40} />
              <p className="font-semibold text-lg">申请已提交</p>
              <p className="text-sm text-[#475569]">我们将在1个工作日内联系您安排演示</p>
            </div>
          ) : (
            <form onSubmit={handleFinalSubmit} className="space-y-3 text-left">
              <FormField
                label="姓名"
                placeholder="请输入您的姓名"
                value={finalLead.name}
                onChange={(v) => setFinalLead((f) => ({ ...f, name: v }))}
              />
              <FormField
                label="所在单位"
                placeholder="例如：东西湖区科技创新局"
                value={finalLead.unit}
                onChange={(v) => setFinalLead((f) => ({ ...f, unit: v }))}
              />
              <FormField
                label="手机号"
                placeholder="请输入联系电话"
                value={finalLead.phone}
                onChange={(v) => setFinalLead((f) => ({ ...f, phone: v }))}
                type="tel"
              />
              <button
                type="submit"
                disabled={!finalLead.name || !finalLead.phone}
                className="w-full py-3 mt-1 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                申请免费演示
              </button>
              <p className="text-center text-xs text-[#cbd5e1]">仅用于演示预约，不做其他用途</p>
            </form>
          )}
        </div>
      </section>

      {/* ── 页脚 ── */}
      <footer className="py-6 px-4 border-t border-[#f1f5f9] text-center text-xs text-[#cbd5e1]">
        标的挖掘平台 · 武汉演示版本
      </footer>

      {/* ── 留资 Modal ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 relative">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-[#94a3b8] hover:text-[#0f172a] transition-colors"
            >
              <X size={18} />
            </button>

            {leadSubmitted ? (
              <div className="flex flex-col items-center gap-3 py-6 text-emerald-700">
                <CheckCircle2 size={36} />
                <p className="font-semibold">解锁成功！</p>
                <p className="text-xs text-center text-[#475569]">顾问将携完整名单联系您</p>
              </div>
            ) : (
              <>
                <h3 className="text-base font-bold mb-1">解锁 {selectedStreet} 完整名单</h3>
                <p className="text-xs text-[#94a3b8] mb-5">
                  高潜力企业共 <span className="font-semibold text-[#475569]">{stats?.highPotential}</span> 家，留下联系方式即可获取完整名单
                </p>
                <form onSubmit={handleLeadSubmit} className="space-y-3">
                  <FormField
                    label="姓名"
                    placeholder="请输入您的姓名"
                    value={lead.name}
                    onChange={(v) => setLead((f) => ({ ...f, name: v }))}
                  />
                  <FormField
                    label="所在单位"
                    placeholder="例如：东西湖区科技创新局"
                    value={lead.unit}
                    onChange={(v) => setLead((f) => ({ ...f, unit: v }))}
                  />
                  <FormField
                    label="手机号"
                    placeholder="请输入联系电话"
                    value={lead.phone}
                    onChange={(v) => setLead((f) => ({ ...f, phone: v }))}
                    type="tel"
                  />
                  <button
                    type="submit"
                    disabled={!lead.name || !lead.phone}
                    className="w-full py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    立即解锁
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── 子组件 ──────────────────────────────────────────────────────

function StatChip({ color, label, value }: {
  color: "emerald" | "blue" | "slate";
  label: string;
  value: number;
}) {
  const cfg = {
    emerald: { bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" },
    blue:    { bg: "bg-blue-50",    text: "text-blue-700",    bar: "bg-blue-500" },
    slate:   { bg: "bg-slate-50",   text: "text-slate-600",   bar: "bg-slate-400" },
  }[color];
  return (
    <div className={cn("rounded-xl p-3.5", cfg.bg)}>
      <div className={cn("w-4 h-1 rounded-full mb-3", cfg.bar)} />
      <div className={cn("text-2xl font-bold", cfg.text)}>{value}</div>
      <div className={cn("text-xs mt-0.5", cfg.text)}>{label}</div>
    </div>
  );
}

function PainCard({ icon, bg, title, desc }: {
  icon: React.ReactNode;
  bg: string;
  title: string;
  desc: string;
}) {
  return (
    <div className="rounded-2xl border border-[#e5e7eb] p-6 bg-white">
      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center mb-4", bg)}>
        {icon}
      </div>
      <div className="text-base font-semibold mb-1.5">{title}</div>
      <div className="text-sm text-[#64748b] leading-relaxed">{desc}</div>
    </div>
  );
}

function FormField({ label, placeholder, value, onChange, type = "text" }: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-[#475569] mb-1.5">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3.5 py-2.5 text-sm bg-white border border-[#e5e7eb] rounded-lg outline-none focus:border-blue-500 placeholder:text-[#cbd5e1]"
      />
    </label>
  );
}
