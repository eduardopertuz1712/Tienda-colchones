import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getCustomer } from "@/lib/customers";
import { STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatMoney } from "@/lib/format";

export default async function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId } = await requireTenantPermission("view", "customer");

  const { id } = await params;

  const customer = await getCustomer(tenantId, id);

  if (!customer) {
    notFound();
  }

  const spent = customer.orders
    .filter((order) => !["CANCELLED", "REFUNDED"].includes(order.status))
    .reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/dashboard/customers"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Volver a clientes
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{customer.name}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {customer.email}
            {customer.phone ? ` · ${customer.phone}` : ""} · Cliente desde{" "}
            {formatDate(customer.createdAt)}
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Pedidos</p>
            <p className="mt-2 text-2xl font-bold">
              {customer.orders.length}
            </p>
          </div>
          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">Total comprado</p>
            <p className="mt-2 text-2xl font-bold">{formatMoney(spent)}</p>
          </div>
        </div>

        <section className="mt-8">
          <h2 className="font-semibold">Direcciones</h2>

          {customer.addresses.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              Sin direcciones guardadas.
            </p>
          ) : (
            <ul className="mt-3 space-y-3">
              {customer.addresses.map((address) => (
                <li key={address.id} className="rounded-xl border p-4 text-sm">
                  <p className="font-medium">
                    {address.label ?? "Dirección"}
                    {address.isDefault && (
                      <span className="ml-2 text-xs text-gray-500">
                        (principal)
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-gray-600">
                    {address.line1}
                    {address.line2 ? `, ${address.line2}` : ""} ·{" "}
                    {address.city}
                    {address.state ? `, ${address.state}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="mt-8">
          <h2 className="font-semibold">Historial de pedidos</h2>

          <div className="mt-3 overflow-x-auto rounded-xl border">
            <table className="w-full min-w-[36rem]">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Pedido
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Estado
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/orders/${order.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        {order.number}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {STATUS_LABELS[order.status]}
                    </td>
                    <td className="px-4 py-3 text-right font-medium">
                      {formatMoney(order.total)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {customer.orders.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                Este cliente todavía no ha comprado.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
