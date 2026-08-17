import Link from "next/link";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/tenants";
import { selectTenant } from "./actions";

export default async function SelectTenantPage() {
  await requireRole("SUPER_ADMIN");

  const tenants = await prisma.tenant.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
    },
  });

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Seleccionar tienda
        </h1>

        <p className="mt-2 text-sm text-slate-500">
          Como Super Admin no perteneces a una tienda concreta. Elige sobre
          cuál quieres operar.
        </p>

        {tenants.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500">
            Todavía no hay tiendas creadas.
          </div>
        ) : (
          <ul className="mt-6 space-y-3 sm:mt-8">
            {tenants.map((tenant) => (
              <li key={tenant.id}>
                <form action={selectTenant}>
                  <input type="hidden" name="tenantId" value={tenant.id} />

                  <button
                    type="submit"
                    className="flex w-full items-center justify-between gap-3 rounded-2xl border border-slate-200 p-4 text-left transition hover:border-slate-300 hover:bg-slate-50"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {tenant.name}
                      </span>

                      <span className="block truncate text-sm text-slate-500">
                        /tienda/{tenant.slug} · {STATUS_LABELS[tenant.status]}
                      </span>
                    </span>

                    <span className="shrink-0 text-sm text-slate-500">
                      Entrar →
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}

        <Link
          href="/super-admin/tiendas/nueva"
          className="mt-6 inline-block rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          Crear una tienda
        </Link>
      </div>
    </main>
  );
}
