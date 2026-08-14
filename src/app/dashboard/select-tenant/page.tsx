import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
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
    },
  });

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">
          Seleccionar tienda
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Como Super Admin no perteneces a una tienda concreta. Elige
          sobre cuál quieres operar.
        </p>

        {tenants.length === 0 ? (
          <div className="mt-8 rounded-xl border p-12 text-center text-gray-500">
            Todavía no hay tiendas creadas.
          </div>
        ) : (
          <ul className="mt-8 space-y-3">
            {tenants.map((tenant) => (
              <li key={tenant.id}>
                <form action={selectTenant}>
                  <input
                    type="hidden"
                    name="tenantId"
                    value={tenant.id}
                  />

                  <button
                    type="submit"
                    className="flex w-full items-center justify-between rounded-xl border p-4 text-left hover:bg-gray-50"
                  >
                    <span>
                      <span className="block font-medium">
                        {tenant.name}
                      </span>

                      <span className="block text-sm text-gray-500">
                        /{tenant.slug}
                      </span>
                    </span>

                    <span className="text-sm text-gray-500">
                      Entrar →
                    </span>
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
