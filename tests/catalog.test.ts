import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { cleanup, makeTenant, prisma } from "./helpers";
import { CatalogError, createProduct, slugify } from "../src/lib/catalog";
import { createCategory, updateCategory, deleteCategory } from "../src/lib/categories";

after(cleanup);

describe("slugify", () => {
  test("normaliza acentos, eñes y símbolos", () => {
    assert.equal(slugify("Camiseta Básica ¡Nueva!"), "camiseta-basica-nueva");
    assert.equal(slugify("Muñeca de Año Nuevo"), "muneca-de-ano-nuevo");
    assert.equal(slugify("  Zapatos   Deportivos  "), "zapatos-deportivos");
  });
});

describe("productos", () => {
  test("el precio llega exacto a Decimal, sin pasar por float", async () => {
    const tenant = await makeTenant("cat");

    const product = await createProduct({
      tenantId: tenant.id,
      name: "Producto",
      sku: "P-1",
      price: "19.99",
    });

    assert.equal(Number(product.price), 19.99);
  });

  test("rechaza precios inválidos", async () => {
    const tenant = await makeTenant("cat");

    for (const price of ["-5", "abc", "1.999"]) {
      await assert.rejects(
        () =>
          createProduct({
            tenantId: tenant.id,
            name: "X",
            sku: `X-${price}`,
            price,
          }),
        CatalogError,
        `debería rechazar el precio ${price}`,
      );
    }
  });

  test("distingue SKU duplicado de slug duplicado", async () => {
    const tenant = await makeTenant("cat");

    await createProduct({
      tenantId: tenant.id,
      name: "Uno",
      sku: "DUP",
      price: "10",
    });

    await assert.rejects(
      () =>
        createProduct({
          tenantId: tenant.id,
          name: "Dos",
          sku: "DUP",
          price: "10",
        }),
      (error: Error) => error.message.includes("SKU"),
    );

    await assert.rejects(
      () =>
        createProduct({
          tenantId: tenant.id,
          name: "Uno",
          sku: "OTRO",
          price: "10",
        }),
      (error: Error) => error.message.includes("slug"),
    );
  });

  /** §13: el corazón del multi-tenant. */
  test("no acepta una categoría de otra tienda", async () => {
    const a = await makeTenant("iso-a");
    const b = await makeTenant("iso-b");

    const categoryB = await createCategory({
      tenantId: b.id,
      name: "Secreta de B",
    });

    await assert.rejects(
      () =>
        createProduct({
          tenantId: a.id,
          name: "Fuga",
          sku: "FUGA",
          price: "1000",
          categoryId: categoryB.id,
        }),
      CatalogError,
    );

    assert.equal(
      await prisma.product.count({ where: { tenantId: a.id } }),
      0,
      "no debe quedar ningún producto creado",
    );
  });
});

describe("categorías", () => {
  test("permite jerarquía y bloquea ciclos", async () => {
    const tenant = await makeTenant("cats");

    const padre = await createCategory({ tenantId: tenant.id, name: "Ropa" });
    const hija = await createCategory({
      tenantId: tenant.id,
      name: "Camisas",
      parentId: padre.id,
    });

    assert.equal(hija.parentId, padre.id);

    await assert.rejects(
      () =>
        updateCategory(tenant.id, padre.id, {
          name: "Ropa",
          parentId: hija.id,
        }),
      CatalogError,
      "no debe permitir meter una padre dentro de su hija",
    );
  });

  test("no se elimina una categoría con productos", async () => {
    const tenant = await makeTenant("cats");

    const category = await createCategory({
      tenantId: tenant.id,
      name: "Con productos",
    });

    await createProduct({
      tenantId: tenant.id,
      name: "Producto",
      sku: "C-1",
      price: "10",
      categoryId: category.id,
    });

    await assert.rejects(
      () => deleteCategory(tenant.id, category.id),
      CatalogError,
    );
  });
});
