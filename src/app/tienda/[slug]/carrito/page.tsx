import Image from "next/image";
import Link from "next/link";
import { getCartSummary } from "@/lib/cart";
import { requireStore } from "@/lib/storefront";
import { formatMoney } from "@/lib/format";
import {
  removeFromCartAction,
  updateCartItemAction,
} from "../actions";

export default async function CartPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await requireStore(slug);

  const cart = await getCartSummary(store.id);

  if (cart.items.length === 0) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16 text-center">
        <h1 className="text-2xl font-bold">Tu carrito está vacío</h1>
        <Link
          href={`/tienda/${slug}`}
          className="mt-6 inline-block rounded-lg bg-black px-5 py-3 text-sm font-medium text-white"
        >
          Ver productos
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tu carrito</h1>

      <ul className="mt-8 space-y-4">
        {cart.items.map((item) => (
          <li
            key={item.productId}
            className="flex flex-wrap items-center gap-4 rounded-xl border p-4"
          >
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg border bg-gray-100">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.name}
                  fill
                  className="object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-xs text-gray-400">
                  Sin foto
                </div>
              )}
            </div>

            <div className="min-w-40 flex-1">
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-gray-500">
                {formatMoney(item.unitPrice, store.currency)} c/u · SKU {item.sku}
              </p>
            </div>

            <form action={updateCartItemAction} className="flex gap-2">
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="productId" value={item.productId} />
              <input
                name="quantity"
                type="number"
                min="1"
                defaultValue={item.quantity}
                className="w-20 rounded-lg border px-2 py-1 text-sm"
              />
              <button
                type="submit"
                className="rounded-lg border px-3 py-1 text-sm"
              >
                Actualizar
              </button>
            </form>

            <p className="w-28 text-right font-medium">
              {formatMoney(item.subtotal, store.currency)}
            </p>

            <form action={removeFromCartAction}>
              <input type="hidden" name="slug" value={slug} />
              <input type="hidden" name="productId" value={item.productId} />
              <button
                type="submit"
                className="text-sm text-gray-500 hover:text-red-600"
              >
                Quitar
              </button>
            </form>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-col items-end gap-4 rounded-xl border p-6">
        <div className="flex w-full max-w-xs justify-between text-lg font-bold">
          <span>Subtotal</span>
          <span>{formatMoney(cart.subtotal, store.currency)}</span>
        </div>

        <p className="text-xs text-gray-500">
          El envío se calcula en el siguiente paso.
        </p>

        <Link
          href={`/tienda/${slug}/checkout`}
          className="rounded-lg bg-black px-6 py-3 font-medium text-white"
        >
          Continuar al pago
        </Link>
      </div>
    </main>
  );
}
