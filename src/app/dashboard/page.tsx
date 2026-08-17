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
import { formatMoney } from "@/lib/format";

export default async function DashboardPage() {
  const session = await requireAuth();

  const tenantId = await resolveActiveTenantId(session.user);

  if (!tenantId) {
    return (
      <main className="p-4 sm:p-6 lg:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>
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

  const [summary, top, daily, recent] = await Promise.all([
    getSalesSummary(tenantId),
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
    <main className="p-4 sm:p-6 lg:p-8">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3">
        {cards.map((card) => (
          <div key={card.label} className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <p className="text-xs text-slate-500 sm:text-sm">{card.label}</p>
            <p className="mt-1.5 text-xl font-bold tabular-nums sm:text-2xl">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8">
        <SalesChart data={daily} />
      </div>

      <div className="mt-6 rounded-2xl border border-slate-200 p-5 sm:p-6">
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

      <section className="mt-6 rounded-2xl border border-slate-200 p-5 sm:p-6">
        <h2 className="font-semibold">Productos más vendidos</h2>

        {top.length === 0 ? (
          <p className="mt-4 text-sm text-slate-500">
            Todavía no hay ventas registradas.
          </p>
        ) : (
          <ul className="mt-4 divide-y">
            {top.map((item) => (
              <li
                key={item.sku}
                className="flex flex-wrap items-baseline justify-between gap-2 py-2.5 text-sm"
              >
                <span className="font-medium">{item.name}</span>
                <span className="text-slate-500">
                  {Number(item.units)} uds · {formatMoney(item.revenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
