import crypto from "crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { CatalogError } from "@/lib/catalog";

const CART_COOKIE = "cart_token";
const MAX_QUANTITY_PER_ITEM = 99;

async function readCartToken(): Promise<string | null> {
  const cookieStore = await cookies();

  return cookieStore.get(CART_COOKIE)?.value ?? null;
}

async function writeCartToken(token: string) {
  const cookieStore = await cookies();

  cookieStore.set(CART_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

/** Carrito existente de esta tienda, sin crearlo si no existe. */
export async function findCart(tenantId: string) {
  const token = await readCartToken();

  if (!token) {
    return null;
  }

  return prisma.cart.findFirst({
    where: { token, tenantId },
    include: {
      items: {
        orderBy: { createdAt: "asc" },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
            },
          },
        },
      },
    },
  });
}

async function getOrCreateCart(tenantId: string, customerId?: string | null) {
  const existing = await findCart(tenantId);

  if (existing) {
    // Si el comprador acaba de iniciar sesión, el carrito de invitado
    // pasa a ser suyo.
    if (customerId && existing.customerId !== customerId) {
      await prisma.cart.update({
        where: { id: existing.id },
        data: { customerId },
      });
    }

    return existing;
  }

  const token = crypto.randomUUID();

  const cart = await prisma.cart.create({
    data: { tenantId, token, customerId: customerId ?? null },
  });

  await writeCartToken(token);

  return { ...cart, items: [] };
}

export async function addToCart(input: {
  tenantId: string;
  productId: string;
  quantity: number;
  customerId?: string | null;
}) {
  const { tenantId, productId } = input;

  const quantity = Math.trunc(input.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    throw new CatalogError("La cantidad debe ser al menos 1.");
  }

  // El producto debe ser de ESTA tienda y estar publicado.
  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId, active: true },
    select: { id: true, name: true },
  });

  if (!product) {
    throw new CatalogError("El producto no está disponible.");
  }

  const cart = await getOrCreateCart(tenantId, input.customerId);

  const current = await prisma.cartItem.findUnique({
    where: { cartId_productId: { cartId: cart.id, productId } },
    select: { quantity: true },
  });

  const desired = (current?.quantity ?? 0) + quantity;

  if (desired > MAX_QUANTITY_PER_ITEM) {
    throw new CatalogError(
      `Máximo ${MAX_QUANTITY_PER_ITEM} unidades por producto.`,
    );
  }

  await prisma.cartItem.upsert({
    where: { cartId_productId: { cartId: cart.id, productId } },
    update: { quantity: desired },
    create: { cartId: cart.id, productId, quantity: desired },
  });
}

export async function updateCartItem(
  tenantId: string,
  productId: string,
  quantity: number,
) {
  const cart = await findCart(tenantId);

  if (!cart) {
    throw new CatalogError("No hay carrito activo.");
  }

  if (quantity <= 0) {
    await prisma.cartItem.deleteMany({
      where: { cartId: cart.id, productId },
    });

    return;
  }

  const product = await prisma.product.findFirst({
    where: { id: productId, tenantId, active: true },
    select: { id: true },
  });

  if (!product) {
    throw new CatalogError("El producto no está disponible.");
  }

  await prisma.cartItem.updateMany({
    where: { cartId: cart.id, productId },
    data: { quantity: Math.min(quantity, MAX_QUANTITY_PER_ITEM) },
  });
}

export async function removeFromCart(tenantId: string, productId: string) {
  const cart = await findCart(tenantId);

  if (!cart) {
    return;
  }

  await prisma.cartItem.deleteMany({
    where: { cartId: cart.id, productId },
  });
}

export async function clearCart(cartId: string) {
  await prisma.cartItem.deleteMany({ where: { cartId } });
}

export type CartSummary = {
  cartId: string | null;
  items: Array<{
    productId: string;
    name: string;
    sku: string;
    unitPrice: string;
    quantity: number;
    subtotal: string;
    imageUrl: string | null;
  }>;
  subtotal: string;
  count: number;
};

function toMoney(value: number): string {
  return value.toFixed(2);
}

export async function getCartSummary(tenantId: string): Promise<CartSummary> {
  const cart = await findCart(tenantId);

  if (!cart) {
    return { cartId: null, items: [], subtotal: "0.00", count: 0 };
  }

  let subtotal = 0;
  let count = 0;

  const items = cart.items
    .filter((item) => item.product.active)
    .map((item) => {
      const unitPrice = Number(item.product.price);
      const lineTotal = unitPrice * item.quantity;

      subtotal += lineTotal;
      count += item.quantity;

      return {
        productId: item.productId,
        name: item.product.name,
        sku: item.product.sku,
        unitPrice: toMoney(unitPrice),
        quantity: item.quantity,
        subtotal: toMoney(lineTotal),
        imageUrl: item.product.images[0]?.url ?? null,
      };
    });

  return {
    cartId: cart.id,
    items,
    subtotal: toMoney(subtotal),
    count,
  };
}
