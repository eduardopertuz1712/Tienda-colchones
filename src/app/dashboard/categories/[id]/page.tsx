import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getCategories } from "@/lib/catalog";
import { getCategory } from "@/lib/categories";
import { can } from "@/lib/permissions";
import { CategoryForm } from "@/components/categories/CategoryForm";
import { ConfirmSubmitButton } from "@/components/products/ConfirmSubmitButton";
import { deleteCategoryAction, updateCategoryAction } from "../actions";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId, user } = await requireTenantPermission(
    "update",
    "category",
  );

  const { id } = await params;

  const category = await getCategory(tenantId, id);

  if (!category) {
    notFound();
  }

  // Una categoría no puede ser su propia padre.
  const parents = (await getCategories(tenantId)).filter(
    (item) => item.id !== category.id,
  );

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
          <h1 className="mt-4 text-3xl font-bold">{category.name}</h1>
          <p className="mt-2 text-sm text-gray-500">
            {category._count.products} producto(s) ·{" "}
            {category._count.children} subcategoría(s)
          </p>
        </div>

        <CategoryForm
          action={updateCategoryAction}
          parents={parents}
          submitLabel="Guardar cambios"
          hiddenFields={{ categoryId: category.id }}
          values={{
            name: category.name,
            slug: category.slug,
            description: category.description ?? "",
            parentId: category.parentId ?? "",
          }}
        />

        {can(user, "delete", "category") && (
          <div className="mt-6 rounded-xl border border-red-200 p-6">
            <h2 className="text-sm font-medium text-red-700">
              Eliminar categoría
            </h2>
            <p className="mt-2 text-sm text-gray-500">
              Solo se puede eliminar si no tiene productos. Las
              subcategorías pasarán a ser categorías raíz.
            </p>
            <form action={deleteCategoryAction} className="mt-4">
              <input type="hidden" name="categoryId" value={category.id} />
              <ConfirmSubmitButton
                message={`¿Eliminar la categoría "${category.name}"?`}
                label="Eliminar categoría"
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              />
            </form>
          </div>
        )}
      </div>
    </main>
  );
}
