"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorizeTenantAction } from "@/lib/auth-guards";
import { CatalogError } from "@/lib/catalog";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/categories";

export type CategoryFormState = { error: string | null };

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function createCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { tenantId } = await authorizeTenantAction("create", "category");

  try {
    await createCategory({
      tenantId,
      name: read(formData, "name"),
      slug: read(formData, "slug"),
      description: read(formData, "description") || null,
      parentId: read(formData, "parentId") || null,
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error creando categoría:", error);

    return { error: "No se pudo crear la categoría." };
  }

  revalidatePath("/dashboard/categories");

  redirect("/dashboard/categories");
}

export async function updateCategoryAction(
  _prev: CategoryFormState,
  formData: FormData,
): Promise<CategoryFormState> {
  const { tenantId } = await authorizeTenantAction("update", "category");

  const categoryId = read(formData, "categoryId");

  if (!categoryId) {
    return { error: "Categoría inválida." };
  }

  try {
    await updateCategory(tenantId, categoryId, {
      name: read(formData, "name"),
      slug: read(formData, "slug"),
      description: read(formData, "description") || null,
      parentId: read(formData, "parentId") || null,
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error actualizando categoría:", error);

    return { error: "No se pudo guardar la categoría." };
  }

  revalidatePath("/dashboard/categories");

  redirect("/dashboard/categories");
}

export async function deleteCategoryAction(formData: FormData) {
  const { tenantId } = await authorizeTenantAction("delete", "category");

  const categoryId = read(formData, "categoryId");

  if (!categoryId) {
    throw new Error("Categoría inválida.");
  }

  await deleteCategory(tenantId, categoryId);

  revalidatePath("/dashboard/categories");

  redirect("/dashboard/categories");
}
