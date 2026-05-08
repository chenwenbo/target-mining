import { Metadata } from "next";
import LandingClient from "./LandingClient";

export const metadata: Metadata = {
  title: "高企申报标的挖掘平台 · 武汉",
  description: "帮助区县科技局完成高企申报全流程闭环管理，从标的挖掘到摸排汇总一站搞定。",
};

interface PageProps {
  searchParams: Promise<{ from?: string }>;
}

export default async function LandingPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const from = params.from ?? "";
  return <LandingClient from={from} />;
}
