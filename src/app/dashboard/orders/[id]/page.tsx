import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getOrder, nextStatuses, STATUS_LABELS } from "@/lib/orders";
import { can } from "@/lib/permissions";
import { formatDateTime, formatMoney } from "@/lib/format";
import { StatusForm } from "@/components/orders/StatusForm";

const PAYMENT_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Contra entrega",
  BANK_TRANSFER: "Transferencia bancaria",
};

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId, user } = await requireTenantPermission("view", "order");

  const { id } = await params;

  const order = await getOrder(tenantId, id);

  if (!order) {
    notFound();
  }

  const options = nextStatuses(order.status).map((value) => ({
    value,
    label: STATUS_LABELS[value],
  }));

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/dashboard/orders"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Volver a pedidos
          </Link>
          <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">{order.number}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {formatDateTime(order.createdAt)} ·{" "}
            <strong>{STATUS_LABELS[order.status]}</strong> ·{" "}
            {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
          </p>
        </div>

        {can(user, "update", "order") && (
          <div className="mb-8 rounded-xl border p-6">
            <h2 className="mb-4 text-sm font-medium">Cambiar estado</h2>
            <StatusForm orderId={order.id} options={options} />
          </div>
        )}

        <div className="grid gap-6 sm:grid-cols-2">
          <section className="rounded-xl border p-6">
            <h2 className="text-sm font-medium">Comprador</h2>
            <p className="mt-3 text-sm">{order.customerName}</p>
            <p className="text-sm text-gray-500">{order.customerEmail}</p>
            {order.customerPhone && (
              <p className="text-sm text-gray-500">{order.customerPhone}</p>
            )}
            {order.customer && (
              <Link
                href={`/dashboard/customers/${order.customer.id}`}
                className="mt-3 inline-block text-sm hover:underline"
              >
                Ver ficha del cliente →
              </Link>
            )}
          </section>

          <section className="rounded-xl border p-6">
            <h2 className="text-sm font-medium">Envío</h2>
            <p className="mt-3 text-sm">
              {order.shippingLine1}
              {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
            </p>
            <p className="text-sm text-gray-500">
              {order.shippingCity}
              {order.shippingState ? `, ${order.shippingState}` : ""}
              {order.shippingPostalCode
                ? ` ${order.shippingPostalCode}`
                : ""}
            </p>
            <p className="text-sm text-gray-500">{order.shippingCountry}</p>
          </section>
        </div>

        <section className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[36rem]">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold">
                  Producto
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Precio
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Cant.
                </th>
                <th className="px-4 py-3 text-right text-sm font-semibold">
                  Subtotal
                </th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium">{item.name}</p>
                    <p className="text-xs text-gray-500">{item.sku}</p>
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {formatMoney(item.unitPrice)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {item.quantity}
                  </td>
                  <td className="px-4 py-3 text-right font-medium">
                    {formatMoney(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="space-y-1 border-t bg-gray-50 px-4 py-4 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Subtotal</span>
              <span>{formatMoney(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Envío</span>
              <span>{formatMoney(order.shipping)}</span>
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Total</span>
              <span>{formatMoney(order.total)}</span>
            </div>
          </div>
        </section>

        {order.notes && (
          <section className="mt-6 rounded-xl border p-6">
            <h2 className="text-sm font-medium">Notas del comprador</h2>
            <p className="mt-2 text-sm text-gray-600">{order.notes}</p>
          </section>
        )}
      </div>
    </main>
  );
}
