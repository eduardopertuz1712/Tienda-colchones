"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorizeTenantAction } from "@/lib/auth-guards";
import {
  addProductImages,
  CatalogError,
  deleteProduct,
  deleteProductImageById,
  updateProduct,
} from "@/lib/catalog";
import { parseProductForm } from "@/lib/product-form";
import type { ProductFormState } from "@/components/products/form-state";

export async function updateProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const { tenantId } = await authorizeTenantAction("update", "product");

  const productId = formData.get("productId");

  if (typeof productId !== "string" || !productId) {
    return { error: "Producto inválido." };
  }

  try {
    const input = parseProductForm(formData);

    await updateProduct(tenantId, productId, {
      name: input.name,
      slug: input.slug,
      sku: input.sku,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      description: input.description,
      categoryId: input.categoryId,
      active: input.active,
    });

    if (input.images.length > 0) {
      await addProductImages(tenantId, productId, input.images);
    }
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error actualizando producto:", error);

    return { error: "No se pudo guardar el producto." };
  }

  revalidatePath("/dashboard/products");

  redirect("/dashboard/products");
}

export async function deleteProductAction(formData: FormData) {
  const { tenantId } = await authorizeTenantAction("delete", "product");

  const productId = formData.get("productId");

  if (typeof productId !== "string" || !productId) {
    throw new Error("Producto inválido.");
  }

  await deleteProduct(tenantId, productId);

  revalidatePath("/dashboard/products");

  redirect("/dashboard/products");
}

export async function deleteProductImageAction(formData: FormData) {
  const { tenantId } = await authorizeTenantAction("update", "product");

  const imageId = formData.get("imageId");
  const productId = formData.get("productId");

  if (typeof imageId !== "string" || typeof productId !== "string") {
    throw new Error("Imagen inválida.");
  }

  await deleteProductImageById(tenantId, imageId);

  revalidatePath(`/dashboard/products/${productId}`);
}
