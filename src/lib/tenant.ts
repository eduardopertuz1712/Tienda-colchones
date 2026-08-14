import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { isPlatformScoped } from "@/lib/permissions";
import type { UserRole } from "@/generated/prisma/enums";

export const ACTIVE_TENANT_COOKIE = "active_tenant";

/**
 * Resuelve sobre qué tienda está operando el usuario actual.
 *
 * - Usuario de tienda (OWNER / ADMIN / STAFF): siempre su propio tenant.
 *   El valor de la sesión manda; no hay forma de que apunte a otro.
 * - SUPER_ADMIN: no tiene tenant propio, elige uno explícitamente.
 *   La cookie se valida siempre contra la base de datos, así que
 *   manipularla solo puede producir "tenant inválido", nunca acceso.
 *
 * Devuelve null si no se puede determinar un tenant.
 */
export async function resolveActiveTenantId(user: {
  role: UserRole;
  tenantId: string | null;
}): Promise<string | null> {
  if (!isPlatformScoped(user.role)) {
    return user.tenantId;
  }

  const cookieStore = await cookies();

  const selected = cookieStore.get(ACTIVE_TENANT_COOKIE)?.value;

  if (!selected) {
    return null;
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: selected,
    },
    select: {
      id: true,
    },
  });

  return tenant?.id ?? null;
}
