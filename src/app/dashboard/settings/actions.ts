"use server";

import { revalidatePath } from "next/cache";
import { authorizeTenantAction } from "@/lib/auth-guards";
import { CatalogError } from "@/lib/catalog";
import { updateSettings } from "@/lib/settings";

export type SettingsFormState = { error: string | null; ok: boolean };

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function updateSettingsAction(
  _prev: SettingsFormState,
  formData: FormData,
): Promise<SettingsFormState> {
  const { tenantId } = await authorizeTenantAction("update", "settings");

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
      return { error: error.message, ok: false };
    }

    console.error("Error guardando configuración:", error);

    return { error: "No se pudo guardar la configuración.", ok: false };
  }

  revalidatePath("/dashboard/settings");
  revalidatePath("/dashboard");

  return { error: null, ok: true };
}
