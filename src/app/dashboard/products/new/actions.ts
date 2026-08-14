"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorizeTenantAction } from "@/lib/auth-guards";
import { CatalogError, createProduct } from "@/lib/catalog";

export type ProductFormState = {
  error: string | null;
};

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { tenantId } = await authorizeTenantAction("create", "product");

  const name = formData.get("name");
  const slug = formData.get("slug");
  const description = formData.get("description");
  const sku = formData.get("sku");
  const price = formData.get("price");
  const categoryId = formData.get("categoryId");

  if (
    typeof name !== "string" ||
    typeof slug !== "string" ||
    typeof sku !== "string" ||
    typeof price !== "string"
  ) {
    return { error: "Datos del producto inválidos." };
  }

  const images = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  try {
    await createProduct({
      tenantId,
      name,
      slug,
      sku,
      price,
      description: typeof description === "string" ? description : null,
      categoryId: typeof categoryId === "string" ? categoryId : null,
      images,
    });
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error creando producto:", error);

    return {
      error: "No se pudo crear el producto. Inténtalo de nuevo.",
    };
  }

  revalidatePath("/dashboard/products");

  redirect("/dashboard/products");
}
