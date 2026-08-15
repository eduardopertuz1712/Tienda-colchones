import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformPermission } from "@/lib/auth-guards";
import {
  getCategories,
  getProductForPlatform,
  MAX_PRODUCT_IMAGES,
} from "@/lib/catalog";
import { ProductForm } from "@/components/products/ProductForm";
import { ConfirmSubmitButton } from "@/components/products/ConfirmSubmitButton";
import {
  deleteProductAsPlatform,
  deleteProductImageAsPlatform,
  updateProductAsPlatform,
} from "../actions";

export default async function EditPlatformProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformPermission("update", "product");

  const { id } = await params;

  const product = await getProductForPlatform(id);

  if (!product) {
    notFound();
  }

  // Las categorías son las de la tienda del producto, nunca las de otra.
  const categories = await getCategories(product.tenantId);

  const remaining = MAX_PRODUCT_IMAGES - product.images.length;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/super-admin/products"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Volver a productos
          </Link>

          <h1 className="mt-4 text-3xl font-bold">{product.name}</h1>

          <p className="mt-2 text-sm text-gray-500">
            Tienda: {product.tenant.name} · Creado el{" "}
            {product.createdAt.toLocaleDateString("es-CO")}
          </p>
        </div>

        {product.images.length > 0 && (
          <div className="mb-6 rounded-xl border p-6">
            <h2 className="text-sm font-medium">Imágenes actuales</h2>

            <ul className="mt-4 flex flex-wrap gap-4">
              {product.images.map((image) => (
                <li key={image.id} className="w-28">
                  <div className="relative h-28 w-28 overflow-hidden rounded-lg border bg-gray-100">
                    <Image
                      src={image.url}
                      alt={image.alt ?? product.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>

                  {image.isPrimary && (
                    <p className="mt-1 text-center text-xs text-gray-500">
                      Principal
                    </p>
                  )}

                  <form action={deleteProductImageAsPlatform}>
                    <input type="hidden" name="imageId" value={image.id} />
                    <input
                      type="hidden"
                      name="productId"
                      value={product.id}
                    />

                    <ConfirmSubmitButton
                      message="¿Eliminar esta imagen?"
                      label="Eliminar"
                      className="mt-1 w-full rounded-lg border px-2 py-1 text-xs disabled:opacity-50"
                    />
                  </form>
                </li>
              ))}
            </ul>
          </div>
        )}

        <ProductForm
          action={updateProductAsPlatform}
          categories={categories}
          cancelHref="/super-admin/products"
          submitLabel="Guardar cambios"
          showActive
          showInitialStock={false}
          hiddenFields={{ productId: product.id }}
          imagesHint={
            remaining > 0
              ? `Puedes añadir ${remaining} imagen${remaining === 1 ? "" : "es"} más. Máximo 5 MB por imagen.`
              : "Este producto ya tiene el máximo de imágenes."
          }
          values={{
            name: product.name,
            slug: product.slug,
            sku: product.sku,
            price: product.price.toString(),
            compareAtPrice: product.compareAtPrice?.toString() ?? "",
            minStock: String(product.minStock),
            description: product.description ?? "",
            categoryId: product.categoryId ?? "",
            active: product.active,
          }}
        />

        <div className="mt-6 rounded-xl border border-red-200 p-6">
          <h2 className="text-sm font-medium text-red-700">
            Eliminar producto
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Se borrarán también sus imágenes. Esta acción no se puede
            deshacer.
          </p>

          <form action={deleteProductAsPlatform} className="mt-4">
            <input type="hidden" name="productId" value={product.id} />

            <ConfirmSubmitButton
              message={`¿Eliminar "${product.name}" de forma permanente?`}
              label="Eliminar producto"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            />
          </form>
        </div>
      </div>
    </main>
  );
}
