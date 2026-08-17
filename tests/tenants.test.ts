import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import crypto from "crypto";
import { cleanup, makeTenant, prisma } from "./helpers";
import { CatalogError } from "../src/lib/catalog";
import { assignOwner, createTenant, updateTenantStatus } from "../src/lib/tenants";
import { createTeamMember, updateTeamMemberRole } from "../src/lib/users";

after(cleanup);

/** Cada tienda creada aquí nace fuera de `makeTenant`, hay que borrarla. */
const extra: string[] = [];

after(async () => {
  if (extra.length > 0) {
    await prisma.tenant.deleteMany({ where: { id: { in: extra } } });
  }
});

function unique(prefix: string) {
  return `${prefix}-${crypto.randomBytes(4).toString("hex")}`;
}

describe("alta de tiendas", () => {
  test("crea la tienda con su propietario en un solo paso", async () => {
    const name = unique("Moda");

    const tenant = await createTenant({
      name,
      ownerName: "Laura Ruiz",
      ownerEmail: `${unique("laura")}@test.com`,
      ownerPassword: "clave12345",
    });

    extra.push(tenant.id);

    assert.equal(tenant.slug, name.toLowerCase());
    assert.equal(tenant.status, "ACTIVE");

    const owner = await prisma.user.findFirst({
      where: { tenantId: tenant.id, role: "OWNER" },
    });

    assert.ok(owner);
    assert.equal(owner.name, "Laura Ruiz");
    assert.ok(owner.passwordHash?.startsWith("$2"));
  });

  test("sin datos de propietario la tienda queda sin usuarios", async () => {
    const tenant = await createTenant({ name: unique("Sola") });

    extra.push(tenant.id);

    assert.equal(await prisma.user.count({ where: { tenantId: tenant.id } }), 0);
  });

  test("rechaza slug repetido, nombre vacío y propietario incompleto", async () => {
    const existing = await makeTenant("dup");

    await assert.rejects(
      () => createTenant({ name: "Otra", slug: existing.slug }),
      CatalogError,
    );

    await assert.rejects(() => createTenant({ name: "   " }), CatalogError);

    await assert.rejects(
      () =>
        createTenant({
          name: unique("Corta"),
          ownerName: "Ana",
          ownerEmail: `${unique("ana")}@test.com`,
          ownerPassword: "corta",
        }),
      CatalogError,
    );
  });

  test("no deja crear la tienda si el propietario falla", async () => {
    const slug = unique("atomica");

    await assert.rejects(
      () =>
        createTenant({
          name: slug,
          ownerName: "Ana",
          ownerEmail: "no-es-un-correo",
          ownerPassword: "clave12345",
        }),
      CatalogError,
    );

    assert.equal(await prisma.tenant.findUnique({ where: { slug } }), null);
  });

  test("suspender conserva los datos de la tienda", async () => {
    const tenant = await makeTenant("susp");

    await updateTenantStatus(tenant.id, "SUSPENDED");

    const after = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenant.id },
    });

    assert.equal(after.status, "SUSPENDED");
    assert.equal(after.name, tenant.name);
  });

  test("no admite dos propietarios con el mismo correo", async () => {
    const tenant = await makeTenant("owner");
    const email = `${unique("owner")}@test.com`;

    await assignOwner(tenant.id, {
      name: "Ana",
      email,
      password: "clave12345",
    });

    const otra = await makeTenant("owner");

    await assert.rejects(
      () => assignOwner(otra.id, { name: "Ana", email, password: "clave12345" }),
      CatalogError,
    );
  });
});

describe("equipo de la tienda", () => {
  test("el Owner solo puede crear empleados, nunca administradores", async () => {
    const tenant = await makeTenant("team");

    await assert.rejects(
      () =>
        createTeamMember({
          tenantId: tenant.id,
          name: "Carlos",
          email: `${unique("carlos")}@test.com`,
          password: "clave12345",
          role: "ADMIN",
        }),
      CatalogError,
    );

    const staff = await createTeamMember({
      tenantId: tenant.id,
      name: "Carlos",
      email: `${unique("carlos")}@test.com`,
      password: "clave12345",
      role: "STAFF",
    });

    assert.equal(staff.role, "STAFF");

    // Tampoco por la puerta de atrás del cambio de rol.
    await assert.rejects(
      () => updateTeamMemberRole(tenant.id, staff.id, "ADMIN"),
      CatalogError,
    );
  });
});
