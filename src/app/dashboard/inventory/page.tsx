import Link from "next/link";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getProducts } from "@/lib/catalog";

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const { tenantId } = await requireTenantPermission("view", "inventory");

  const { page: pageParam, q } = await searchParams;

  const requested = Number(pageParam);

  const { items, page, pageCount, total } = await getProducts(tenantId, {
    page: Number.isFinite(requested) ? requested : 1,
    query: q || undefined,
  });

  return (
    <main className="p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">Inventario</h1>
        <p className="mt-2 text-sm text-gray-500">
          {total} producto(s). El stock solo cambia mediante movimientos,
          para que siempre se sepa por qué.
        </p>

        <form className="mt-6 flex gap-3" action="/dashboard/inventory">
          <input
            type="search"
            name="q"
            defaultValue={q ?? ""}
            placeholder="Buscar por nombre o SKU..."
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg border px-4 py-2 text-sm font-medium"
          >
            Buscar
          </button>
        </form>

        <div className="mt-6 overflow-hidden rounded-xl border">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  Producto
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold">
                  SKU
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Stock
                </th>
                <th className="px-6 py-4 text-right text-sm font-semibold">
                  Mínimo
                </th>
                <th className="px-6 py-4" />
              </tr>
            </thead>

            <tbody>
              {items.map((product) => {
                const low = product.stock <= product.minStock;

                return (
                  <tr key={product.id} className="border-b last:border-0">
                    <td className="px-6 py-4 font-medium">{product.name}</td>
                    <td className="px-6 py-4 text-sm">{product.sku}</td>
                    <td
                      className={`px-6 py-4 text-right font-medium ${low ? "text-red-600" : ""}`}
                    >
                      {product.stock}
                    </td>
                    <td className="px-6 py-4 text-right text-sm text-gray-500">
                      {product.minStock}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/dashboard/inventory/${product.id}`}
                        className="text-sm font-medium hover:underline"
                      >
                        Movimientos
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {items.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No hay productos.
            </div>
          )}
        </div>

        {pageCount > 1 && (
          <div className="mt-6 flex justify-between text-sm">
            <span className="text-gray-500">
              Página {page} de {pageCount}
            </span>
            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/inventory?page=${page - 1}`}
                  className="rounded-lg border px-3 py-2"
                >
                  Anterior
                </Link>
              )}
              {page < pageCount && (
                <Link
                  href={`/dashboard/inventory?page=${page + 1}`}
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
