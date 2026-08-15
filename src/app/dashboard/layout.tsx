import { requireAuth } from "@/lib/auth-guards";
import { resolveActiveTenantId } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { Sidebar } from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuth();

  const tenantId = await resolveActiveTenantId(session.user);

  const tenant = tenantId
    ? await prisma.tenant.findUnique({
        where: { id: tenantId },
        select: { name: true },
      })
    : null;

  return (
    <div className="flex min-h-screen">
      <Sidebar user={session.user} storeName={tenant?.name ?? null} />
      <div className="flex-1 overflow-x-auto">{children}</div>
    </div>
  );
}
