"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { CatalogError } from "@/lib/catalog";
import { addToCart, findCart, removeFromCart, updateCartItem } from "@/lib/cart";
import { createOrderFromCart } from "@/lib/orders";
import { requireStore } from "@/lib/storefront";
import { getCustomerSession } from "@/lib/customer-session";
import type { PaymentMethod } from "@/generated/prisma/enums";

export type StoreFormState = { error: string | null };

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

/**
 * Toda action de la tienda resuelve el tenant a partir del slug de la
 * URL y trabaja solo dentro de él: el comprador nunca envía un tenantId.
 */
async function storeContext(slug: string) {
  const store = await requireStore(slug);

  const session = await getCustomerSession(store.id);

  return { store, customerId: session?.customerId ?? null };
}

export async function addToCartAction(
  _prev: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const slug = read(formData, "slug");
  const productId = read(formData, "productId");
  const quantity = Number(read(formData, "quantity") || "1");

  const { store, customerId } = await storeContext(slug);

  try {
    await addToCart({
      tenantId: store.id,
      productId,
      quantity,
      customerId,
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error añadiendo al carrito:", error);

    return { error: "No se pudo añadir al carrito." };
  }

  revalidatePath(`/tienda/${slug}/carrito`);

  redirect(`/tienda/${slug}/carrito`);
}

export async function updateCartItemAction(formData: FormData) {
  const slug = read(formData, "slug");
  const productId = read(formData, "productId");
  const quantity = Number(read(formData, "quantity") || "0");

  const { store } = await storeContext(slug);

  try {
    await updateCartItem(store.id, productId, quantity);
  } catch (error) {
    if (!(error instanceof CatalogError)) {
      throw error;
    }
  }

  revalidatePath(`/tienda/${slug}/carrito`);
}

export async function removeFromCartAction(formData: FormData) {
  const slug = read(formData, "slug");
  const productId = read(formData, "productId");

  const { store } = await storeContext(slug);

  await removeFromCart(store.id, productId);

  revalidatePath(`/tienda/${slug}/carrito`);
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "CASH_ON_DELIVERY",
  "BANK_TRANSFER",
];

export async function checkoutAction(
  _prev: StoreFormState,
  formData: FormData,
): Promise<StoreFormState> {
  const slug = read(formData, "slug");

  const { store, customerId } = await storeContext(slug);

  const cart = await findCart(store.id);

  if (!cart || cart.items.length === 0) {
    return { error: "Tu carrito está vacío." };
  }

  const paymentMethod = read(formData, "paymentMethod");

  if (!PAYMENT_METHODS.includes(paymentMethod as PaymentMethod)) {
    return { error: "Método de pago inválido." };
  }

  let order;

  try {
    order = await createOrderFromCart({
      tenantId: store.id,
      cartId: cart.id,
      customerId,
      customerName: read(formData, "customerName"),
      customerEmail: read(formData, "customerEmail"),
      customerPhone: read(formData, "customerPhone") || null,
      shippingLine1: read(formData, "shippingLine1"),
      shippingLine2: read(formData, "shippingLine2") || null,
      shippingCity: read(formData, "shippingCity"),
      shippingState: read(formData, "shippingState") || null,
      shippingPostalCode: read(formData, "shippingPostalCode") || null,
      paymentMethod: paymentMethod as PaymentMethod,
      notes: read(formData, "notes") || null,
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error en checkout:", error);

    return { error: "No se pudo completar el pedido. Inténtalo de nuevo." };
  }

  revalidatePath(`/tienda/${slug}`);

  redirect(`/tienda/${slug}/pedido/${order.number}`);
}
