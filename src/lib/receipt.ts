import { formatMoney } from "@/lib/format";
import { STATUS_LABELS } from "@/lib/orders";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";

/**
 * Comprobante de compra.
 *
 * Ojo: esto es un recibo interno, NO una factura electrónica con validez
 * fiscal. En Colombia una factura electrónica debe estar autorizada y
 * numerada por la DIAN; para eso hace falta integrar un proveedor
 * autorizado. Por eso el documento se titula "Comprobante de compra".
 */

export const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  CASH_ON_DELIVERY: "Contra entrega",
  BANK_TRANSFER: "Transferencia bancaria",
};

export type ReceiptData = {
  store: {
    name: string;
    currency: string;
    email: string | null;
    phone: string | null;
    address: string | null;
    primaryColor: string;
    slug: string;
  };
  order: {
    number: string;
    createdAt: Date;
    status: OrderStatus;
    paymentMethod: PaymentMethod;
    customerName: string;
    customerEmail: string;
    customerPhone: string | null;
    shippingLine1: string;
    shippingLine2: string | null;
    shippingCity: string;
    shippingState: string | null;
    shippingPostalCode: string | null;
    subtotal: unknown;
    shipping: unknown;
    discount: unknown;
    total: unknown;
    notes: string | null;
    items: Array<{
      name: string;
      sku: string;
      quantity: number;
      unitPrice: unknown;
      subtotal: unknown;
    }>;
  };
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildReceiptText({ store, order }: ReceiptData): string {
  const money = (value: unknown) => formatMoney(value, store.currency);

  const lines = [
    `${store.name} — Comprobante de compra`,
    "",
    `Pedido:  ${order.number}`,
    `Fecha:   ${order.createdAt.toLocaleString("es-CO")}`,
    `Estado:  ${STATUS_LABELS[order.status]}`,
    `Pago:    ${PAYMENT_LABELS[order.paymentMethod]}`,
    "",
    "PRODUCTOS",
    ...order.items.map(
      (item) =>
        `  ${item.quantity} x ${item.name} (${item.sku}) — ${money(item.subtotal)}`,
    ),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Envío:    ${money(order.shipping)}`,
    `TOTAL:    ${money(order.total)}`,
    "",
    "ENVÍO",
    `  ${order.customerName}`,
    `  ${order.shippingLine1}${order.shippingLine2 ? `, ${order.shippingLine2}` : ""}`,
    `  ${order.shippingCity}${order.shippingState ? `, ${order.shippingState}` : ""}`,
    "",
    "Este documento es un comprobante de compra, no es una factura electrónica con validez fiscal.",
  ];

  return lines.join("\n");
}

/** HTML del correo: tablas y estilos en línea, que es lo que entienden los clientes de correo. */
export function buildReceiptHtml({ store, order }: ReceiptData): string {
  const money = (value: unknown) => formatMoney(value, store.currency);

  const rows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0">
            <div style="font-weight:600;color:#0f172a">${escapeHtml(item.name)}</div>
            <div style="font-size:12px;color:#64748b">
              ${escapeHtml(item.sku)} · ${item.quantity} × ${money(item.unitPrice)}
            </div>
          </td>
          <td style="padding:12px 0;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600;color:#0f172a">
            ${money(item.subtotal)}
          </td>
        </tr>`,
    )
    .join("");

  const totalRow = (label: string, value: string, bold = false) => `
    <tr>
      <td style="padding:4px 0;color:${bold ? "#0f172a" : "#64748b"};font-size:${bold ? "16px" : "14px"};font-weight:${bold ? "700" : "400"}">${label}</td>
      <td style="padding:4px 0;text-align:right;color:#0f172a;font-size:${bold ? "16px" : "14px"};font-weight:${bold ? "700" : "600"}">${value}</td>
    </tr>`;

  return `<!doctype html>
<html lang="es">
<body style="margin:0;padding:24px;background:#f8fafc;font-family:system-ui,-apple-system,'Segoe UI',sans-serif">
  <table role="presentation" style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e2e8f0" width="100%">
    <tr>
      <td style="background:${escapeHtml(store.primaryColor)};padding:28px 32px;color:#ffffff">
        <div style="font-size:20px;font-weight:700">${escapeHtml(store.name)}</div>
        <div style="opacity:.85;font-size:13px;margin-top:4px">Comprobante de compra</div>
      </td>
    </tr>

    <tr>
      <td style="padding:32px">
        <p style="margin:0 0 24px;color:#334155;font-size:15px">
          Hola ${escapeHtml(order.customerName.split(" ")[0])}, recibimos tu pedido. Este es el resumen.
        </p>

        <table role="presentation" width="100%" style="font-size:13px;color:#64748b;margin-bottom:24px">
          <tr><td>Pedido</td><td style="text-align:right;color:#0f172a;font-weight:600">${escapeHtml(order.number)}</td></tr>
          <tr><td>Fecha</td><td style="text-align:right;color:#0f172a">${order.createdAt.toLocaleDateString("es-CO")}</td></tr>
          <tr><td>Estado</td><td style="text-align:right;color:#0f172a">${STATUS_LABELS[order.status]}</td></tr>
          <tr><td>Pago</td><td style="text-align:right;color:#0f172a">${PAYMENT_LABELS[order.paymentMethod]}</td></tr>
        </table>

        <table role="presentation" width="100%">${rows}</table>

        <table role="presentation" width="100%" style="margin-top:16px">
          ${totalRow("Subtotal", money(order.subtotal))}
          ${totalRow("Envío", Number(order.shipping) === 0 ? "Gratis" : money(order.shipping))}
          ${totalRow("Total", money(order.total), true)}
        </table>

        <div style="margin-top:28px;padding-top:20px;border-top:1px solid #e2e8f0;font-size:13px;color:#64748b">
          <div style="font-weight:600;color:#0f172a;margin-bottom:6px">Dirección de envío</div>
          ${escapeHtml(order.customerName)}<br>
          ${escapeHtml(order.shippingLine1)}${order.shippingLine2 ? `, ${escapeHtml(order.shippingLine2)}` : ""}<br>
          ${escapeHtml(order.shippingCity)}${order.shippingState ? `, ${escapeHtml(order.shippingState)}` : ""}
        </div>
      </td>
    </tr>

    <tr>
      <td style="padding:20px 32px;background:#f8fafc;border-top:1px solid #e2e8f0;font-size:12px;color:#94a3b8;text-align:center">
        ${[store.email, store.phone, store.address].filter(Boolean).map((v) => escapeHtml(String(v))).join(" · ")}
        <div style="margin-top:8px">
          Comprobante de compra. No es una factura electrónica con validez fiscal.
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
