"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorizeTenantAction } from "@/lib/auth-guards";
import { CatalogError, createProduct } from "@/lib/catalog";
import { parseProductForm } from "@/lib/product-form";
import type { ProductFormState } from "@/components/products/form-state";

export async function createProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { tenantId } = await authorizeTenantAction("create", "product");

  try {
    const input = parseProductForm(formData);

    await createProduct({
      tenantId,
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      description: input.description,
      categoryId: input.categoryId,
      images: input.images,
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
