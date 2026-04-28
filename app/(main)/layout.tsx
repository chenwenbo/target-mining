import AppShell from "@/components/layout/AppShell";
import AuthGate from "@/components/layout/AuthGate";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppShell>
      <AuthGate>{children}</AuthGate>
    </AppShell>
  );
}
