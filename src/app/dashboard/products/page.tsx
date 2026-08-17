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
  const { tenantId, user } = await requireTenantPermission("view", "product");

  const { page: pageParam } = await searchParams;

  const requestedPage = Number(pageParam);

  const { items, page, pageCount, total } = await getProducts(tenantId, {
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
  });

  const canCreate = can(user, "create", "product");
  const canEdit = can(user, "update", "product");

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Productos
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              {total === 0
                ? "Administra los productos de tu tienda."
                : `${total} producto${total === 1 ? "" : "s"} en tu tienda.`}
            </p>
          </div>

          {canCreate && (
            <Link
              href="/dashboard/products/new"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Nuevo producto
            </Link>
          )}
        </div>

        {items.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed border-slate-300 p-12 text-center text-sm text-slate-500 sm:mt-8">
            No hay productos todavía.
          </div>
        ) : (
          /* Tarjetas y no tabla: en un móvil las cinco columnas obligan a
             desplazarse en horizontal para ver el precio. */
          <ul className="mt-6 grid gap-3 sm:mt-8 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((product) => {
              const primaryImage = product.images[0];

              const card = (
                <div className="flex h-full gap-4 rounded-2xl border border-slate-200 p-3 transition hover:border-slate-300 hover:bg-slate-50 sm:p-4">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100">
                    {primaryImage ? (
                      <Image
                        src={primaryImage.url}
                        alt={primaryImage.alt ?? product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                        Sin foto
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="truncate font-medium">{product.name}</p>

                      {!product.active && (
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                          Inactivo
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 truncate text-xs text-slate-500">
                      {product.sku} · {product.category?.name ?? "Sin categoría"}
                    </p>

                    <p className="mt-2 font-semibold tabular-nums">
                      {currency.format(Number(product.price))}
                    </p>
                  </div>
                </div>
              );

              return (
                <li key={product.id}>
                  {canEdit ? (
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="block h-full"
                    >
                      {card}
                    </Link>
                  ) : (
                    card
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {pageCount > 1 && (
          <div className="mt-6 flex items-center justify-between text-sm">
            <span className="text-slate-500">
              Página {page} de {pageCount}
            </span>

            <div className="flex gap-2">
              {page > 1 && (
                <Link
                  href={`/dashboard/products?page=${page - 1}`}
                  className="rounded-xl border border-slate-200 px-3 py-2"
                >
                  Anterior
                </Link>
              )}

              {page < pageCount && (
                <Link
                  href={`/dashboard/products?page=${page + 1}`}
                  className="rounded-xl border border-slate-200 px-3 py-2"
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
