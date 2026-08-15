import Link from "next/link";
import { notFound } from "next/navigation";
import { getOrderByNumber } from "@/lib/orders";
import { requireStore } from "@/lib/storefront";
import { STATUS_LABELS } from "@/lib/orders";
import { formatDateTime, formatMoney } from "@/lib/format";

const PAYMENT_LABELS: Record<string, string> = {
  CASH_ON_DELIVERY: "Contra entrega",
  BANK_TRANSFER: "Transferencia bancaria",
};

export default async function OrderConfirmationPage({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;

  const store = await requireStore(slug);

  const order = await getOrderByNumber(store.id, number);

  if (!order) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-2xl px-6 py-12">
      <div className="rounded-xl border p-8 text-center">
        <h1 className="text-2xl font-bold">¡Pedido confirmado!</h1>
        <p className="mt-2 text-gray-600">
          Tu número de pedido es <strong>{order.number}</strong>
        </p>
        <p className="mt-1 text-sm text-gray-500">
          {formatDateTime(order.createdAt)} ·{" "}
          {STATUS_LABELS[order.status]}
        </p>
        <p className="mt-4 text-sm text-gray-500">
          Te enviamos el comprobante a {order.customerEmail}.
        </p>

        <Link
          href={`/tienda/${slug}/pedido/${order.number}/recibo`}
          className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
        >
          Ver comprobante
        </Link>
      </div>

      <section className="mt-6 overflow-hidden rounded-xl border">
        <table className="w-full">
          <tbody>
            {order.items.map((item) => (
              <tr key={item.id} className="border-b last:border-0">
                <td className="px-4 py-3">
                  <p className="text-sm font-medium">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatMoney(item.unitPrice)} × {item.quantity}
                  </p>
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

      <section className="mt-6 rounded-xl border p-6 text-sm">
        <h2 className="font-semibold">Envío</h2>
        <p className="mt-2">{order.customerName}</p>
        <p className="text-gray-600">
          {order.shippingLine1}
          {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
        </p>
        <p className="text-gray-600">
          {order.shippingCity}
          {order.shippingState ? `, ${order.shippingState}` : ""}
        </p>
        <p className="mt-3 text-gray-500">
          Pago: {PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod}
        </p>
      </section>

      <div className="mt-8 text-center">
        <Link
          href={`/tienda/${slug}`}
          className="rounded-lg border px-5 py-3 text-sm font-medium"
        >
          Seguir comprando
        </Link>
      </div>
    </main>
  );
}
