import { prisma } from "@/lib/prisma";
import { CatalogError } from "@/lib/catalog";

/** Configuración e identidad de cada tienda (§22, §23). */

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;
const MONEY = /^\d{1,10}(\.\d{1,2})?$/;

export type StoreSettings = Awaited<ReturnType<typeof getSettings>>;

export async function getSettings(tenantId: string) {
  return prisma.tenant.findUniqueOrThrow({
    where: { id: tenantId },
    select: {
      id: true,
      name: true,
      slug: true,
      status: true,
      description: true,
      logoUrl: true,
      primaryColor: true,
      currency: true,
      email: true,
      phone: true,
      address: true,
      instagramUrl: true,
      facebookUrl: true,
      whatsapp: true,
      shippingCost: true,
      freeShippingThreshold: true,
    },
  });
}

function optionalUrl(value: string | null, label: string): string | null {
  if (!value) {
    return null;
  }

  try {
    const parsed = new URL(value);

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      throw new Error("protocolo");
    }

    return parsed.toString();
  } catch {
    throw new CatalogError(`${label} debe ser una URL válida (https://...).`);
  }
}

export async function updateSettings(
  tenantId: string,
  input: {
    name: string;
    description?: string | null;
    primaryColor?: string;
    currency?: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    instagramUrl?: string | null;
    facebookUrl?: string | null;
    whatsapp?: string | null;
    shippingCost?: string;
    freeShippingThreshold?: string | null;
  },
) {
  const name = input.name.trim();

  if (!name) {
    throw new CatalogError("El nombre de la tienda es obligatorio.");
  }

  const primaryColor = input.primaryColor?.trim() || "#0F172A";

  if (!HEX_COLOR.test(primaryColor)) {
    throw new CatalogError("El color debe estar en formato #RRGGBB.");
  }

  const currency = (input.currency?.trim() || "COP").toUpperCase();

  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new CatalogError("La moneda debe ser un código ISO de 3 letras.");
  }

  const email = input.email?.trim().toLowerCase() || null;

  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new CatalogError("El correo de contacto no es válido.");
  }

  const shippingCost = input.shippingCost?.trim() || "0";

  if (!MONEY.test(shippingCost)) {
    throw new CatalogError("El costo de envío no es válido.");
  }

  const threshold = input.freeShippingThreshold?.trim() || null;

  if (threshold && !MONEY.test(threshold)) {
    throw new CatalogError("El monto de envío gratis no es válido.");
  }

  return prisma.tenant.update({
    where: { id: tenantId },
    data: {
      name,
      description: input.description?.trim() || null,
      primaryColor,
      currency,
      email,
      phone: input.phone?.trim() || null,
      address: input.address?.trim() || null,
      instagramUrl: optionalUrl(
        input.instagramUrl?.trim() || null,
        "El enlace de Instagram",
      ),
      facebookUrl: optionalUrl(
        input.facebookUrl?.trim() || null,
        "El enlace de Facebook",
      ),
      whatsapp: input.whatsapp?.trim() || null,
      shippingCost,
      freeShippingThreshold: threshold,
    },
  });
}

/**
 * Envío que corresponde a un subtotal. Vive aquí y no en el checkout
 * para que la tienda y el pedido calculen siempre lo mismo.
 */
export function resolveShipping(
  settings: { shippingCost: unknown; freeShippingThreshold: unknown },
  subtotal: number,
): number {
  const threshold = settings.freeShippingThreshold;

  if (threshold !== null && threshold !== undefined) {
    if (subtotal >= Number(threshold)) {
      return 0;
    }
  }

  return Number(settings.shippingCost ?? 0);
}
