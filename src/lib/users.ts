import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CatalogError } from "@/lib/catalog";
import type { UserRole } from "@/generated/prisma/enums";

/**
 * Usuarios del panel de una tienda (§10).
 *
 * El Owner administra su equipo, pero nunca puede crear un SUPER_ADMIN
 * ni tocar usuarios de otra tienda: ambas cosas se comprueban aquí, no
 * solo en la interfaz.
 */

/**
 * Roles que un Owner puede asignar dentro de su propia tienda.
 *
 * Solo Empleado: dejar que un Owner cree otros administradores hace que
 * el control de la tienda se disperse y nadie sepa quién puede qué.
 * Si hace falta un ADMIN, lo asigna el Super Admin.
 */
export const ASSIGNABLE_ROLES: UserRole[] = ["STAFF"];

export const ROLE_LABELS: Record<UserRole, string> = {
  SUPER_ADMIN: "Super Admin",
  OWNER: "Propietario",
  ADMIN: "Administrador",
  STAFF: "Empleado",
};

export async function getTeam(tenantId: string) {
  return prisma.user.findMany({
    where: { tenantId },
    orderBy: [{ active: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

export async function getTeamMember(tenantId: string, userId: string) {
  return prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });
}

function assertAssignable(role: string): UserRole {
  if (!ASSIGNABLE_ROLES.includes(role as UserRole)) {
    throw new CatalogError("Solo puedes asignar el rol Empleado.");
  }

  return role as UserRole;
}

export async function createTeamMember(input: {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  role: string;
}) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    throw new CatalogError("Nombre y correo son obligatorios.");
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CatalogError("El correo electrónico no es válido.");
  }

  if (input.password.length < 8) {
    throw new CatalogError("La contraseña debe tener al menos 8 caracteres.");
  }

  const role = assertAssignable(input.role);

  // User.email es único global en toda la plataforma.
  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new CatalogError("Ya existe un usuario con ese correo.");
  }

  return prisma.user.create({
    data: {
      tenantId: input.tenantId,
      name,
      email,
      role,
      passwordHash: await bcrypt.hash(input.password, 12),
    },
  });
}

async function loadMember(tenantId: string, userId: string) {
  const member = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, role: true, active: true },
  });

  if (!member) {
    throw new CatalogError("Usuario no encontrado.");
  }

  // El Owner es el dueño de la tienda: no se degrada ni se desactiva
  // desde aquí, o una tienda podría quedarse sin responsable.
  if (member.role === "OWNER" || member.role === "SUPER_ADMIN") {
    throw new CatalogError(
      "No puedes modificar al propietario de la tienda desde aquí.",
    );
  }

  return member;
}

export async function updateTeamMemberRole(
  tenantId: string,
  userId: string,
  role: string,
) {
  const member = await loadMember(tenantId, userId);

  return prisma.user.update({
    where: { id: member.id },
    data: { role: assertAssignable(role) },
  });
}

export async function setTeamMemberActive(
  tenantId: string,
  userId: string,
  active: boolean,
  actingUserId: string,
) {
  if (userId === actingUserId) {
    throw new CatalogError("No puedes desactivar tu propia cuenta.");
  }

  const member = await loadMember(tenantId, userId);

  return prisma.user.update({
    where: { id: member.id },
    data: { active },
  });
}
