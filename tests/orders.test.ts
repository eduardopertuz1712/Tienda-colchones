import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { cleanup, makeTenant, prisma } from "./helpers";
import { CatalogError, createProduct } from "../src/lib/catalog";
import { InsufficientStockError } from "../src/lib/inventory";
import {
  canTransition,
  createOrderFromCart,
  getSalesSummary,
  updateOrderStatus,
} from "../src/lib/orders";

after(cleanup);

async function cartWith(
  tenantId: string,
  productId: string,
  quantity: number,
) {
  const cart = await prisma.cart.create({
    data: { tenantId, token: `t-${Math.random().toString(36).slice(2)}` },
  });

  await prisma.cartItem.create({
    data: { cartId: cart.id, productId, quantity },
  });

  return cart;
}

const buyer = {
  customerName: "Ana",
  customerEmail: "ana@test.com",
  shippingLine1: "Calle 1",
  shippingCity: "Barranquilla",
  paymentMethod: "CASH_ON_DELIVERY" as const,
};

describe("checkout", () => {
  test("crea el pedido, descuenta stock y vacía el carrito", async () => {
    const tenant = await makeTenant("ord");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato",
      sku: "O-1",
      price: "50000",
      stock: 10,
    });

    const cart = await cartWith(tenant.id, product.id, 3);

    const order = await createOrderFromCart({
      tenantId: tenant.id,
      cartId: cart.id,
      ...buyer,
    });

    assert.match(order.number, /^ORD-\d{8}-[0-9A-F]{6}$/);
    assert.equal(Number(order.subtotal), 150000);
    assert.equal(order.status, "PENDING");

    const after = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    assert.equal(after.stock, 7);
    assert.equal(
      await prisma.cartItem.count({ where: { cartId: cart.id } }),
      0,
    );
  });

  test("cobra el precio actual, no el que vio el comprador", async () => {
    const tenant = await makeTenant("ord");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato",
      sku: "O-2",
      price: "50000",
      stock: 5,
    });

    const cart = await cartWith(tenant.id, product.id, 1);

    // El vendedor sube el precio mientras el carrito está abierto.
    await prisma.product.update({
      where: { id: product.id },
      data: { price: "60000" },
    });

    const order = await createOrderFromCart({
      tenantId: tenant.id,
      cartId: cart.id,
      ...buyer,
    });

    assert.equal(Number(order.items[0].unitPrice), 60000);
  });

  test("el envío sale de la configuración, no del formulario", async () => {
    const tenant = await makeTenant("ord");

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { shippingCost: "8000", freeShippingThreshold: "100000" },
    });

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato",
      sku: "O-3",
      price: "50000",
      stock: 10,
    });

    const small = await createOrderFromCart({
      tenantId: tenant.id,
      cartId: (await cartWith(tenant.id, product.id, 1)).id,
      ...buyer,
    });

    assert.equal(Number(small.shipping), 8000);
    assert.equal(Number(small.total), 58000);

    // Al superar el umbral, el envío pasa a ser gratis.
    const big = await createOrderFromCart({
      tenantId: tenant.id,
      cartId: (await cartWith(tenant.id, product.id, 2)).id,
      ...buyer,
    });

    assert.equal(Number(big.shipping), 0);
    assert.equal(Number(big.total), 100000);
  });

  test("sin stock no queda ni pedido ni descuento a medias", async () => {
    const tenant = await makeTenant("ord");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato",
      sku: "O-4",
      price: "50000",
      stock: 2,
    });

    const cart = await cartWith(tenant.id, product.id, 99);

    await assert.rejects(
      () =>
        createOrderFromCart({ tenantId: tenant.id, cartId: cart.id, ...buyer }),
      InsufficientStockError,
    );

    const after = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    assert.equal(after.stock, 2, "el stock debe quedar intacto");
    assert.equal(
      await prisma.order.count({ where: { tenantId: tenant.id } }),
      0,
      "no debe quedar ningún pedido",
    );
  });

  /** §50: dos compradores por la última unidad. */
  test("8 checkouts simultáneos sobre stock 6 no sobrevenden", async () => {
    const tenant = await makeTenant("ord-race");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato",
      sku: "O-5",
      price: "10000",
      stock: 6,
    });

    const carts = await Promise.all(
      Array.from({ length: 8 }, () => cartWith(tenant.id, product.id, 1)),
    );

    const results = await Promise.allSettled(
      carts.map((cart) =>
        createOrderFromCart({
          tenantId: tenant.id,
          cartId: cart.id,
          ...buyer,
        }),
      ),
    );

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const final = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    assert.equal(ok, 6);
    assert.equal(final.stock, 0);
  });

  test("el pedido sobrevive al borrado del producto", async () => {
    const tenant = await makeTenant("ord");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato Único",
      sku: "O-6",
      price: "50000",
      stock: 5,
    });

    const cart = await cartWith(tenant.id, product.id, 1);

    const order = await createOrderFromCart({
      tenantId: tenant.id,
      cartId: cart.id,
      ...buyer,
    });

    await prisma.product.delete({ where: { id: product.id } });

    const kept = await prisma.order.findUniqueOrThrow({
      where: { id: order.id },
      include: { items: true },
    });

    assert.equal(kept.items[0].name, "Zapato Único");
    assert.equal(kept.items[0].productId, null);
  });
});

