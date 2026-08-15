import { prisma } from "@/lib/prisma";
import { sendMail } from "@/lib/mailer";
import { buildReceiptHtml, buildReceiptText } from "@/lib/receipt";

/**
 * Envía el comprobante de compra al correo del comprador.
 *
 * Nunca lanza: si el correo falla, el pedido ya está creado y cobrado —
 * perderlo por un fallo de SMTP sería mucho peor que no avisar.
 */
export async function sendOrderReceipt(orderId: string): Promise<void> {
  try {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        tenant: {
          select: {
            name: true,
            slug: true,
            currency: true,
            email: true,
            phone: true,
            address: true,
            primaryColor: true,
          },
        },
      },
    });

    if (!order) {
      return;
    }

    const data = { store: order.tenant, order };

    await sendMail({
      to: order.customerEmail,
      subject: `${order.tenant.name} — Pedido ${order.number}`,
      html: buildReceiptHtml(data),
      text: buildReceiptText(data),
    });
  } catch (error) {
    console.error("No se pudo enviar el comprobante:", error);
  }
}
