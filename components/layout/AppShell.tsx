"use client";
import { useState } from "react";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<"leader" | "staff">("leader");

  return (
    <div className="flex h-full">
      <Sidebar role={role} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar role={role} onRoleChange={setRole} />
        <main className="flex-1 overflow-y-auto bg-[#f7f8fa] p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
