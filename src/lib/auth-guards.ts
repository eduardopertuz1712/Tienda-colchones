import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  can,
  isPlatformScoped,
  type Action,
  type Resource,
} from "@/lib/permissions";
import { resolveActiveTenantId } from "@/lib/tenant";
import type { UserRole } from "@/generated/prisma/enums";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(...allowedRoles: UserRole[]) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

/**
 * Guard estándar de los módulos de tienda.
 *
 * Resuelve el tenant activo y comprueba el permiso en una sola llamada,
 * para que sea imposible obtener un tenantId sin haber pasado por la
 * matriz de autorización.
 */
export async function requireTenantPermission(
  action: Action,
  resource: Resource,
) {
  const session = await requireAuth();

  if (!can(session.user, action, resource)) {
    redirect("/dashboard");
  }

  const tenantId = await resolveActiveTenantId(session.user);

  if (!tenantId) {
    // El SUPER_ADMIN todavía no ha elegido tienda sobre la que operar.
    redirect("/dashboard/select-tenant");
  }

  return {
    session,
    user: session.user,
    tenantId,
  };
}

/**
 * Guard de alcance plataforma: opera sobre cualquier tienda, así que
 * exige SUPER_ADMIN además del permiso. No resuelve tenant activo,
 * porque el tenant lo determina cada recurso.
 */
export async function requirePlatformPermission(
  action: Action,
  resource: Resource,
) {
  const session = await requireAuth();

  if (
    !isPlatformScoped(session.user.role) ||
    !can(session.user, action, resource)
  ) {
    redirect("/dashboard");
  }

  return {
    session,
    user: session.user,
  };
}

export async function authorizePlatformAction(
  action: Action,
  resource: Resource,
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("No autenticado.");
  }

  if (
    !isPlatformScoped(session.user.role) ||
    !can(session.user, action, resource)
  ) {
    throw new Error("No tienes permiso para realizar esta operación.");
  }

  return {
    user: session.user,
  };
}

/**
 * Igual que el anterior, pero para server actions: en vez de redirigir
 * lanza, porque una action no debe terminar en una página cualquiera
 * cuando lo que ha ocurrido es un intento de acceso no autorizado.
 */
export async function authorizeTenantAction(
  action: Action,
  resource: Resource,
) {
  const session = await auth();

  if (!session?.user) {
    throw new Error("No autenticado.");
  }

  if (!can(session.user, action, resource)) {
    throw new Error("No tienes permiso para realizar esta operación.");
  }

  const tenantId = await resolveActiveTenantId(session.user);

  if (!tenantId) {
    throw new Error("No hay una tienda activa seleccionada.");
  }

  return {
    user: session.user,
    tenantId,
  };
}
