import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { CatalogError } from "@/lib/catalog";
import { InsufficientStockError } from "@/lib/inventory";
import type { OrderStatus, PaymentMethod } from "@/generated/prisma/enums";

export const ORDERS_PAGE_SIZE = 20;

/**
 * Transiciones válidas de estado (§16). Fuera de esta tabla no se puede
 * mover un pedido, así que es imposible pasar de DELIVERED a PENDING.
 */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: ["REFUNDED"],
  CANCELLED: [],
  REFUNDED: [],
};

/** Estados en los que el stock sigue comprometido con el pedido. */
const STOCK_COMMITTED: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
];

export function canTransition(from: OrderStatus, to: OrderStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export function nextStatuses(from: OrderStatus): OrderStatus[] {
  return TRANSITIONS[from];
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  PROCESSING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELLED: "Cancelado",
  REFUNDED: "Reembolsado",
};

function generateOrderNumber(): string {
  const now = new Date();

  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");

  const random = crypto.randomBytes(3).toString("hex").toUpperCase();

  return `ORD-${date}-${random}`;
}

export type CheckoutInput = {
  tenantId: string;
  cartId: string;
  customerId?: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  shippingLine1: string;
  shippingLine2?: string | null;
  shippingCity: string;
  shippingState?: string | null;
  shippingPostalCode?: string | null;
  shippingCountry?: string;
  paymentMethod: PaymentMethod;
  shippingCost?: string;
  notes?: string | null;
};

/**
 * Convierte un carrito en pedido.
 *
 * Todo ocurre dentro de una única transacción: se vuelve a leer el
 * precio y a descontar el stock con UPDATE condicional. Si cualquier
 * línea no tiene stock, la transacción entera se deshace y no queda ni
 * pedido a medias ni stock descontado (§50).
 */
export async function createOrderFromCart(input: CheckoutInput) {
  const { tenantId } = input;

  const name = input.customerName.trim();
  const email = input.customerEmail.trim().toLowerCase();
  const line1 = input.shippingLine1.trim();
  const city = input.shippingCity.trim();

  if (!name || !email || !line1 || !city) {
    throw new CatalogError(
      "Nombre, correo, dirección y ciudad son obligatorios.",
    );
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CatalogError("El correo electrónico no es válido.");
  }

  const shippingCost = input.shippingCost?.trim()
    ? Number(input.shippingCost)
    : 0;

  if (!Number.isFinite(shippingCost) || shippingCost < 0) {
    throw new CatalogError("El costo de envío no es válido.");
  }

  return prisma.$transaction(async (tx) => {
    const cart = await tx.cart.findFirst({
      where: { id: input.cartId, tenantId },
      include: { items: true },
    });

    if (!cart || cart.items.length === 0) {
      throw new CatalogError("El carrito está vacío.");
    }

    let subtotal = 0;

    const orderItems: Array<{
      productId: string;
      name: string;
      sku: string;
      unitPrice: string;
      quantity: number;
      subtotal: string;
    }> = [];

    for (const item of cart.items) {
      // Se relee el producto DENTRO de la transacción: el precio que
      // vale es el de ahora, no el que vio el comprador.
      const product = await tx.product.findFirst({
        where: { id: item.productId, tenantId, active: true },
        select: { id: true, name: true, sku: true, price: true, stock: true },
      });

      if (!product) {
        throw new CatalogError(
          "Un producto de tu carrito ya no está disponible.",
        );
      }

      const decremented = await tx.product.updateMany({
        where: {
          id: product.id,
          tenantId,
          stock: { gte: item.quantity },
        },
        data: { stock: { decrement: item.quantity } },
      });

      if (decremented.count === 0) {
        throw new InsufficientStockError(
          `Stock insuficiente de ${product.name}: quedan ${product.stock}.`,
        );
      }

      const unitPrice = Number(product.price);
      const lineTotal = unitPrice * item.quantity;

      subtotal += lineTotal;

      orderItems.push({
        productId: product.id,
        name: product.name,
        sku: product.sku,
        unitPrice: unitPrice.toFixed(2),
        quantity: item.quantity,
        subtotal: lineTotal.toFixed(2),
      });
    }

    const total = subtotal + shippingCost;

    // El número lleva 3 bytes aleatorios; ante una colisión reintentamos
    // en vez de hacer fallar el pedido.
    let order = null;

    for (let attempt = 0; attempt < 5 && !order; attempt++) {
      try {
        order = await tx.order.create({
          data: {
            tenantId,
            customerId: input.customerId ?? null,
            number: generateOrderNumber(),
            status: "PENDING",
            subtotal: subtotal.toFixed(2),
            shipping: shippingCost.toFixed(2),
            total: total.toFixed(2),
            paymentMethod: input.paymentMethod,
            customerName: name,
            customerEmail: email,
            customerPhone: input.customerPhone?.trim() || null,
            shippingLine1: line1,
            shippingLine2: input.shippingLine2?.trim() || null,
            shippingCity: city,
            shippingState: input.shippingState?.trim() || null,
            shippingPostalCode: input.shippingPostalCode?.trim() || null,
            shippingCountry: input.shippingCountry?.trim() || "CO",
            notes: input.notes?.trim() || null,
            items: { create: orderItems },
          },
          include: { items: true },
        });
      } catch (error) {
        if ((error as { code?: string }).code !== "P2002") {
          throw error;
        }
      }
    }

    if (!order) {
      throw new CatalogError("No se pudo generar el número de pedido.");
    }

    // Un movimiento de inventario por línea, para que el histórico
    // explique por qué bajó el stock.
    for (const item of orderItems) {
      const product = await tx.product.findUniqueOrThrow({
        where: { id: item.productId },
        select: { stock: true },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          type: "SALE",
          quantity: -item.quantity,
          stockAfter: product.stock,
          reason: `Pedido ${order.number}`,
        },
      });
    }

    await tx.cartItem.deleteMany({ where: { cartId: cart.id } });

    return order;
  });
}

