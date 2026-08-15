import Link from "next/link";
import { requireAuth } from "@/lib/auth-guards";
import { resolveActiveTenantId } from "@/lib/tenant";
import {
  getDailySales,
  getRecentOrders,
  getSalesSummary,
  getTopProducts,
  STATUS_LABELS,
} from "@/lib/orders";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { formatDate } from "@/lib/format";
import { getLowStockProducts } from "@/lib/inventory";
import { formatMoney } from "@/lib/format";

export default async function DashboardPage() {
  const session = await requireAuth();

  const tenantId = await resolveActiveTenantId(session.user);

  if (!tenantId) {
    return (
      <main className="p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="mt-6 rounded-xl border p-6">
          <p className="text-sm text-gray-600">
            No tienes una tienda activa seleccionada.
          </p>
          <Link
            href="/dashboard/select-tenant"
            className="mt-4 inline-block rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Elegir tienda
          </Link>
        </div>
      </main>
    );
  }

  const [summary, lowStock, top, daily, recent] = await Promise.all([
    getSalesSummary(tenantId),
    getLowStockProducts(tenantId, 5),
    getTopProducts(tenantId, 5),
    getDailySales(tenantId, 14),
    getRecentOrders(tenantId, 5),
  ]);

  const cards = [
    { label: "Ventas de hoy", value: formatMoney(summary.todayRevenue) },
    { label: "Pedidos de hoy", value: String(summary.todayOrders) },
    { label: "Ventas del mes", value: formatMoney(summary.monthRevenue) },
    { label: "Pedidos pendientes", value: String(summary.pendingOrders) },
    { label: "Productos activos", value: String(summary.products) },
    { label: "Clientes", value: String(summary.customers) },
  ];

  return (
    <main className="p-8">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border p-5">
            <p className="text-sm text-gray-500">{card.label}</p>
            <p className="mt-2 text-2xl font-bold">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <SalesChart data={daily} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-semibold">Últimos pedidos</h2>
          <Link href="/dashboard/orders" className="text-sm hover:underline">
            Ver todos →
          </Link>
        </div>

        {recent.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Todavía no has recibido pedidos.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {recent.map((order) => (
              <li
                key={order.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <Link
                    href={`/dashboard/orders/${order.id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {order.number}
                  </Link>
                  <p className="text-xs text-slate-500">
                    {order.customerName} · {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">
                    {formatMoney(order.total)}
                  </p>
                  <p className="text-xs text-slate-500">
                    {STATUS_LABELS[order.status]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border p-6">
          <h2 className="font-semibold">Productos con poco stock</h2>

          {lowStock.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Ningún producto por debajo del mínimo.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {lowStock.map((item) => (
                <li
                  key={item.id}
                  className="flex justify-between border-b pb-2 text-sm last:border-0"
                >
                  <span>
                    {item.name}{" "}
                    <span className="text-gray-500">({item.sku})</span>
                  </span>
                  <span className="font-medium text-red-600">
                    {item.stock} / mín. {item.minStock}
                  </span>
                </li>
              ))}
            </ul>
          )}

          <Link
            href="/dashboard/inventory"
            className="mt-4 inline-block text-sm hover:underline"
          >
            Ir a inventario →
          </Link>
        </section>

        <section className="rounded-xl border p-6">
          <h2 className="font-semibold">Productos más vendidos</h2>

          {top.length === 0 ? (
            <p className="mt-4 text-sm text-gray-500">
              Todavía no hay ventas registradas.
            </p>
          ) : (
            <ul className="mt-4 space-y-2">
              {top.map((item) => (
                <li
                  key={item.sku}
                  className="flex justify-between border-b pb-2 text-sm last:border-0"
                >
                  <span>{item.name}</span>
                  <span className="font-medium">
                    {Number(item.units)} uds · {formatMoney(item.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
