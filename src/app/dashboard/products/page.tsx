import { requireTenant } from "@/lib/auth-guards";
import { getProducts } from "@/lib/catalog";

export default async function ProductsPage() {
  const { tenantId } = await requireTenant();

  const products = await getProducts(tenantId);

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">
              Productos
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              Administra los productos de tu tienda.
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
          >
            Nuevo producto
          </button>
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
              {products.map((product) => (
                <tr
                  key={product.id}
                  className="border-b last:border-0"
                >
                  <td className="px-6 py-4">
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
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {product.sku}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    {product.category?.name ?? "Sin categoría"}
                  </td>

                  <td className="px-6 py-4 text-right font-medium">
                    ${product.price.toString()}
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
              ))}
            </tbody>
          </table>

          {products.length === 0 && (
            <div className="p-12 text-center text-gray-500">
              No hay productos todavía.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}