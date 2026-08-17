import Link from "next/link";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getCategoryTree } from "@/lib/categories";
import { can } from "@/lib/permissions";

export default async function CategoriesPage() {
  const { tenantId, user } = await requireTenantPermission(
    "view",
    "category",
  );

  const tree = await getCategoryTree(tenantId);

  const canCreate = can(user, "create", "category");
  const canEdit = can(user, "update", "category");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Categorías</h1>
            <p className="mt-2 text-sm text-gray-500">
              Organiza tus productos. Puedes anidar subcategorías.
            </p>
          </div>

          {canCreate && (
            <Link
              href="/dashboard/categories/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Nueva categoría
            </Link>
          )}
        </div>

        <div className="mt-8 rounded-xl border">
          {tree.roots.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No hay categorías todavía.
            </div>
          ) : (
            <ul>
              {tree.roots.map((root) => (
                <li key={root.id} className="border-b last:border-0">
                  <div className="flex items-center justify-between px-6 py-4">
                    <div>
                      <p className="font-medium">{root.name}</p>
                      <p className="text-sm text-gray-500">
                        /{root.slug} · {root._count.products} producto(s)
                      </p>
                    </div>

                    {canEdit && (
                      <Link
                        href={`/dashboard/categories/${root.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        Editar
                      </Link>
                    )}
                  </div>

                  {tree.childrenOf(root.id).length > 0 && (
                    <ul className="bg-gray-50">
                      {tree.childrenOf(root.id).map((child) => (
                        <li
                          key={child.id}
                          className="flex items-center justify-between border-t px-6 py-3 pl-12"
                        >
                          <div>
                            <p className="text-sm font-medium">
                              └ {child.name}
                            </p>
                            <p className="text-xs text-gray-500">
                              /{child.slug} · {child._count.products}{" "}
                              producto(s)
                            </p>
                          </div>

                          {canEdit && (
                            <Link
                              href={`/dashboard/categories/${child.id}`}
                              className="text-sm hover:underline"
                            >
                              Editar
                            </Link>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