export async function getOrders(
  tenantId: string,
  options: {
    page?: number;
    pageSize?: number;
    status?: OrderStatus;
    query?: string;
  } = {},
) {
  const pageSize = options.pageSize ?? ORDERS_PAGE_SIZE;
  const page = Math.max(1, options.page ?? 1);
  const search = options.query?.trim();

  const where = {
    tenantId,
    ...(options.status ? { status: options.status } : {}),
    ...(search
      ? {
          OR: [
            { number: { contains: search, mode: "insensitive" as const } },
            {
              customerName: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
            {
              customerEmail: {
                contains: search,
                mode: "insensitive" as const,
              },
            },
          ],
        }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { _count: { select: { items: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}

export async function getOrder(tenantId: string, orderId: string) {
  return prisma.order.findFirst({
    where: { id: orderId, tenantId },
    include: { items: true, customer: { select: { id: true, name: true } } },
  });
}

export async function getOrderByNumber(tenantId: string, number: string) {
  return prisma.order.findFirst({
    where: { tenantId, number },
    include: { items: true },
  });
}

export async function updateOrderStatus(
  tenantId: string,
  orderId: string,
  status: OrderStatus,
) {
  const order = await prisma.order.findFirst({
    where: { id: orderId, tenantId },
    select: { id: true, status: true, number: true },
  });

  if (!order) {
    throw new CatalogError("Pedido no encontrado.");
  }

  if (!canTransition(order.status, status)) {
    throw new CatalogError(
      `No se puede pasar de ${STATUS_LABELS[order.status]} a ${STATUS_LABELS[status]}.`,
    );
  }

  if (status === "CANCELLED" || status === "REFUNDED") {
    return restoreStockAndClose(tenantId, orderId, status);
  }

  return prisma.order.update({
    where: { id: order.id },
    data: { status },
  });
}

/**
 * Cancelar o reembolsar devuelve las unidades al inventario, pero solo
 * si el stock seguía comprometido: así cancelar dos veces no infla el
 * stock.
 */
async function restoreStockAndClose(
  tenantId: string,
  orderId: string,
  status: "CANCELLED" | "REFUNDED",
) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findFirstOrThrow({
      where: { id: orderId, tenantId },
      include: { items: true },
    });

    if (!STOCK_COMMITTED.includes(order.status)) {
      throw new CatalogError("Este pedido ya no tiene stock comprometido.");
    }

    for (const item of order.items) {
      if (!item.productId) {
        continue;
      }

      const updated = await tx.product.updateMany({
        where: { id: item.productId, tenantId },
        data: { stock: { increment: item.quantity } },
      });

      if (updated.count === 0) {
        continue;
      }

      const product = await tx.product.findUniqueOrThrow({
        where: { id: item.productId },
        select: { stock: true },
      });

      await tx.inventoryMovement.create({
        data: {
          tenantId,
          productId: item.productId,
          type: "RETURN",
          quantity: item.quantity,
          stockAfter: product.stock,
          reason: `${status === "CANCELLED" ? "Cancelación" : "Reembolso"} ${order.number}`,
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status, cancelledAt: new Date() },
    });
  });
}

/** Métricas del dashboard (§20, §21). */
export async function getSalesSummary(tenantId: string) {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  // Los pedidos cancelados y reembolsados no cuentan como venta.
  const revenueWhere = {
    tenantId,
    status: { notIn: ["CANCELLED", "REFUNDED"] as OrderStatus[] },
  };

  const [today, month, pending, totalOrders, customers, products] =
    await Promise.all([
      prisma.order.aggregate({
        where: { ...revenueWhere, createdAt: { gte: startOfDay } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { ...revenueWhere, createdAt: { gte: startOfMonth } },
        _sum: { total: true },
        _count: true,
      }),
      prisma.order.count({ where: { tenantId, status: "PENDING" } }),
      prisma.order.count({ where: { tenantId } }),
      prisma.customer.count({ where: { tenantId } }),
      prisma.product.count({ where: { tenantId, active: true } }),
    ]);

  return {
    todayRevenue: Number(today._sum.total ?? 0),
    todayOrders: today._count,
    monthRevenue: Number(month._sum.total ?? 0),
    monthOrders: month._count,
    pendingOrders: pending,
    totalOrders,
    customers,
    products,
  };
}

/** Productos más vendidos (§21). */
export async function getTopProducts(tenantId: string, limit = 5) {
  return prisma.$queryRaw<
    Array<{ name: string; sku: string; units: bigint; revenue: string }>
  >`
    SELECT oi.name, oi.sku,
           SUM(oi.quantity)::bigint AS units,
           SUM(oi.subtotal)::text  AS revenue
    FROM "OrderItem" oi
    JOIN "Order" o ON o.id = oi."orderId"
    WHERE o."tenantId" = ${tenantId}
      AND o.status NOT IN ('CANCELLED', 'REFUNDED')
    GROUP BY oi.name, oi.sku
    ORDER BY units DESC
    LIMIT ${limit}
  `;
}
