import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { cleanup, makeTenant, prisma } from "./helpers";
import { createProduct } from "../src/lib/catalog";
import { createOrderFromCart } from "../src/lib/orders";
import { buildReceiptHtml, buildReceiptText } from "../src/lib/receipt";

after(cleanup);

async function makeOrder() {
  const tenant = await makeTenant("rec");

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { email: "hola@tienda.com", phone: "3001234567", shippingCost: "5000" },
  });

  const product = await createProduct({
    tenantId: tenant.id,
    name: 'Camisa "Premium" <Azul>',
    sku: "R-1",
    price: "40000",
    stock: 10,
  });

  const cart = await prisma.cart.create({
    data: { tenantId: tenant.id, token: `r-${Math.random()}` },
  });

  await prisma.cartItem.create({
    data: { cartId: cart.id, productId: product.id, quantity: 2 },
  });

  const created = await createOrderFromCart({
    tenantId: tenant.id,
    cartId: cart.id,
    customerName: "Ana Pérez",
    customerEmail: "ana@test.com",
    shippingLine1: "Calle 1",
    shippingCity: "Barranquilla",
    paymentMethod: "CASH_ON_DELIVERY",
  });

  const order = await prisma.order.findUniqueOrThrow({
    where: { id: created.id },
    include: {
      items: true,
      tenant: {
        select: {
          name: true, slug: true, currency: true, email: true,
          phone: true, address: true, primaryColor: true,
        },
      },
    },
  });

  return { store: order.tenant, order };
}

describe("comprobante de compra", () => {
  test("el texto refleja los importes reales del pedido", async () => {
    const data = await makeOrder();

    const text = buildReceiptText(data);

    assert.match(text, /Comprobante de compra/);
    assert.match(text, new RegExp(data.order.number));
    assert.match(text, /2 x Camisa/);
    assert.ok(text.includes("80.000"), "debe mostrar el subtotal");
    assert.ok(text.includes("85.000"), "debe mostrar el total con envío");
  });

  test("el HTML escapa el contenido del producto", async () => {
    const data = await makeOrder();

    const html = buildReceiptHtml(data);

    // El nombre lleva comillas y < >: no deben romper el marcado.
    assert.ok(!html.includes("<Azul>"), "no debe inyectar etiquetas");
    assert.match(html, /&lt;Azul&gt;/);
    assert.match(html, /&quot;Premium&quot;/);
  });

  test("deja claro que no es una factura fiscal", async () => {
    const data = await makeOrder();

    for (const output of [buildReceiptText(data), buildReceiptHtml(data)]) {
      assert.match(
        output,
        /no\s+(es\s+)?una factura electrónica/i,
        "debe advertir que no tiene validez fiscal",
      );
    }
  });

  test("incluye los datos de contacto de la tienda", async () => {
    const data = await makeOrder();

    const html = buildReceiptHtml(data);

    assert.match(html, /hola@tienda\.com/);
    assert.match(html, /3001234567/);
  });
});
