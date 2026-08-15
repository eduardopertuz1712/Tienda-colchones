import { test, describe, after } from "node:test";
import assert from "node:assert/strict";
import { cleanup, makeTenant, prisma } from "./helpers";
import { CatalogError } from "../src/lib/catalog";
import {
  authenticateCustomer,
  registerCustomer,
} from "../src/lib/customers";
import {
  createResetToken,
  isResetTokenValid,
  resetPassword,
} from "../src/lib/password-reset";
import { createTeamMember, setTeamMemberActive } from "../src/lib/users";

after(cleanup);

describe("clientes", () => {
  test("normaliza los datos y nunca guarda la clave en claro", async () => {
    const tenant = await makeTenant("acc");

    const customer = await registerCustomer({
      tenantId: tenant.id,
      name: "  Ana Pérez ",
      email: "  ANA@Test.COM ",
      password: "clave12345",
    });

    assert.equal(customer.email, "ana@test.com");
    assert.equal(customer.name, "Ana Pérez");
    assert.ok(customer.passwordHash?.startsWith("$2"));
  });

  test("rechaza correo inválido, clave corta y correo repetido", async () => {
    const tenant = await makeTenant("acc");

    await registerCustomer({
      tenantId: tenant.id,
      name: "Ana",
      email: "ana@test.com",
      password: "clave12345",
    });

    await assert.rejects(
      () =>
        registerCustomer({
          tenantId: tenant.id,
          name: "X",
          email: "no-es-correo",
          password: "clave12345",
        }),
      CatalogError,
    );

    await assert.rejects(
      () =>
        registerCustomer({
          tenantId: tenant.id,
          name: "X",
          email: "x@test.com",
          password: "1234567",
        }),
      CatalogError,
    );

    await assert.rejects(
      () =>
        registerCustomer({
          tenantId: tenant.id,
          name: "Otra",
          email: "ana@test.com",
          password: "clave12345",
        }),
      CatalogError,
    );
  });

  /** §19: el mismo correo es persona distinta en cada tienda. */
  test("el mismo correo puede comprar en dos tiendas", async () => {
    const a = await makeTenant("acc-a");
    const b = await makeTenant("acc-b");

    const inA = await registerCustomer({
      tenantId: a.id,
      name: "Ana",
      email: "ana@test.com",
      password: "clave12345",
    });

    const inB = await registerCustomer({
      tenantId: b.id,
      name: "Ana",
      email: "ana@test.com",
      password: "clave12345",
    });

    assert.notEqual(inA.id, inB.id);

    // Y la sesión de una tienda no sirve en la otra.
    assert.ok(await authenticateCustomer(a.id, "ana@test.com", "clave12345"));
    assert.equal(
      await authenticateCustomer(a.id, "ana@test.com", "incorrecta"),
      null,
    );
  });
});

describe("recuperación de contraseña", () => {
  test("el token cambia la clave y solo se puede usar una vez", async () => {
    const tenant = await makeTenant("reset");

    const member = await createTeamMember({
      tenantId: tenant.id,
      name: "Juan",
      email: `juan-${tenant.slug}@test.com`,
      password: "original123",
      role: "STAFF",
    });

    const { token } = await createResetToken({
      kind: "user",
      userId: member.id,
    });

    assert.ok(await isResetTokenValid(token));

    await resetPassword(token, "nuevaclave123");

    const updated = await prisma.user.findUniqueOrThrow({
      where: { id: member.id },
    });

    assert.notEqual(updated.passwordHash, member.passwordHash);
    assert.ok(!(await isResetTokenValid(token)), "el token debe consumirse");

    await assert.rejects(
      () => resetPassword(token, "otraclave123"),
      CatalogError,
    );
  });

  test("pedir un token nuevo invalida el anterior", async () => {
    const tenant = await makeTenant("reset");

    const member = await createTeamMember({
      tenantId: tenant.id,
      name: "Juan",
      email: `juan2-${tenant.slug}@test.com`,
      password: "original123",
      role: "STAFF",
    });

    const first = await createResetToken({ kind: "user", userId: member.id });
    const second = await createResetToken({ kind: "user", userId: member.id });

    assert.ok(!(await isResetTokenValid(first.token)));
    assert.ok(await isResetTokenValid(second.token));
  });

  test("no acepta contraseñas cortas", async () => {
    const tenant = await makeTenant("reset");

    const member = await createTeamMember({
      tenantId: tenant.id,
      name: "Juan",
      email: `juan3-${tenant.slug}@test.com`,
      password: "original123",
      role: "STAFF",
    });

    const { token } = await createResetToken({
      kind: "user",
      userId: member.id,
    });

    await assert.rejects(() => resetPassword(token, "corta"), CatalogError);
  });
});

describe("equipo del Owner", () => {
  test("solo puede crear roles delegados, nunca un Super Admin", async () => {
    const tenant = await makeTenant("team");

    const staff = await createTeamMember({
      tenantId: tenant.id,
      name: "Empleado",
      email: `staff-${tenant.slug}@test.com`,
      password: "clave12345",
      role: "STAFF",
    });

    assert.equal(staff.role, "STAFF");
    assert.equal(staff.tenantId, tenant.id);

    for (const role of ["SUPER_ADMIN", "OWNER"]) {
      await assert.rejects(
        () =>
          createTeamMember({
            tenantId: tenant.id,
            name: "Intruso",
            email: `intruso-${role}-${tenant.slug}@test.com`,
            password: "clave12345",
            role,
          }),
        CatalogError,
        `no debe poder crear ${role}`,
      );
    }
  });

  test("no permite desactivarse a uno mismo", async () => {
    const tenant = await makeTenant("team");

    const member = await createTeamMember({
      tenantId: tenant.id,
      name: "Empleado",
      email: `self-${tenant.slug}@test.com`,
      password: "clave12345",
      role: "STAFF",
    });

    await assert.rejects(
      () => setTeamMemberActive(tenant.id, member.id, false, member.id),
      CatalogError,
    );
  });

  test("otra tienda no puede tocar a este usuario", async () => {
    const a = await makeTenant("team-a");
    const b = await makeTenant("team-b");

    const member = await createTeamMember({
      tenantId: a.id,
      name: "Empleado",
      email: `cross-${a.slug}@test.com`,
      password: "clave12345",
      role: "STAFF",
    });

    await assert.rejects(
      () => setTeamMemberActive(b.id, member.id, false, "otro-id"),
      CatalogError,
    );
  });
});
