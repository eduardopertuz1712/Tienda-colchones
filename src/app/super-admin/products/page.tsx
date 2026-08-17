import Image from "next/image";
import Link from "next/link";
import { requirePlatformPermission } from "@/lib/auth-guards";
import { getAllProducts, getTenants } from "@/lib/catalog";

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
});

function buildHref(params: {
  page?: number;
  tenant?: string;
  q?: string;
}): string {
  const search = new URLSearchParams();

  if (params.tenant) search.set("tenant", params.tenant);
  if (params.q) search.set("q", params.q);
  if (params.page && params.page > 1) search.set("page", String(params.page));

  const query = search.toString();

  return query
    ? `/super-admin/products?${query}`
    : "/super-admin/products";
}

export default async function PlatformProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; tenant?: string; q?: string }>;
}) {
  await requirePlatformPermission("view", "product");

  const { page: pageParam, tenant, q } = await searchParams;

  const requestedPage = Number(pageParam);

  const [tenants, result] = await Promise.all([
    getTenants(),
    getAllProducts({
      page: Number.isFinite(requestedPage) ? requestedPage : 1,
      tenantId: tenant || undefined,
      query: q || undefined,
    }),
  ]);

  const { items, page, pageCount, total } = result;

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Productos</h1>

            <p className="mt-2 text-sm text-gray-500">
              {total} producto{total === 1 ? "" : "s"} en toda la
              plataforma.
            </p>
          </div>

          <Link
            href="/super-admin/products/new"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Nuevo producto
          </Link>
        </div>

        <form
          className="mt-6 flex flex-wrap gap-3 rounded-xl border p-4"
          action="/super-admin/products"
        >
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o SKU..."
            className="min-w-60 flex-1 rounded-lg border px-3 py-2 text-sm"
          />

          <select
            name="tenant"
            defaultValue={tenant ?? ""}
            className="rounded-lg border px-3 py-2 text-sm"
          >
            <option value="">Todas las tiendas</option>

            {tenants.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Filtrar
          </button>

          {(q || tenant) && (
            <Link
              href="/super-admin/products"
              className="rounded-lg px-4 py-2 text-sm text-gray-500 hover:text-black"
            >
              Limpiar
            </Link>
          )}
        </form>

        <div className="mt-6 overflow-x-auto rounded-xl border">
          <table className="w-full min-w-[36rem]">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm font-semibold">
                  Producto
                </th>

                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm font-semibold">
                  Tienda
                </th>

                <th className="px-4 py-3 sm:px-6 sm:py-4 text-left text-sm font-semibold">
                  SKU
                </th>

                <th className="px-4 py-3 sm:px-6 sm:py-4 text-right text-sm font-semibold">
                  Precio
                </th>

                <th className="px-4 py-3 sm:px-6 sm:py-4 text-center text-sm font-semibold">
                  Estado
                </th>

                <th className="px-4 py-3 sm:px-6 sm:py-4" />
              </tr>
            </thead>

            <tbody>
              {items.map((product) => {
                const primaryImage = product.images[0];

                return (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-4 py-3 sm:px-6 sm:py-4">
                      <div className="flex items-center gap-4">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
                          {primaryImage ? (
                            <Image
                              src={primaryImage.url}
                              alt={primaryImage.alt ?? product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                              Sin foto
                            </div>
                          )}
                        </div>

                        <div>
                          <p className="font-medium">{product.name}</p>

                          <p className="text-sm text-gray-500">
                            {product.category?.name ?? "Sin categoría"}
                          </p>
                        </div>
                      </div>
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm">
                      {product.tenant.name}
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-sm">{product.sku}</td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-right font-medium">
                      {currency.format(Number(product.price))}
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-center text-sm">
                      {product.active ? (
                        <span className="font-medium">Activo</span>
                      ) : (
                        <span className="text-gray-500">Inactivo</span>
                      )}
                    </td>

                    <td className="px-4 py-3 sm:px-6 sm:py-4 text-right">
                      <Link
                        href={`/super-admin/products/${product.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              {q || tenant
                ? "Ningún producto coincide con el filtro."
                : "No hay productos todavía."}
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
                  href={buildHref({ page: page - 1, tenant, q })}
                  className="rounded-lg border px-3 py-2"
                >
                  Anterior
                </Link>
              )}

              {page < pageCount && (
                <Link
                  href={buildHref({ page: page + 1, tenant, q })}
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
