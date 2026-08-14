import Image from "next/image";
import Link from "next/link";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getProducts } from "@/lib/catalog";
import { can } from "@/lib/permissions";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
});

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { tenantId, user } = await requireTenantPermission(
    "view",
    "product",
  );

  const { page: pageParam } = await searchParams;

  const requestedPage = Number(pageParam);

  const { items, page, pageCount, total } = await getProducts(tenantId, {
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
  });

  const canCreate = can(user, "create", "product");

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Productos
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              {total === 0
                ? "Administra los productos de tu tienda."
                : `${total} producto${total === 1 ? "" : "s"} en tu tienda.`}
            </p>
          </div>

          {canCreate && (
            <Link
              href="/dashboard/products/new"
              className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
            >
              Nuevo producto
            </Link>
          )}
        </div>

        <div className="mt-8 overflow-hidden rounded-xl border">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Producto
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  SKU
                </th>

                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Categoría
                </th>

                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Precio
                </th>

                <th className="px-6 py-4 text-center text-sm font-semibold">
                  Estado
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((product) => {
                const primaryImage = product.images[0];

                return (
                  <tr
                    key={product.id}
                    className="border-b last:border-0"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 overflow-hidden rounded-lg border bg-gray-100">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.url}
                              alt={primaryImage.alt ?? product.name}
                              fill
                              className="object-cover"
                              sizes="56px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                              Sin foto
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-medium">
                            {product.name}
                          </p>

                          {product.description && (
                            <p className="mt-1 text-sm text-gray-500">
                              {product.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {product.sku}
                    </td>

                    <td className="px-6 py-4 text-sm">
                      {product.category?.name ?? "Sin categoría"}
                    </td>

                    <td className="px-6 py-4 text-right font-medium">
                      {currency.format(Number(product.price))}
                    </td>

                    <td className="px-6 py-4 text-center">
                      {product.active ? (
                        <span className="text-sm font-medium">
                          Activo
                        </span>
                      ) : (
                        <span className="text-sm text-gray-500">
                          Inactivo
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No hay productos todavía.
            </div>
          )}
        </div>

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-gray-500">
              Página {page} de {pageCount}
            </span>

            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/products?page=${page - 1}`}
                  className="rounded-lg border px-3 py-2"
                >
                  Anterior
                </Link>
              )}

              {page < pageCount && (
                <Link
                  href={`/dashboard/products?page=${page + 1}`}
                  className="rounded-lg border px-3 py-2"
                >
                  Siguiente
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
