import type { UserRole } from "@/generated/prisma/enums";

/**
 * Autorización centralizada: can(actor, action, resource).
 *
 * Esta es la única fuente de verdad de "quién puede hacer qué".
 * El frontend puede ocultar botones, pero toda operación de escritura
 * debe pasar por aquí en el servidor.
 */

export type Action = "view" | "create" | "update" | "delete";

export type Resource =
  | "product"
  | "category"
  | "order"
  | "customer"
  | "sale"
  | "settings"
  | "user"
  | "tenant";

export type Actor = {
  role: UserRole;
  tenantId: string | null;
};

const ALL: Action[] = ["view", "create", "update", "delete"];
const READ: Action[] = ["view"];
const READ_WRITE: Action[] = ["view", "update"];

const MATRIX: Record<UserRole, Partial<Record<Resource, Action[]>>> = {
  // Alcance global: administra la plataforma y puede corregir
  // información de cualquier tienda.
  SUPER_ADMIN: {
    product: ALL,
    category: ALL,
    order: ALL,
    customer: ALL,
    sale: READ,
    settings: READ_WRITE,
    user: ALL,
    tenant: ALL,
  },

  // Dueño de una tienda: opera su negocio. La configuración de la tienda
  // (identidad, contacto, envío) la ajusta el Super Admin, porque muchos
  // propietarios prefieren no tocarla.
  OWNER: {
    product: ALL,
    category: ALL,
    order: ALL,
    customer: ALL,
    sale: READ,
    user: ALL,
  },

  // Administrador delegado: opera la tienda pero no gestiona usuarios.
  ADMIN: {
    product: ALL,
    category: ALL,
    order: ALL,
    customer: ALL,
    sale: READ,
  },

  // Empleado: consulta el catálogo y gestiona pedidos, nada más.
  STAFF: {
    product: READ,
    category: READ,
    order: READ_WRITE,
    customer: READ,
  },
};

export function can(
  actor: Actor,
  action: Action,
  resource: Resource,
): boolean {
  const allowed = MATRIX[actor.role]?.[resource];

  if (!allowed) {
    return false;
  }

  return allowed.includes(action);
}

/**
 * Los recursos de tienda exigen un tenant. El SUPER_ADMIN no tiene
 * tenant propio, así que opera sobre un tenant activo seleccionado
 * explícitamente (ver `lib/tenant.ts`).
 */
export function isPlatformScoped(role: UserRole): boolean {
  return role === "SUPER_ADMIN";
}
