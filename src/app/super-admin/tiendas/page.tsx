import Link from "next/link";
import { requirePlatformPermission } from "@/lib/auth-guards";
import { listTenants, STATUS_LABELS } from "@/lib/tenants";
import { formatDate } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  ACTIVE: "bg-emerald-50 text-emerald-700",
  SUSPENDED: "bg-amber-50 text-amber-700",
  INACTIVE: "bg-slate-100 text-slate-600",
};

export default async function TenantsPage() {
  await requirePlatformPermission("view", "tenant");

  const tenants = await listTenants();

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Tiendas
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {tenants.length} tienda{tenants.length === 1 ? "" : "s"} en la
              plataforma.
            </p>
          </div>

          <Link
            href="/super-admin/tiendas/nueva"
            className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Nueva tienda
          </Link>
        </div>

        {tenants.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
            Todavía no hay tiendas. Crea la primera.
          </div>
        ) : (
          <ul className="mt-6 grid gap-3 sm:grid-cols-2">
            {tenants.map((tenant) => {
              const owner = tenant.users[0];

              return (
                <li key={tenant.id}>
                  <Link
                    href={`/super-admin/tiendas/${tenant.id}`}
                    className="block h-full rounded-2xl border border-slate-200 p-4 transition hover:border-slate-300 hover:bg-slate-50 sm:p-5"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{tenant.name}</p>
                        <p className="truncate text-xs text-slate-500">
                          /tienda/{tenant.slug}
                        </p>
                      </div>

                      <span
                        className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                          STATUS_STYLES[tenant.status]
                        }`}
                      >
                        {STATUS_LABELS[tenant.status]}
                      </span>
                    </div>

                    <p className="mt-3 text-xs text-slate-500">
                      {owner
                        ? `Propietario: ${owner.name}`
                        : "Sin propietario asignado"}
                    </p>

                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                      <span>{tenant._count.products} productos</span>
                      <span>{tenant._count.orders} pedidos</span>
                      <span>{tenant._count.users} usuarios</span>
                      <span>Desde {formatDate(tenant.createdAt)}</span>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </main>
  );
}
