import Link from "next/link";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getOrders, STATUS_LABELS } from "@/lib/orders";
import { formatDateTime, formatMoney } from "@/lib/format";
import type { OrderStatus } from "@/generated/prisma/enums";

const STATUSES = Object.keys(STATUS_LABELS) as OrderStatus[];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; q?: string }>;
}) {
  const { tenantId } = await requireTenantPermission("view", "order");

  const { page: pageParam, status, q } = await searchParams;

  const requested = Number(pageParam);

  const validStatus = STATUSES.includes(status as OrderStatus)
    ? (status as OrderStatus)
    : undefined;

  const { items, page, pageCount, total } = await getOrders(tenantId, {
    page: Number.isFinite(requested) ? requested : 1,
    status: validStatus,
    query: q || undefined,
  });

  return (
    <main className="p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Pedidos</h1>
        <p className="mt-2 text-sm text-gray-500">{total} pedido(s).</p>

        <form className="mt-6 flex flex-wrap gap-3" action="/dashboard/orders">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por número, cliente o correo..."
            className="min-w-60 flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <select
            name="status"
            defaultValue={validStatus ?? ""}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todos los estados</option>
            {STATUSES.map((value) => (
              <option key={value} value={value}>
                {STATUS_LABELS[value]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Filtrar
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-xl border">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Pedido
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Cliente
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Estado
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Total
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {items.map((order) => (
                <tr key={order.id} className="border-b last:border-0">
                  <td className="px-6 py-4">
                    <p className="font-medium">{order.number}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(order.createdAt)} ·{" "}
                      {order._count.items} línea(s)
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <p>{order.customerName}</p>
                    <p className="text-xs text-gray-500">
                      {order.customerEmail}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {STATUS_LABELS[order.status]}
                  </td>
                  <td className="px-6 py-4 text-right font-medium">
                    {formatMoney(order.total)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
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
              No hay pedidos que coincidan.
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
                  href={`/dashboard/orders?page=${page - 1}`}
                  className="rounded-lg border px-3 py-2"
                >
                  Anterior
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={`/dashboard/orders?page=${page + 1}`}
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
