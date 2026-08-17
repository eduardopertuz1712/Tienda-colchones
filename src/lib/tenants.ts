import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CatalogError, slugify } from "@/lib/catalog";
import type { TenantStatus } from "@/generated/prisma/enums";

/**
 * Alta y administración de tiendas. Es la operación que define el SaaS:
 * el Super Admin crea una tienda y su propietario, y a partir de ahí ese
 * propietario opera solo.
 */

export const STATUS_LABELS: Record<TenantStatus, string> = {
  ACTIVE: "Activa",
  SUSPENDED: "Suspendida",
  INACTIVE: "Inactiva",
};

export async function listTenants() {
  return prisma.tenant.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      createdAt: true,
      _count: { select: { products: true, orders: true, users: true } },
      users: {
        where: { role: "OWNER" },
        select: { name: true, email: true },
        take: 1,
      },
    },
  });
}

export async function getTenant(tenantId: string) {
  return prisma.tenant.findUnique({
    where: { id: tenantId },
    include: {
      users: {
        where: { role: "OWNER" },
        select: { id: true, name: true, email: true, active: true },
      },
      _count: { select: { products: true, orders: true, customers: true } },
    },
  });
}

/**
 * Crea la tienda y, opcionalmente, su propietario en una transacción: no
 * queremos una tienda sin responsable si algo falla a mitad.
 */
export async function createTenant(input: {
  name: string;
  slug?: string;
  ownerName?: string;
  ownerEmail?: string;
  ownerPassword?: string;
}) {
  const name = input.name.trim();

  if (!name) {
    throw new CatalogError("El nombre de la tienda es obligatorio.");
  }

  const slug = slugify(input.slug?.trim() || name);

  if (!slug) {
    throw new CatalogError("El identificador de la tienda no es válido.");
  }

  const taken = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (taken) {
    throw new CatalogError(`Ya existe una tienda con el enlace /${slug}.`);
  }

  const wantsOwner = Boolean(
    input.ownerName?.trim() || input.ownerEmail?.trim(),
  );

  let ownerData: {
    name: string;
    email: string;
    passwordHash: string;
  } | null = null;

  if (wantsOwner) {
    const ownerName = input.ownerName?.trim() ?? "";
    const ownerEmail = input.ownerEmail?.trim().toLowerCase() ?? "";
    const password = input.ownerPassword ?? "";

    if (!ownerName || !ownerEmail) {
      throw new CatalogError(
        "Para crear el propietario hacen falta su nombre y su correo.",
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(ownerEmail)) {
      throw new CatalogError("El correo del propietario no es válido.");
    }

    if (password.length < 8) {
      throw new CatalogError(
        "La contraseña del propietario debe tener al menos 8 caracteres.",
      );
    }

    // User.email es único en toda la plataforma, no por tienda.
    const existing = await prisma.user.findUnique({
      where: { email: ownerEmail },
      select: { id: true },
    });

    if (existing) {
      throw new CatalogError("Ya existe un usuario con ese correo.");
    }

    ownerData = {
      name: ownerName,
      email: ownerEmail,
      passwordHash: await bcrypt.hash(password, 12),
    };
  }

  return prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ data: { name, slug } });

    if (ownerData) {
      await tx.user.create({
        data: { ...ownerData, role: "OWNER", tenantId: tenant.id },
      });
    }

    return tenant;
  });
}

export async function updateTenantStatus(
  tenantId: string,
  status: TenantStatus,
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: tenantId },
    select: { id: true },
  });

  if (!tenant) {
    throw new CatalogError("Tienda no encontrada.");
  }

  // Suspender oculta la tienda pública sin borrar nada.
  return prisma.tenant.update({ where: { id: tenantId }, data: { status } });
}

/** Crea o reemplaza al propietario de una tienda. */
export async function assignOwner(
  tenantId: string,
  input: { name: string; email: string; password: string },
) {
  const name = input.name.trim();
  const email = input.email.trim().toLowerCase();

  if (!name || !email) {
    throw new CatalogError("Nombre y correo son obligatorios.");
  }

  if (input.password.length < 8) {
    throw new CatalogError("La contraseña debe tener al menos 8 caracteres.");
  }

  const existing = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existing) {
    throw new CatalogError("Ya existe un usuario con ese correo.");
  }

  return prisma.user.create({
    data: {
      tenantId,
      name,
      email,
      role: "OWNER",
      passwordHash: await bcrypt.hash(input.password, 12),
    },
  });
}
