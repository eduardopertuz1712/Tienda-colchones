import { prisma } from "@/lib/prisma";
import {
  deleteProductImage,
  deleteProductImagesByUrl,
  uploadProductImage,
} from "@/lib/storage/local";

export const MAX_PRODUCT_IMAGES = 5;
export const PRODUCTS_PAGE_SIZE = 20;

/** Precio como string decimal: nunca pasar dinero por `number`. */
const PRICE_PATTERN = /^\d{1,10}(\.\d{1,2})?$/;

export class CatalogError extends Error {}

export function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normalizePrice(value: string, label: string): string {
  const clean = value.trim().replace(",", ".");

  if (!PRICE_PATTERN.test(clean)) {
    throw new CatalogError(`${label} no es válido.`);
  }

  return clean;
}

/**
 * Toda FK que venga del cliente debe re-verificarse contra el tenant de
 * la sesión: la FK de Postgres solo garantiza que la categoría exista,
 * no que sea de esta tienda.
 */
async function assertCategoryBelongsToTenant(
  tenantId: string,
  categoryId: string,
) {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!category) {
    throw new CatalogError("La categoría seleccionada no es válida.");
  }
}

function describeUniqueViolation(error: unknown): string | null {
  const target = (error as { code?: string; meta?: { target?: unknown } });

  if (target.code !== "P2002") {
    return null;
  }

  const fields = Array.isArray(target.meta?.target)
    ? (target.meta.target as string[])
    : [];

  if (fields.includes("sku")) {
    return "Ya existe un producto con ese SKU en esta tienda.";
  }

  if (fields.includes("slug")) {
    return "Ya existe un producto con ese slug en esta tienda.";
  }

  return "Ya existe un producto con esos datos en esta tienda.";
}

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

export async function getProducts(
  tenantId: string,
  options: { page?: number; pageSize?: number } = {},
) {
  const pageSize = options.pageSize ?? PRODUCTS_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where: {
        tenantId,
      },
      include: {
        category: true,
        images: {
          // Solo se necesita la miniatura en el listado.
          where: {
            isPrimary: true,
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.product.count({
      where: {
        tenantId,
      },
    }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getProduct(tenantId: string, productId: string) {
  return prisma.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
    include: {
      category: true,
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
}

export async function createProduct(input: {
  tenantId: string;
  categoryId?: string | null;
  name: string;
  slug?: string;
  description?: string | null;
  sku: string;
  price: string;
  compareAtPrice?: string | null;
  images?: File[];
}) {
  const { tenantId } = input;

  const name = input.name.trim();
  const sku = input.sku.trim();
  const slug = slugify(input.slug?.trim() || name);

  if (!name || !sku) {
    throw new CatalogError("Nombre y SKU son obligatorios.");
  }

  if (!slug) {
    throw new CatalogError("El slug no es válido.");
  }

  const price = normalizePrice(input.price, "El precio");

  const compareAtPrice = input.compareAtPrice?.trim()
    ? normalizePrice(input.compareAtPrice, "El precio anterior")
    : null;

  const images = input.images ?? [];

  if (images.length > MAX_PRODUCT_IMAGES) {
    throw new CatalogError(
      `Puedes subir máximo ${MAX_PRODUCT_IMAGES} imágenes.`,
    );
  }

  if (input.categoryId) {
    await assertCategoryBelongsToTenant(tenantId, input.categoryId);
  }

  let product;

  try {
    product = await prisma.product.create({
      data: {
        tenantId,
        categoryId: input.categoryId || null,
        name,
        slug,
        description: input.description?.trim() || null,
        sku,
        price,
        compareAtPrice,
      },
    });
  } catch (error) {
    const message = describeUniqueViolation(error);

    if (message) {
      throw new CatalogError(message);
    }

    throw error;
  }

  const uploadedPaths: string[] = [];

  try {
    for (let index = 0; index < images.length; index++) {
      const uploaded = await uploadProductImage(
        images[index],
        tenantId,
        product.id,
      );

      uploadedPaths.push(uploaded.path);

      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: uploaded.url,
          sortOrder: index,
          isPrimary: index === 0,
        },
      });
    }
  } catch (error) {
    // Rollback completo: sin esto quedaban archivos huérfanos en disco
    // cuando fallaba una imagen intermedia.
    await Promise.all(
      uploadedPaths.map((filePath) =>
        deleteProductImage(filePath).catch((cleanupError) => {
          console.error("Fallo limpiando imagen:", filePath, cleanupError);
        }),
      ),
    );

    await prisma.product.delete({
      where: {
        id: product.id,
      },
    });

    throw error;
  }

  return product;
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
    select: {
      id: true,
    },
  });

  if (!product) {
    throw new CatalogError("Producto no encontrado.");
  }

  if (data.categoryId) {
    await assertCategoryBelongsToTenant(tenantId, data.categoryId);
  }

  try {
    return await prisma.product.update({
      where: {
        id: product.id,
      },
      data: {
        ...data,
        slug: data.slug ? slugify(data.slug) : undefined,
        price: data.price
          ? normalizePrice(data.price, "El precio")
          : undefined,
        compareAtPrice: data.compareAtPrice
          ? normalizePrice(data.compareAtPrice, "El precio anterior")
          : data.compareAtPrice,
      },
    });
  } catch (error) {
    const message = describeUniqueViolation(error);

    if (message) {
      throw new CatalogError(message);
    }

    throw error;
  }
}

export async function deleteProduct(tenantId: string, productId: string) {
  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
    select: {
      id: true,
      images: {
        select: {
          url: true,
        },
      },
    },
  });

  if (!product) {
    throw new CatalogError("Producto no encontrado.");
  }

  // Las filas de ProductImage caen en cascada, los archivos no.
  const urls = product.images.map((image) => image.url);

  const deleted = await prisma.product.delete({
    where: {
      id: product.id,
    },
  });

  await deleteProductImagesByUrl(urls);

  return deleted;
}
