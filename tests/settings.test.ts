import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { cleanup, makeTenant } from "./helpers";
import { CatalogError } from "../src/lib/catalog";
import { resolveShipping, updateSettings } from "../src/lib/settings";
import { getStoreBySlug, getStoreProducts } from "../src/lib/storefront";
import { createProduct } from "../src/lib/catalog";

after(cleanup);

describe("configuración de tienda", () => {
  test("guarda identidad, contacto y envío", async () => {
    const tenant = await makeTenant("cfg");

    const updated = await updateSettings(tenant.id, {
      name: "Mi Tienda",
      primaryColor: "#FF5733",
      currency: "usd",
      email: "  HOLA@Tienda.com ",
      shippingCost: "8000",
      freeShippingThreshold: "100000",
      instagramUrl: "https://instagram.com/mitienda",
    });

    assert.equal(updated.primaryColor, "#FF5733");
    assert.equal(updated.currency, "USD");
    assert.equal(updated.email, "hola@tienda.com");
    assert.equal(Number(updated.shippingCost), 8000);
  });

  test("valida color, moneda, correo y enlaces", async () => {
    const tenant = await makeTenant("cfg");

    const invalid = [
      { name: "T", primaryColor: "rojo" },
      { name: "T", currency: "PESOS" },
      { name: "T", email: "no-es-correo" },
      { name: "T", instagramUrl: "javascript:alert(1)" },
      { name: "T", shippingCost: "-5" },
      { name: "" },
    ];

    for (const input of invalid) {
      await assert.rejects(
        () => updateSettings(tenant.id, input as never),
        CatalogError,
        `debería rechazar ${JSON.stringify(input)}`,
      );
    }
  });
});

describe("reglas de envío", () => {
  const settings = { shippingCost: 8000, freeShippingThreshold: 100000 };

  test("cobra envío por debajo del umbral", () => {
    assert.equal(resolveShipping(settings, 50000), 8000);
  });

  test("es gratis justo en el umbral y por encima", () => {
    assert.equal(resolveShipping(settings, 100000), 0);
    assert.equal(resolveShipping(settings, 150000), 0);
  });

  test("sin umbral siempre cobra", () => {
    assert.equal(
      resolveShipping({ shippingCost: 5000, freeShippingThreshold: null }, 999999),
      5000,
    );
  });
});

describe("tienda pública", () => {
  test("no muestra productos despublicados ni tiendas suspendidas", async () => {
    const tenant = await makeTenant("store");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Visible",
      sku: "V-1",
      price: "1000",
    });

    const listed = await getStoreProducts(tenant.id, {});
    assert.ok(listed.items.some((item) => item.id === product.id));

    const { prisma } = await import("./helpers");

    await prisma.product.update({
      where: { id: product.id },
      data: { active: false },
    });

    const hidden = await getStoreProducts(tenant.id, {});
    assert.ok(!hidden.items.some((item) => item.id === product.id));

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { status: "SUSPENDED" },
    });

    assert.equal(await getStoreBySlug(tenant.slug), null);
  });
});
