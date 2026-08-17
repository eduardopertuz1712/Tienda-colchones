import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireStore } from "@/lib/storefront";
import { STATUS_LABELS } from "@/lib/orders";
import { PAYMENT_LABELS } from "@/lib/receipt";
import { formatDateTime, formatMoney } from "@/lib/format";
import { PrintButton } from "@/components/store/PrintButton";

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ slug: string; number: string }>;
}) {
  const { slug, number } = await params;

  const store = await requireStore(slug);

  const order = await prisma.order.findFirst({
    where: { tenantId: store.id, number },
    include: { items: true },
  });

  if (!order) {
    notFound();
  }

  const money = (value: unknown) => formatMoney(value, store.currency);

  return (
    <main className="mx-auto max-w-2xl px-6 py-10 print:px-0 print:py-0">
      {/* La barra de acciones desaparece al imprimir. */}
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/tienda/${slug}/pedido/${number}`}
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Volver al pedido
        </Link>

        <PrintButton />
      </div>

      <article className="rounded-2xl border border-slate-200 print:rounded-none print:border-0">
        <header
          className="rounded-t-2xl px-5 py-6 text-white sm:px-8 sm:py-7 print:rounded-none"
          style={{ backgroundColor: store.primaryColor }}
        >
          <h1 className="text-xl font-bold">{store.name}</h1>
          <p className="mt-1 text-sm opacity-85">Comprobante de compra</p>
        </header>

        <div className="px-5 py-6 sm:px-8 sm:py-7">
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Pedido</dt>
            <dd className="text-right font-semibold">{order.number}</dd>

            <dt className="text-slate-500">Fecha</dt>
            <dd className="text-right">{formatDateTime(order.createdAt)}</dd>

            <dt className="text-slate-500">Estado</dt>
            <dd className="text-right">{STATUS_LABELS[order.status]}</dd>

            <dt className="text-slate-500">Pago</dt>
            <dd className="text-right">
              {PAYMENT_LABELS[order.paymentMethod]}
            </dd>
          </dl>

          <table className="mt-7 w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-left text-xs uppercase tracking-wide text-slate-400">
                <th className="pb-2 font-medium">Producto</th>
                <th className="pb-2 text-right font-medium">Cant.</th>
                <th className="pb-2 text-right font-medium">Precio</th>
                <th className="pb-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-3">
                    <p className="font-medium">{item.name}</p>
                    <p className="text-xs text-slate-500">{item.sku}</p>
                  </td>
                  <td className="py-3 text-right">{item.quantity}</td>
                  <td className="py-3 text-right">
                    {money(item.unitPrice)}
                  </td>
                  <td className="py-3 text-right font-medium">
                    {money(item.subtotal)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="mt-5 ml-auto max-w-xs space-y-1.5 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{money(order.subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Envío</span>
              <span>
                {Number(order.shipping) === 0 ? "Gratis" : money(order.shipping)}
              </span>
            </div>
            <div className="flex justify-between border-t border-slate-200 pt-2 text-base font-bold">
              <span>Total</span>
              <span>{money(order.total)}</span>
            </div>
          </div>

          <div className="mt-8 grid gap-6 border-t border-slate-200 pt-6 text-sm sm:grid-cols-2">
            <div>
              <p className="font-semibold">Comprador</p>
              <p className="mt-1 text-slate-600">{order.customerName}</p>
              <p className="text-slate-600">{order.customerEmail}</p>
              {order.customerPhone && (
                <p className="text-slate-600">{order.customerPhone}</p>
              )}
            </div>

            <div>
              <p className="font-semibold">Envío</p>
              <p className="mt-1 text-slate-600">
                {order.shippingLine1}
                {order.shippingLine2 ? `, ${order.shippingLine2}` : ""}
              </p>
              <p className="text-slate-600">
                {order.shippingCity}
                {order.shippingState ? `, ${order.shippingState}` : ""}
              </p>
            </div>
          </div>
        </div>

        <footer className="border-t border-slate-200 bg-slate-50 px-5 py-5 text-center text-xs text-slate-500 sm:px-8 print:bg-white">
          <p>
            {[store.email, store.phone, store.address]
              .filter(Boolean)
              .join(" · ")}
          </p>
          <p className="mt-2">
            Comprobante de compra. No es una factura electrónica con
            validez fiscal.
          </p>
        </footer>
      </article>
    </main>
  );
}
