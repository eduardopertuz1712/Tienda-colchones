"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { authorizePlatformAction } from "@/lib/auth-guards";
import {
  addProductImages,
  assertTenantExists,
  CatalogError,
  createProduct,
  deleteProduct,
  deleteProductImageById,
  findProductTenantId,
  updateProduct,
} from "@/lib/catalog";
import { parseProductForm } from "@/lib/product-form";
import type { ProductFormState } from "@/components/products/form-state";

/**
 * Resuelve el tenant real del producto para poder aplicar exactamente
 * las mismas reglas de escritura que usa un Owner. El SUPER_ADMIN
 * amplía el alcance, no relaja las validaciones: una categoría de otra
 * tienda sigue siendo inválida.
 */
async function resolveProductTenant(productId: string): Promise<string> {
  const tenantId = await findProductTenantId(productId);

  if (!tenantId) {
    throw new CatalogError("Producto no encontrado.");
  }

  return tenantId;
}

function toFormState(error: unknown, context: string): ProductFormState {
  if (error instanceof CatalogError) {
    return { error: error.message };
  }

  console.error(context, error);

  return { error: "No se pudo completar la operación. Inténtalo de nuevo." };
}

export async function createProductAsPlatform(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await authorizePlatformAction("create", "product");

  const rawTenantId = formData.get("tenantId");

  if (typeof rawTenantId !== "string" || !rawTenantId) {
    return { error: "Debes indicar la tienda del producto." };
  }

  try {
    const tenantId = await assertTenantExists(rawTenantId);

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
    return toFormState(error, "Error creando producto (plataforma):");
  }

  revalidatePath("/super-admin/products");

  redirect("/super-admin/products");
}

export async function updateProductAsPlatform(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  await authorizePlatformAction("update", "product");

  const productId = formData.get("productId");

  if (typeof productId !== "string" || !productId) {
    return { error: "Producto inválido." };
  }

  try {
    const tenantId = await resolveProductTenant(productId);

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
    return toFormState(error, "Error actualizando producto (plataforma):");
  }

  revalidatePath("/super-admin/products");
  revalidatePath(`/super-admin/products/${productId}`);

  redirect("/super-admin/products");
}

export async function deleteProductAsPlatform(formData: FormData) {
  await authorizePlatformAction("delete", "product");

  const productId = formData.get("productId");

  if (typeof productId !== "string" || !productId) {
    throw new Error("Producto inválido.");
  }

  const tenantId = await resolveProductTenant(productId);

  await deleteProduct(tenantId, productId);

  revalidatePath("/super-admin/products");

  redirect("/super-admin/products");
}

export async function deleteProductImageAsPlatform(formData: FormData) {
  await authorizePlatformAction("update", "product");

  const imageId = formData.get("imageId");
  const productId = formData.get("productId");

  if (
    typeof imageId !== "string" ||
    !imageId ||
    typeof productId !== "string" ||
    !productId
  ) {
    throw new Error("Imagen inválida.");
  }

  const tenantId = await resolveProductTenant(productId);

  await deleteProductImageById(tenantId, imageId);

  revalidatePath(`/super-admin/products/${productId}`);
}
