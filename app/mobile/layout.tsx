import BottomNav from "@/components/mobile/BottomNav";

export const metadata = {
  title: "走访摸排助手 · 东西湖区科技局",
};

export default function MobileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center bg-gray-100 min-h-screen">
      <div className="relative w-full max-w-[430px] min-h-screen bg-gray-50 flex flex-col pb-14">
        {children}
        <BottomNav />
      </div>
    </div>
  );
}
