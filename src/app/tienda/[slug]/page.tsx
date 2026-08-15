import Image from "next/image";
import Link from "next/link";
import {
  getStoreCategories,
  getStoreProducts,
  requireStore,
} from "@/lib/storefront";
import { formatMoney } from "@/lib/format";

export default async function StorePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ categoria?: string; q?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { categoria, q, page: pageParam } = await searchParams;

  const store = await requireStore(slug);

  const requested = Number(pageParam);

  const [categories, result] = await Promise.all([
    getStoreCategories(store.id),
    getStoreProducts(store.id, {
      categorySlug: categoria,
      query: q,
      page: Number.isFinite(requested) ? requested : 1,
    }),
  ]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-10">
      <form className="flex flex-wrap gap-3" action={`/tienda/${slug}`}>
        <input
          type="search"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Buscar productos..."
          className="min-w-60 flex-1 rounded-lg border px-3 py-2 text-sm"
        />
        <select
          name="categoria"
          defaultValue={categoria ?? ""}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {category.name}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white"
        >
          Buscar
        </button>
      </form>

      {result.items.length === 0 ? (
        <p className="mt-16 text-center text-gray-500">
          No hay productos disponibles.
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {result.items.map((product) => {
            const image = product.images[0];
            const soldOut = product.stock <= 0;

            return (
              <Link
                key={product.id}
                href={`/tienda/${slug}/producto/${product.slug}`}
                className="group rounded-xl border p-4 hover:shadow-md"
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {image ? (
                    <Image
                      src={image.url}
                      alt={image.alt ?? product.name}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 50vw, 25vw"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm text-gray-400">
                      Sin foto
                    </div>
                  )}
                </div>

                <p className="mt-3 font-medium">{product.name}</p>

                {product.category && (
                  <p className="text-xs text-gray-500">
                    {product.category.name}
                  </p>
                )}

                <div className="mt-2 flex items-baseline gap-2">
                  <span className="font-bold">
                    {formatMoney(product.price, store.currency)}
                  </span>
                  {product.compareAtPrice && (
                    <span className="text-sm text-gray-400 line-through">
                      {formatMoney(product.compareAtPrice, store.currency)}
                    </span>
                  )}
                </div>

                {soldOut && (
                  <p className="mt-2 text-xs font-medium text-red-600">
                    Agotado
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}

      {result.pageCount > 1 && (
        <div className="mt-10 flex justify-center gap-2 text-sm">
          {result.page > 1 && (
            <Link
              href={`/tienda/${slug}?page=${result.page - 1}`}
              className="rounded-lg border px-3 py-2"
            >
              Anterior
            </Link>
          )}
          <span className="px-3 py-2 text-gray-500">
            Página {result.page} de {result.pageCount}
          </span>
          {result.page < result.pageCount && (
            <Link
              href={`/tienda/${slug}?page=${result.page + 1}`}
              className="rounded-lg border px-3 py-2"
            >
              Siguiente
            </Link>
          )}
        </div>
      )}
    </main>
  );
}
