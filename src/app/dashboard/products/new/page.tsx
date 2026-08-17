import Link from "next/link";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getCategories } from "@/lib/catalog";
import { ProductForm } from "@/components/products/ProductForm";
import { createProductAction } from "./actions";

export default async function NewProductPage() {
  const { tenantId } = await requireTenantPermission("create", "product");

  const categories = await getCategories(tenantId);

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/dashboard/products"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Volver a productos
          </Link>

          <h1 className="mt-4 text-3xl font-bold">
            Nuevo producto
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Agrega un producto a tu tienda.
          </p>
        </div>

        <ProductForm
          action={createProductAction}
          categories={categories}
          cancelHref="/dashboard/products"
          submitLabel="Crear producto"
        />
      </div>
    </main>
  );
}
