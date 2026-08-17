import Link from "next/link";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getCustomers } from "@/lib/customers";
import { formatDate } from "@/lib/format";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { tenantId } = await requireTenantPermission("view", "customer");

  const { page: pageParam, q } = await searchParams;

  const requested = Number(pageParam);

  const { items, page, pageCount, total } = await getCustomers(tenantId, {
    page: Number.isFinite(requested) ? requested : 1,
    query: q || undefined,
  });

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Clientes</h1>
        <p className="mt-2 text-sm text-gray-500">
          {total} cliente(s) registrados en tu tienda.
        </p>

        <form className="mt-6 flex gap-3" action="/dashboard/customers">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o correo..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Buscar
          </button>
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[36rem]">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm font-semibold">
                  Cliente
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm font-semibold">
                  Teléfono
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-right text-sm font-semibold">
                  Pedidos
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm font-semibold">
                  Alta
                </th>
                <th className="px-4 py-3 sm:px-6 sm:py-4" />
              </tr>
            </thead>
            <tbody>
              {items.map((customer) => (
                <tr key={customer.id} className="border-b last:border-0">
                  <td className="px-4 py-3 sm:px-6 sm:py-4">
                    <p className="font-medium">{customer.name}</p>
                    <p className="text-sm text-gray-500">{customer.email}</p>
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm">
                    {customer.phone ?? "—"}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right font-medium">
                    {customer._count.orders}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm text-gray-500">
                    {formatDate(customer.createdAt)}
                  </td>
                  <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                    <Link
                      href={`/dashboard/customers/${customer.id}`}
                      className="text-sm font-medium hover:underline"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {q ? "Ningún cliente coincide." : "Todavía no hay clientes."}
            </div>
          )}
        </div>

        {pageCount > 1 && (
          <div className="mt-6 flex justify-between text-sm">
            <span className="text-gray-500">
              Página {page} de {pageCount}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/customers?page=${page - 1}`}
                  className="rounded-lg border px-3 py-2"
                >
                  Anterior
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={`/dashboard/customers?page=${page + 1}`}
                  className="rounded-lg border px-3 py-2"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
