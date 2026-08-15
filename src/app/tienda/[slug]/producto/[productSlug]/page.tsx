import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getStoreProduct, requireStore } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";
import { AddToCartForm } from "@/components/store/AddToCartForm";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string; productSlug: string }>;
}) {
  const { slug, productSlug } = await params;

  const store = await requireStore(slug);

  const product = await getStoreProduct(store.id, productSlug);

  if (!product) {
    notFound();
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href={`/tienda/${slug}`}
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Volver al catálogo
      </Link>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div>
          <div className="relative aspect-square overflow-hidden rounded-xl border bg-gray-100">
            {product.images[0] ? (
              <Image
                src={product.images[0].url}
                alt={product.images[0].alt ?? product.name}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Sin foto
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="mt-3 flex gap-3">
              {product.images.slice(1).map((image) => (
                <div
                  key={image.id}
                  className="relative h-20 w-20 overflow-hidden rounded-lg border bg-gray-100"
                >
                  <Image
                    src={image.url}
                    alt={image.alt ?? product.name}
                    fill
                    className="object-cover"
                    sizes="80px"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.category && (
            <p className="text-sm text-gray-500">{product.category.name}</p>
          )}

          <h1 className="mt-1 text-3xl font-bold">{product.name}</h1>

          <div className="mt-4 flex items-baseline gap-3">
            <span className="text-2xl font-bold">
              {formatMoney(product.price)}
            </span>
            {product.compareAtPrice && (
              <span className="text-lg text-gray-400 line-through">
                {formatMoney(product.compareAtPrice)}
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-6 whitespace-pre-line text-gray-600">
              {product.description}
            </p>
          )}

          <div className="mt-8">
            <AddToCartForm
              slug={slug}
              productId={product.id}
              stock={product.stock}
            />
          </div>

          <p className="mt-4 text-xs text-gray-500">SKU: {product.sku}</p>
        </div>
      </div>
    </main>
  );
}
