import { prisma } from "@/lib/prisma";
import { CatalogError } from "@/lib/catalog";
import type { InventoryMovementType } from "@/generated/prisma/enums";

export class InsufficientStockError extends CatalogError {}

/**
 * Aplica un movimiento de inventario y deja rastro de por qué cambió.
 *
 * El descuento se hace con un UPDATE condicional dentro de una
 * transacción, no con leer-calcular-escribir: si dos compradores compran
 * la última unidad a la vez, uno de los dos falla en la base de datos en
 * vez de dejar el stock en negativo (§50).
 */
export async function adjustStock(input: {
  tenantId: string;
  productId: string;
  type: InventoryMovementType;
  /** Positivo en entradas, negativo en salidas. */
  quantity: number;
  reason?: string | null;
}) {
  const { tenantId, productId, type, quantity } = input;

  if (!Number.isInteger(quantity) || quantity === 0) {
    throw new CatalogError("La cantidad debe ser un entero distinto de cero.");
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.product.updateMany({
      where: {
        id: productId,
        tenantId,
        // En salidas, solo actualiza si queda stock suficiente. La
        // condición viaja en el WHERE, así que la comprueba Postgres.
        ...(quantity < 0 ? { stock: { gte: -quantity } } : {}),
      },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });

    if (updated.count === 0) {
      const exists = await tx.product.findFirst({
        where: { id: productId, tenantId },
        select: { stock: true },
      });

      if (!exists) {
        throw new CatalogError("Producto no encontrado.");
      }

      throw new InsufficientStockError(
        `Stock insuficiente: quedan ${exists.stock} unidades.`,
      );
    }

    const product = await tx.product.findUniqueOrThrow({
      where: { id: productId },
      select: { stock: true },
    });

    await tx.inventoryMovement.create({
      data: {
        tenantId,
        productId,
        type,
        quantity,
        stockAfter: product.stock,
        reason: input.reason ?? null,
      },
    });

    return product.stock;
  });
}

/** Histórico de movimientos de un producto, del más reciente al más antiguo. */
export async function getMovements(
  tenantId: string,
  productId: string,
  limit = 50,
) {
  return prisma.inventoryMovement.findMany({
    where: {
      tenantId,
      productId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
  });
}

/** Productos por debajo de su stock mínimo (§21: "productos con poco stock"). */
export async function getLowStockProducts(tenantId: string, limit = 10) {
  return prisma.$queryRaw<
    Array<{ id: string; name: string; sku: string; stock: number; minStock: number }>
  >`
    SELECT id, name, sku, stock, "minStock"
    FROM "Product"
    WHERE "tenantId" = ${tenantId}
      AND active = true
      AND stock <= "minStock"
    ORDER BY stock ASC
    LIMIT ${limit}
  `;
}
