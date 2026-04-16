import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "高企标的挖掘 · 东西湖区",
  description: "高新技术企业申报潜在标的智能识别系统",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
