"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorizePlatformAction } from "@/lib/auth-guards";
import { CatalogError } from "@/lib/catalog";
import { assignOwner, createTenant, updateTenantStatus } from "@/lib/tenants";
import { updateSettings } from "@/lib/settings";
import type { TenantStatus } from "@/generated/prisma/enums";

export type TenantFormState = { error: string | null; ok: string | null };

const STATUSES: TenantStatus[] = ["ACTIVE", "SUSPENDED", "INACTIVE"];

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function createTenantAction(
  _prev: TenantFormState,
  formData: FormData,
): Promise<TenantFormState> {
  await authorizePlatformAction("create", "tenant");

  let tenant;

  try {
    tenant = await createTenant({
      name: read(formData, "name"),
      slug: read(formData, "slug"),
      ownerName: read(formData, "ownerName"),
      ownerEmail: read(formData, "ownerEmail"),
      ownerPassword: String(formData.get("ownerPassword") ?? ""),
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message, ok: null };
    }

    console.error("Error creando tienda:", error);

    return { error: "No se pudo crear la tienda.", ok: null };
  }

  revalidatePath("/super-admin/tiendas");

  redirect(`/super-admin/tiendas/${tenant.id}`);
}

export async function updateTenantSettingsAction(
  _prev: TenantFormState,
  formData: FormData,
): Promise<TenantFormState> {
  await authorizePlatformAction("update", "settings");

  const tenantId = read(formData, "tenantId");

  if (!tenantId) {
    return { error: "Tienda inválida.", ok: null };
  }

  try {
    await updateSettings(tenantId, {
      name: read(formData, "name"),
      description: read(formData, "description") || null,
      primaryColor: read(formData, "primaryColor"),
      currency: read(formData, "currency"),
      email: read(formData, "email") || null,
      phone: read(formData, "phone") || null,
      address: read(formData, "address") || null,
      instagramUrl: read(formData, "instagramUrl") || null,
      facebookUrl: read(formData, "facebookUrl") || null,
      whatsapp: read(formData, "whatsapp") || null,
      shippingCost: read(formData, "shippingCost"),
      freeShippingThreshold: read(formData, "freeShippingThreshold") || null,
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message, ok: null };
    }

    console.error("Error guardando configuración:", error);

    return { error: "No se pudo guardar la configuración.", ok: null };
  }

  revalidatePath(`/super-admin/tiendas/${tenantId}`);

  return { error: null, ok: "Configuración guardada." };
}

export async function changeTenantStatusAction(formData: FormData) {
  await authorizePlatformAction("update", "tenant");

  const tenantId = read(formData, "tenantId");
  const status = read(formData, "status");

  if (!tenantId || !STATUSES.includes(status as TenantStatus)) {
    throw new Error("Datos inválidos.");
  }

  await updateTenantStatus(tenantId, status as TenantStatus);

  revalidatePath("/super-admin/tiendas");
  revalidatePath(`/super-admin/tiendas/${tenantId}`);
}

export async function assignOwnerAction(
  _prev: TenantFormState,
  formData: FormData,
): Promise<TenantFormState> {
  await authorizePlatformAction("create", "user");

  const tenantId = read(formData, "tenantId");

  if (!tenantId) {
    return { error: "Tienda inválida.", ok: null };
  }

  try {
    const owner = await assignOwner(tenantId, {
      name: read(formData, "ownerName"),
      email: read(formData, "ownerEmail"),
      password: String(formData.get("ownerPassword") ?? ""),
    });

    revalidatePath(`/super-admin/tiendas/${tenantId}`);

    return { error: null, ok: `${owner.name} ya puede iniciar sesión.` };
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message, ok: null };
    }

    console.error("Error asignando propietario:", error);

    return { error: "No se pudo crear el propietario.", ok: null };
  }
}
