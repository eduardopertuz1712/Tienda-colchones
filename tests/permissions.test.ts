import { test, describe } from "node:test";
import assert from "node:assert/strict";
import { can, isPlatformScoped } from "../src/lib/permissions";

/** §43: la matriz de permisos, que es la base de todo lo demás. */
describe("matriz de permisos", () => {
  const superAdmin = { role: "SUPER_ADMIN" as const, tenantId: null };
  const owner = { role: "OWNER" as const, tenantId: "t1" };
  const admin = { role: "ADMIN" as const, tenantId: "t1" };
  const staff = { role: "STAFF" as const, tenantId: "t1" };

  test("el Super Admin administra la plataforma", () => {
    assert.ok(can(superAdmin, "create", "product"));
    assert.ok(can(superAdmin, "delete", "product"));
    assert.ok(can(superAdmin, "update", "tenant"));
    assert.ok(can(superAdmin, "update", "settings"));
    assert.ok(isPlatformScoped(superAdmin.role));
  });

  test("el Owner administra su tienda pero no la plataforma", () => {
    assert.ok(can(owner, "create", "product"));
    assert.ok(can(owner, "delete", "product"));
    assert.ok(can(owner, "create", "user"));
    assert.ok(!can(owner, "update", "tenant"));
    // La configuración de la tienda la ajusta el Super Admin.
    assert.ok(!can(owner, "update", "settings"));
    assert.ok(!isPlatformScoped(owner.role));
  });

  test("el Admin opera la tienda sin gestionar usuarios", () => {
    assert.ok(can(admin, "create", "product"));
    assert.ok(!can(admin, "create", "user"));
  });

  test("el Staff solo consulta y gestiona pedidos", () => {
    assert.ok(can(staff, "view", "product"));
    assert.ok(can(staff, "update", "order"));
    assert.ok(!can(staff, "create", "product"));
    assert.ok(!can(staff, "delete", "product"));
    assert.ok(!can(staff, "view", "user"));
    assert.ok(!can(staff, "view", "settings"));
  });

  test("ningún rol de tienda tiene alcance de plataforma", () => {
    for (const role of ["OWNER", "ADMIN", "STAFF"] as const) {
      assert.ok(!isPlatformScoped(role), `${role} no debe ser plataforma`);
    }
  });
});
