import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

/**
 * Consultas de la tienda pública. Todo se filtra por tenant Y por
 * `active`: el catálogo público nunca debe mostrar borradores, y una
 * tienda suspendida no debe ser accesible.
 */

export async function getStoreBySlug(slug: string) {
  return prisma.tenant.findFirst({
    where: { slug, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      primaryColor: true,
      currency: true,
      email: true,
      phone: true,
      address: true,
      instagramUrl: true,
      facebookUrl: true,
      whatsapp: true,
      shippingCost: true,
      freeShippingThreshold: true,
    },
  });
}

export async function requireStore(slug: string) {
  const store = await getStoreBySlug(slug);

  if (!store) {
    notFound();
  }

  return store;
}

export async function getStoreCategories(tenantId: string) {
  return prisma.category.findMany({
    where: { tenantId, products: { some: { active: true } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });
}

export async function getStoreProducts(
  tenantId: string,
  options: { categorySlug?: string; query?: string; page?: number } = {},
) {
  const pageSize = 12;
  const page = Math.max(1, options.page ?? 1);
  const search = options.query?.trim();

  const where = {
    tenantId,
    active: true,
    ...(options.categorySlug
      ? { category: { slug: options.categorySlug } }
      : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: { select: { name: true, slug: true } },
        images: { where: { isPrimary: true }, take: 1 },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getStoreProduct(tenantId: string, slug: string) {
  return prisma.product.findFirst({
    where: { tenantId, slug, active: true },
    include: {
      category: { select: { name: true, slug: true } },
      images: { orderBy: { sortOrder: "asc" } },
    },
  });
}
