import OpsSidebar from "./OpsSidebar";
import OpsTopbar from "./OpsTopbar";

export default function OpsShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full">
      <OpsSidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <OpsTopbar />
        <main className="flex-1 overflow-y-auto bg-[#f7f8fa] p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
