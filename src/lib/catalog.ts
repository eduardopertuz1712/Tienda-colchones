import { prisma } from "@/lib/prisma";

export async function getCategories(tenantId: string) {
  return prisma.category.findMany({
    where: {
      tenantId,
    },
    orderBy: {
      name: "asc",
    },
  });
}

export async function getProducts(tenantId: string) {
  return prisma.product.findMany({
    where: {
      tenantId,
    },
    include: {
      category: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

export async function getProduct(
  tenantId: string,
  productId: string,
) {
  return prisma.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
    include: {
      category: true,
    },
  });
}

export async function createProduct(data: {
  tenantId: string;
  categoryId?: string;
  name: string;
  slug: string;
  description?: string;
  sku: string;
  price: string;
  compareAtPrice?: string;
}) {
  return prisma.product.create({
    data: {
      tenantId: data.tenantId,
      categoryId: data.categoryId,
      name: data.name,
      slug: data.slug,
      description: data.description,
      sku: data.sku,
      price: data.price,
      compareAtPrice: data.compareAtPrice,
    },
  });
}

export async function updateProduct(
  tenantId: string,
  productId: string,
  data: {
    categoryId?: string | null;
    name?: string;
    slug?: string;
    description?: string | null;
    sku?: string;
    price?: string;
    compareAtPrice?: string | null;
    active?: boolean;
  },
) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
  });

  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  return prisma.product.update({
    where: {
      id: product.id,
    },
    data,
  });
}

export async function deleteProduct(
  tenantId: string,
  productId: string,
) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
  });

  if (!product) {
    throw new Error("Producto no encontrado.");
  }

  return prisma.product.delete({
    where: {
      id: product.id,
    },
  });
}