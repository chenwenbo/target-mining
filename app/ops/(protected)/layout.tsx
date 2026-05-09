import OpsShell from "@/components/ops/OpsShell";
import OpsAuthGate from "@/components/ops/OpsAuthGate";

export default function OpsProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <OpsShell>
      <OpsAuthGate>{children}</OpsAuthGate>
    </OpsShell>
  );
}