describe("estados del pedido", () => {
  test("solo permite las transiciones documentadas", () => {
    assert.ok(canTransition("PENDING", "CONFIRMED"));
    assert.ok(canTransition("SHIPPED", "DELIVERED"));
    assert.ok(canTransition("DELIVERED", "REFUNDED"));
    assert.ok(!canTransition("DELIVERED", "PENDING"));
    assert.ok(!canTransition("CANCELLED", "CONFIRMED"));
    assert.ok(!canTransition("PENDING", "DELIVERED"));
  });

  test("cancelar devuelve el stock una sola vez", async () => {
    const tenant = await makeTenant("ord");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato",
      sku: "O-7",
      price: "50000",
      stock: 10,
    });

    const cart = await cartWith(tenant.id, product.id, 3);

    const order = await createOrderFromCart({
      tenantId: tenant.id,
      cartId: cart.id,
      ...buyer,
    });

    await updateOrderStatus(tenant.id, order.id, "CANCELLED");

    const restored = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    assert.equal(restored.stock, 10);

    await assert.rejects(
      () => updateOrderStatus(tenant.id, order.id, "CANCELLED"),
      CatalogError,
      "cancelar dos veces no debe inflar el stock",
    );
  });

  test("otra tienda no puede cambiar el estado", async () => {
    const a = await makeTenant("ord-a");
    const b = await makeTenant("ord-b");

    const product = await createProduct({
      tenantId: a.id,
      name: "Zapato",
      sku: "O-8",
      price: "50000",
      stock: 5,
    });

    const order = await createOrderFromCart({
      tenantId: a.id,
      cartId: (await cartWith(a.id, product.id, 1)).id,
      ...buyer,
    });

    await assert.rejects(
      () => updateOrderStatus(b.id, order.id, "CONFIRMED"),
      CatalogError,
    );
  });
});

describe("ventas", () => {
  test("los pedidos cancelados no cuentan como venta", async () => {
    const tenant = await makeTenant("sales");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Zapato",
      sku: "S-1",
      price: "50000",
      stock: 10,
    });

    const order = await createOrderFromCart({
      tenantId: tenant.id,
      cartId: (await cartWith(tenant.id, product.id, 2)).id,
      ...buyer,
    });

    const before = await getSalesSummary(tenant.id);
    assert.equal(before.todayRevenue, 100000);

    await updateOrderStatus(tenant.id, order.id, "CANCELLED");

    const after = await getSalesSummary(tenant.id);
    assert.equal(after.todayRevenue, 0);
  });
});
