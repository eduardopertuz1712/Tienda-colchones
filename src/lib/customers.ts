import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CatalogError } from "@/lib/catalog";

/**
 * Clientes de una tienda. Un Customer pertenece a un tenant, así que el
 * mismo correo puede existir en varias tiendas como personas distintas.
 */

export const CUSTOMERS_PAGE_SIZE = 20;

export async function getCustomers(
  tenantId: string,
  options: { page?: number; pageSize?: number; query?: string } = {},
) {
  const pageSize = options.pageSize ?? CUSTOMERS_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);
  const search = options.query?.trim();

  const where = {
    tenantId,
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { email: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { orders: true } } },
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getCustomer(tenantId: string, customerId: string) {
  return prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    include: {
      addresses: { orderBy: { isDefault: "desc" } },
      orders: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
}

export async function registerCustomer(input: {
  tenantId: string;
  name: string;
  email: string;
  password: string;
  phone?: string | null;
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

  const existing = await prisma.customer.findUnique({
    where: { tenantId_email: { tenantId: input.tenantId, email } },
    select: { id: true },
  });

  if (existing) {
    throw new CatalogError("Ya existe una cuenta con ese correo en esta tienda.");
  }

  return prisma.customer.create({
    data: {
      tenantId: input.tenantId,
      name,
      email,
      phone: input.phone?.trim() || null,
      passwordHash: await bcrypt.hash(input.password, 12),
    },
  });
}

export async function authenticateCustomer(
  tenantId: string,
  email: string,
  password: string,
) {
  const customer = await prisma.customer.findUnique({
    where: { tenantId_email: { tenantId, email: email.trim().toLowerCase() } },
  });

  if (!customer?.passwordHash) {
    return null;
  }

  const valid = await bcrypt.compare(password, customer.passwordHash);

  return valid ? customer : null;
}

/** Cliente autenticado, siempre re-verificado contra su tenant. */
export async function getCustomerById(tenantId: string, customerId: string) {
  return prisma.customer.findFirst({
    where: { id: customerId, tenantId },
    include: { addresses: { orderBy: { isDefault: "desc" } } },
  });
}
