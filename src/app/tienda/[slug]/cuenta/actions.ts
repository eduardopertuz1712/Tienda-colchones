"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { CatalogError } from "@/lib/catalog";
import { authenticateCustomer, registerCustomer } from "@/lib/customers";
import { requireStore } from "@/lib/storefront";
import {
  endCustomerSession,
  startCustomerSession,
} from "@/lib/customer-session";

export type AccountFormState = { error: string | null };

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

/** Solo destinos internos de ESTA tienda. */
function safeNext(slug: string, value: string): string {
  const fallback = `/tienda/${slug}/cuenta`;

  if (!value.startsWith(`/tienda/${slug}`) || value.startsWith("//")) {
    return fallback;
  }

  return value;
}

export async function loginCustomerAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const slug = read(formData, "slug");

  const store = await requireStore(slug);

  const customer = await authenticateCustomer(
    store.id,
    read(formData, "email"),
    String(formData.get("password") ?? ""),
  );

  if (!customer) {
    return { error: "Correo electrónico o contraseña incorrectos." };
  }

  await startCustomerSession(customer.id, store.id);

  revalidatePath(`/tienda/${slug}`);

  redirect(safeNext(slug, read(formData, "next")));
}

export async function registerCustomerAction(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const slug = read(formData, "slug");

  const store = await requireStore(slug);

  const password = String(formData.get("password") ?? "");

  if (password !== String(formData.get("passwordConfirm") ?? "")) {
    return { error: "Las contraseñas no coinciden." };
  }

  let customer;

  try {
    customer = await registerCustomer({
      tenantId: store.id,
      name: read(formData, "name"),
      email: read(formData, "email"),
      phone: read(formData, "phone") || null,
      password,
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error registrando cliente:", error);

    return { error: "No se pudo crear la cuenta. Inténtalo de nuevo." };
  }

  await startCustomerSession(customer.id, store.id);

  revalidatePath(`/tienda/${slug}`);

  redirect(safeNext(slug, read(formData, "next")));
}

export async function logoutCustomerAction(formData: FormData) {
  const slug = read(formData, "slug");

  await endCustomerSession();

  revalidatePath(`/tienda/${slug}`);

  redirect(`/tienda/${slug}`);
}
