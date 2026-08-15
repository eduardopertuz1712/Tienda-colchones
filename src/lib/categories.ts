import { prisma } from "@/lib/prisma";
import { CatalogError, slugify } from "@/lib/catalog";

/**
 * CRUD de categorías, siempre acotado a un tenant. Igual que en
 * productos, cualquier id que venga del cliente (aquí el padre) se
 * revalida contra el tenant antes de escribir.
 */

export async function getCategoryTree(tenantId: string) {
  const categories = await prisma.category.findMany({
    where: { tenantId },
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { products: true },
      },
    },
  });

  const byParent = new Map<string | null, typeof categories>();

  for (const category of categories) {
    const key = category.parentId;
    const bucket = byParent.get(key) ?? [];
    bucket.push(category);
    byParent.set(key, bucket);
  }

  return {
    all: categories,
    roots: byParent.get(null) ?? [],
    childrenOf: (id: string) => byParent.get(id) ?? [],
  };
}

export async function getCategory(tenantId: string, categoryId: string) {
  return prisma.category.findFirst({
    where: { id: categoryId, tenantId },
    include: {
      parent: { select: { id: true, name: true } },
      _count: { select: { products: true, children: true } },
    },
  });
}

async function assertParentIsValid(
  tenantId: string,
  parentId: string,
  categoryId?: string,
) {
  if (categoryId && parentId === categoryId) {
    throw new CatalogError("Una categoría no puede ser su propia padre.");
  }

  const parent = await prisma.category.findFirst({
    where: { id: parentId, tenantId },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new CatalogError("La categoría padre no es válida.");
  }

  // Evita ciclos: subir por la cadena de padres y comprobar que no
  // volvemos a la categoría que estamos editando.
  if (categoryId) {
    let cursor = parent.parentId;
    let guard = 0;

    while (cursor && guard < 50) {
      if (cursor === categoryId) {
        throw new CatalogError(
          "No puedes mover una categoría dentro de una de sus hijas.",
        );
      }

      const next: { parentId: string | null } | null =
        await prisma.category.findUnique({
          where: { id: cursor },
          select: { parentId: true },
        });

      cursor = next?.parentId ?? null;
      guard++;
    }
  }
}

function describeCategoryConflict(error: unknown): string | null {
  const prismaError = error as {
    code?: string;
    meta?: { driverAdapterError?: { cause?: { originalMessage?: string } } };
  };

  if (prismaError.code !== "P2002") {
    return null;
  }

  return "Ya existe una categoría con ese slug en esta tienda.";
}

export async function createCategory(input: {
  tenantId: string;
  name: string;
  slug?: string;
  description?: string | null;
  parentId?: string | null;
}) {
  const name = input.name.trim();

  if (!name) {
    throw new CatalogError("El nombre es obligatorio.");
  }

  const slug = slugify(input.slug?.trim() || name);

  if (!slug) {
    throw new CatalogError("El slug no es válido.");
  }

  if (input.parentId) {
    await assertParentIsValid(input.tenantId, input.parentId);
  }

  try {
    return await prisma.category.create({
      data: {
        tenantId: input.tenantId,
        name,
        slug,
        description: input.description?.trim() || null,
        parentId: input.parentId || null,
      },
    });
  } catch (error) {
    const message = describeCategoryConflict(error);

    if (message) {
      throw new CatalogError(message);
    }

    throw error;
  }
}

export async function updateCategory(
  tenantId: string,
  categoryId: string,
  input: {
    name: string;
    slug?: string;
    description?: string | null;
    parentId?: string | null;
  },
) {
  const existing = await prisma.category.findFirst({
    where: { id: categoryId, tenantId },
    select: { id: true },
  });

  if (!existing) {
    throw new CatalogError("Categoría no encontrada.");
  }

  const name = input.name.trim();

  if (!name) {
    throw new CatalogError("El nombre es obligatorio.");
  }

  if (input.parentId) {
    await assertParentIsValid(tenantId, input.parentId, categoryId);
  }

  try {
    return await prisma.category.update({
      where: { id: categoryId },
      data: {
        name,
        slug: slugify(input.slug?.trim() || name),
        description: input.description?.trim() || null,
        parentId: input.parentId || null,
      },
    });
  } catch (error) {
    const message = describeCategoryConflict(error);

    if (message) {
      throw new CatalogError(message);
    }

    throw error;
  }
}

export async function deleteCategory(tenantId: string, categoryId: string) {
  const category = await prisma.category.findFirst({
    where: { id: categoryId, tenantId },
    select: {
      id: true,
      _count: { select: { products: true } },
    },
  });

  if (!category) {
    throw new CatalogError("Categoría no encontrada.");
  }

  if (category._count.products > 0) {
    throw new CatalogError(
      `No puedes eliminarla: tiene ${category._count.products} producto(s). Muévelos primero.`,
    );
  }

  // Las hijas suben a raíz por el onDelete: SetNull del schema.
  return prisma.category.delete({ where: { id: category.id } });
}
