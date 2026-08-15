import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { cleanup, makeTenant, prisma } from "./helpers";
import { createProduct } from "../src/lib/catalog";
import {
  adjustStock,
  getMovements,
  InsufficientStockError,
} from "../src/lib/inventory";

after(cleanup);

describe("inventario", () => {
  test("el stock inicial deja un movimiento que lo explica", async () => {
    const tenant = await makeTenant("inv");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Camiseta",
      sku: "I-1",
      price: "1000",
      stock: 15,
    });

    const movements = await getMovements(tenant.id, product.id);

    assert.equal(product.stock, 15);
    assert.equal(movements.length, 1);
    assert.equal(movements[0].type, "PURCHASE");
    assert.equal(movements[0].stockAfter, 15);
  });

  test("la suma del histórico cuadra siempre con el saldo", async () => {
    const tenant = await makeTenant("inv");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Camiseta",
      sku: "I-2",
      price: "1000",
      stock: 20,
    });

    await adjustStock({
      tenantId: tenant.id,
      productId: product.id,
      type: "SALE",
      quantity: -3,
    });
    await adjustStock({
      tenantId: tenant.id,
      productId: product.id,
      type: "PURCHASE",
      quantity: 5,
    });

    const movements = await getMovements(tenant.id, product.id);
    const current = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    assert.equal(current.stock, 22);
    assert.equal(
      movements.reduce((sum, m) => sum + m.quantity, 0),
      current.stock,
    );
  });

  test("no deja el stock en negativo", async () => {
    const tenant = await makeTenant("inv");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Camiseta",
      sku: "I-3",
      price: "1000",
      stock: 2,
    });

    await assert.rejects(
      () =>
        adjustStock({
          tenantId: tenant.id,
          productId: product.id,
          type: "SALE",
          quantity: -3,
        }),
      InsufficientStockError,
    );
  });

  test("otra tienda no puede mover este stock", async () => {
    const a = await makeTenant("inv-a");
    const b = await makeTenant("inv-b");

    const product = await createProduct({
      tenantId: a.id,
      name: "Camiseta",
      sku: "I-4",
      price: "1000",
      stock: 10,
    });

    await assert.rejects(
      () =>
        adjustStock({
          tenantId: b.id,
          productId: product.id,
          type: "ADJUSTMENT",
          quantity: -5,
        }),
      (error: Error) => error.message.includes("no encontrado"),
    );
  });

  /** §50: el escenario que no se puede permitir. */
  test("20 salidas simultáneas sobre stock 14 no sobrevenden", async () => {
    const tenant = await makeTenant("race");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Camiseta",
      sku: "I-5",
      price: "1000",
      stock: 14,
    });

    const results = await Promise.allSettled(
      Array.from({ length: 20 }, () =>
        adjustStock({
          tenantId: tenant.id,
          productId: product.id,
          type: "SALE",
          quantity: -1,
        }),
      ),
    );

    const ok = results.filter((r) => r.status === "fulfilled").length;
    const final = await prisma.product.findUniqueOrThrow({
      where: { id: product.id },
    });

    assert.equal(ok, 14, "solo 14 deben poder vender");
    assert.equal(final.stock, 0);
  });
});
