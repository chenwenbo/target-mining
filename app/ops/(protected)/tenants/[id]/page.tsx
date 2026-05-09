import TenantDetailClient from "./TenantDetailClient";

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <TenantDetailClient id={id} />;
}
