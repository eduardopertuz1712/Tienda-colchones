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

function normalizeStock(value: number | undefined, label: string): number {
  if (value === undefined) {
    return 0;
  }

  if (!Number.isInteger(value) || value < 0) {
    throw new CatalogError(`${label} debe ser un entero mayor o igual a cero.`);
  }

  return value;
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

/**
 * Identifica qué campo provocó un P2002.
 *
 * Prisma 7 con driver adapters no rellena `meta.target`: el nombre de la
 * restricción llega dentro de `meta.driverAdapterError`. El mensaje del
 * driver está traducido al locale del servidor, así que solo nos apoyamos
 * en el nombre de la constraint, que no se traduce.
 */
function describeUniqueViolation(error: unknown): string | null {
  const prismaError = error as {
    code?: string;
    meta?: {
      target?: unknown;
      driverAdapterError?: {
        cause?: { originalMessage?: string };
      };
    };
  };

  if (prismaError.code !== "P2002") {
    return null;
  }

  const meta = prismaError.meta;

  const candidates: string[] = [];

  if (Array.isArray(meta?.target)) {
    candidates.push(...(meta.target as string[]));
  } else if (typeof meta?.target === "string") {
    candidates.push(meta.target);
  }

  const originalMessage = meta?.driverAdapterError?.cause?.originalMessage;

  if (typeof originalMessage === "string") {
    candidates.push(originalMessage);
  }

  const haystack = candidates.join(" ");

  if (/\bsku\b|_sku_key/i.test(haystack)) {
    return "Ya existe un producto con ese SKU en esta tienda.";
  }

  if (/\bslug\b|_slug_key/i.test(haystack)) {
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

type ListOptions = {
  page?: number;
  pageSize?: number;
  /** Búsqueda por nombre o SKU. */
  query?: string;
};

function buildProductFilter(
  tenantId: string | undefined,
  query: string | undefined,
) {
  const search = query?.trim();

  return {
    ...(tenantId ? { tenantId } : {}),
    ...(search
      ? {
          OR: [
            { name: { contains: search, mode: "insensitive" as const } },
            { sku: { contains: search, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
}

async function listProducts(
  where: ReturnType<typeof buildProductFilter>,
  options: ListOptions,
) {
  const pageSize = options.pageSize ?? PRODUCTS_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

/** Listado de una tienda concreta. */
export async function getProducts(
  tenantId: string,
  options: ListOptions = {},
) {
  return listProducts(
    buildProductFilter(tenantId, options.query),
    options,
  );
}

/**
 * Listado de alcance plataforma: todas las tiendas, opcionalmente
 * filtrado por una. Reservado al SUPER_ADMIN.
 */
export async function getAllProducts(
  options: ListOptions & { tenantId?: string } = {},
) {
  return listProducts(
    buildProductFilter(options.tenantId, options.query),
    options,
  );
}

export async function getTenants() {
  return prisma.tenant.findMany({
    orderBy: {
      name: "asc",
    },
    select: {
      id: true,
      name: true,
      slug: true,
    },
  });
}

export async function assertTenantExists(tenantId: string) {
  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!tenant) {
    throw new CatalogError("La tienda seleccionada no existe.");
  }

  return tenant.id;
}

/**
 * Busca un producto sin filtrar por tenant y devuelve el tenant al que
 * pertenece. Es el puente que permite al SUPER_ADMIN reutilizar las
 * mismas funciones de escritura que un Owner: se resuelve el tenant
 * real del producto y a partir de ahí se aplican las mismas reglas.
 */
export async function findProductTenantId(
  productId: string,
): Promise<string | null> {
  const product = await prisma.product.findUnique({
    where: {
      id: productId,
    },
    select: {
      tenantId: true,
    },
  });

  return product?.tenantId ?? null;
}

export async function getProductForPlatform(productId: string) {
  return prisma.product.findUnique({
    where: {
      id: productId,
    },
    include: {
      category: true,
      tenant: {
        select: {
          id: true,
          name: true,
          slug: true,
        },
      },
      images: {
        orderBy: {
          sortOrder: "asc",
        },
      },
    },
  });
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
  stock?: number;
  minStock?: number;
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

  const stock = normalizeStock(input.stock, "El stock");
  const minStock = normalizeStock(input.minStock, "El stock mínimo");

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
        stock,
        minStock,
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

  // El stock inicial también es un movimiento: así el histórico explica
  // siempre el saldo actual. Se escribe aquí y no vía `adjustStock` para
  // no crear una dependencia circular entre catalog e inventory.
  if (stock > 0) {
    await prisma.inventoryMovement.create({
      data: {
        tenantId,
        productId: product.id,
        type: "PURCHASE",
        quantity: stock,
        stockAfter: stock,
        reason: "Stock inicial",
      },
    });
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
    /** El saldo `stock` se omite a propósito: solo cambia por movimientos. */
    minStock?: number;
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

/** Añade imágenes a un producto existente, respetando el máximo. */
export async function addProductImages(
  tenantId: string,
  productId: string,
  files: File[],
) {
  if (files.length === 0) {
    return;
  }

  const product = await prisma.product.findFirst({
    where: {
      id: productId,
      tenantId,
    },
    select: {
      id: true,
      images: {
        select: {
          id: true,
          sortOrder: true,
        },
        orderBy: {
          sortOrder: "desc",
        },
      },
    },
  });

  if (!product) {
    throw new CatalogError("Producto no encontrado.");
  }

  const existing = product.images.length;

  if (existing + files.length > MAX_PRODUCT_IMAGES) {
    throw new CatalogError(
      `Un producto admite máximo ${MAX_PRODUCT_IMAGES} imágenes (ya tiene ${existing}).`,
    );
  }

  const nextSortOrder = (product.images[0]?.sortOrder ?? -1) + 1;

  const uploadedPaths: string[] = [];

  try {
    for (let index = 0; index < files.length; index++) {
      const uploaded = await uploadProductImage(
        files[index],
        tenantId,
        product.id,
      );

      uploadedPaths.push(uploaded.path);

      await prisma.productImage.create({
        data: {
          productId: product.id,
          url: uploaded.url,
          sortOrder: nextSortOrder + index,
          // Si el producto no tenía ninguna, la primera pasa a ser principal.
          isPrimary: existing === 0 && index === 0,
        },
      });
    }
  } catch (error) {
    await Promise.all(
      uploadedPaths.map((filePath) =>
        deleteProductImage(filePath).catch((cleanupError) => {
          console.error("Fallo limpiando imagen:", filePath, cleanupError);
        }),
      ),
    );

    throw error;
  }
}

/**
 * Borra una imagen concreta. Si era la principal, promociona la
 * siguiente para que el producto nunca quede sin miniatura.
 */
export async function deleteProductImageById(
  tenantId: string,
  imageId: string,
) {
  const image = await prisma.productImage.findFirst({
    where: {
      id: imageId,
      // El filtro por tenant viaja por la relación: no basta con el id.
      product: {
        tenantId,
      },
    },
    select: {
      id: true,
      url: true,
      isPrimary: true,
      productId: true,
    },
  });

  if (!image) {
    throw new CatalogError("Imagen no encontrada.");
  }

  await prisma.productImage.delete({
    where: {
      id: image.id,
    },
  });

  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({
      where: {
        productId: image.productId,
      },
      orderBy: {
        sortOrder: "asc",
      },
      select: {
        id: true,
      },
    });

    if (next) {
      await prisma.productImage.update({
        where: {
          id: next.id,
        },
        data: {
          isPrimary: true,
        },
      });
    }
  }

  await deleteProductImagesByUrl([image.url]);
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
