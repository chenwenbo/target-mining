"use client";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import AgentPanel from "@/components/agent/AgentPanel";
import { useLayoutStore } from "@/lib/layout-store";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const agentPanelOpen = useLayoutStore((s) => s.agentPanelOpen);

  return (
    <div className="flex h-full">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto bg-[#f7f8fa] p-6 lg:p-8">
          {children}
        </main>
      </div>
      {/* 智能体面板：始终挂载，通过宽度过渡控制显隐 */}
      <div
        className={`flex-shrink-0 overflow-hidden transition-[width] duration-200 ease-in-out ${
          agentPanelOpen ? "w-[400px]" : "w-0"
        }`}
      >
        <AgentPanel />
      </div>
    </div>
  );
}
