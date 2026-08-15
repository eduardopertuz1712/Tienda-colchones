import Link from "next/link";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getCategories } from "@/lib/catalog";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { createCategoryAction } from "../actions";

export default async function NewCategoryPage() {
  const { tenantId } = await requireTenantPermission("create", "category");

  const parents = await getCategories(tenantId);

  return (
    <main className="p-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-8">
          <Link
            href="/dashboard/categories"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Volver a categorías
          </Link>
          <h1 className="mt-4 text-3xl font-bold">Nueva categoría</h1>
        </div>

        <CategoryForm
          action={createCategoryAction}
          parents={parents}
          submitLabel="Crear categoría"
        />
      </div>
    </main>
  );
}
