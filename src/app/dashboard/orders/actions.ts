"use server";

import { revalidatePath } from "next/cache";
import { authorizeTenantAction } from "@/lib/auth-guards";
import { CatalogError } from "@/lib/catalog";
import { updateOrderStatus } from "@/lib/orders";
import type { OrderStatus } from "@/generated/prisma/enums";

const STATUSES: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

export type OrderActionState = { error: string | null };

export async function changeOrderStatusAction(
  _prev: OrderActionState,
  formData: FormData,
): Promise<OrderActionState> {
  const { tenantId } = await authorizeTenantAction("update", "order");

  const orderId = formData.get("orderId");
  const status = formData.get("status");

  if (typeof orderId !== "string" || !orderId) {
    return { error: "Pedido inválido." };
  }

  if (typeof status !== "string" || !STATUSES.includes(status as OrderStatus)) {
    return { error: "Estado inválido." };
  }

  try {
    await updateOrderStatus(tenantId, orderId, status as OrderStatus);
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error cambiando estado de pedido:", error);

    return { error: "No se pudo cambiar el estado." };
  }

  revalidatePath("/dashboard/orders");
  revalidatePath(`/dashboard/orders/${orderId}`);

  return { error: null };
}
