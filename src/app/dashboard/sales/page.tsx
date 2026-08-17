import { requireTenantPermission } from "@/lib/auth-guards";
import { getSalesSummary, getTopProducts } from "@/lib/orders";
import { formatMoney } from "@/lib/format";

export default async function SalesPage() {
  const { tenantId } = await requireTenantPermission("view", "sale");

  const [summary, top] = await Promise.all([
    getSalesSummary(tenantId),
    getTopProducts(tenantId, 10),
  ]);

  const cards = [
    { label: "Ventas de hoy", value: formatMoney(summary.todayRevenue) },
    { label: "Pedidos de hoy", value: String(summary.todayOrders) },
    { label: "Ventas del mes", value: formatMoney(summary.monthRevenue) },
    { label: "Pedidos del mes", value: String(summary.monthOrders) },
    { label: "Pedidos totales", value: String(summary.totalOrders) },
    { label: "Pendientes", value: String(summary.pendingOrders) },
  ];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Ventas</h1>
        <p className="mt-2 text-sm text-gray-500">
          Los pedidos cancelados y reembolsados no cuentan como venta.
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.label} className="rounded-xl border p-5">
              <p className="text-sm text-gray-500">{card.label}</p>
              <p className="mt-2 text-2xl font-bold">{card.value}</p>
            </div>
          ))}
        </div>

        <section className="mt-8 overflow-hidden rounded-xl border">
          <div className="border-b bg-gray-50 px-4 py-3 sm:px-6 sm:py-4">
            <h2 className="font-semibold">Productos más vendidos</h2>
          </div>

          <div className="overflow-x-auto">
          <table className="w-full min-w-[36rem]">
            <thead className="border-b">
              <tr>
                <th className="px-4 py-3 sm:px-6 text-left text-sm font-semibold">
                  Producto
                </th>
                <th className="px-4 py-3 sm:px-6 text-left text-sm font-semibold">
                  SKU
                </th>
                <th className="px-4 py-3 sm:px-6 text-right text-sm font-semibold">
                  Unidades
                </th>
                <th className="px-4 py-3 sm:px-6 text-right text-sm font-semibold">
                  Ingresos
                </th>
              </tr>
            </thead>
            <tbody>
              {top.map((item) => (
                <tr key={item.sku} className="border-b last:border-0">
                  <td className="px-4 py-3 sm:px-6 text-sm font-medium">
                    {item.name}
                  </td>
                  <td className="px-4 py-3 sm:px-6 text-sm text-gray-500">
                    {item.sku}
                  </td>
                  <td className="px-4 py-3 sm:px-6 text-right text-sm">
                    {Number(item.units)}
                  </td>
                  <td className="px-4 py-3 sm:px-6 text-right font-medium">
                    {formatMoney(item.revenue)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          {top.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              Todavía no hay ventas registradas.
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
