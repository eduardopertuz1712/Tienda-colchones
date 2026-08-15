"use server";

import { revalidatePath } from "next/cache";
import { authorizeTenantAction } from "@/lib/auth-guards";
import { CatalogError } from "@/lib/catalog";
import { adjustStock } from "@/lib/inventory";
import type { InventoryMovementType } from "@/generated/prisma/enums";

export type StockFormState = { error: string | null; ok: string | null };

const TYPES: InventoryMovementType[] = [
  "PURCHASE",
  "SALE",
  "ADJUSTMENT",
  "RETURN",
];

export async function adjustStockAction(
  _prev: StockFormState,
  formData: FormData,
): Promise<StockFormState> {
  const { tenantId } = await authorizeTenantAction("update", "inventory");

  const productId = formData.get("productId");
  const rawType = formData.get("type");
  const rawQuantity = formData.get("quantity");
  const reason = formData.get("reason");

  if (typeof productId !== "string" || !productId) {
    return { error: "Producto inválido.", ok: null };
  }

  if (
    typeof rawType !== "string" ||
    !TYPES.includes(rawType as InventoryMovementType)
  ) {
    return { error: "Tipo de movimiento inválido.", ok: null };
  }

  const quantity = Number(rawQuantity);

  if (!Number.isInteger(quantity) || quantity === 0) {
    return {
      error: "La cantidad debe ser un entero distinto de cero.",
      ok: null,
    };
  }

  try {
    const stock = await adjustStock({
      tenantId,
      productId,
      type: rawType as InventoryMovementType,
      quantity,
      reason: typeof reason === "string" ? reason.trim() || null : null,
    });

    revalidatePath("/dashboard/inventory");
    revalidatePath(`/dashboard/inventory/${productId}`);

    return { error: null, ok: `Stock actualizado: ${stock} unidades.` };
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message, ok: null };
    }

    console.error("Error ajustando stock:", error);

    return { error: "No se pudo ajustar el stock.", ok: null };
  }
}
