import Link from "next/link";
import { redirect } from "next/navigation";
import { getCartSummary } from "@/lib/cart";
import { requireStore } from "@/lib/storefront";
import { getCustomerSession } from "@/lib/customer-session";
import { getCustomerById } from "@/lib/customers";
import { formatMoney } from "@/lib/format";
import { resolveShipping } from "@/lib/settings";
import { CheckoutForm } from "@/components/store/CheckoutForm";

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await requireStore(slug);

  const cart = await getCartSummary(store.id);

  if (cart.items.length === 0) {
    redirect(`/tienda/${slug}/carrito`);
  }

  // Si hay cliente autenticado, rellenamos sus datos.
  // El envío se calcula igual aquí que al crear el pedido, para que el
  // comprador no vea un total distinto del que se le cobra.
  const shipping = resolveShipping(store, Number(cart.subtotal));
  const total = Number(cart.subtotal) + shipping;

  const session = await getCustomerSession(store.id);

  const customer = session
    ? await getCustomerById(store.id, session.customerId)
    : null;

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <Link
        href={`/tienda/${slug}/carrito`}
        className="text-sm text-gray-500 hover:text-black"
      >
        ← Volver al carrito
      </Link>

      <h1 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">Finalizar compra</h1>

      {!customer && (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
          Puedes comprar como invitado.{" "}
          <Link
            href={`/tienda/${slug}/cuenta/login?next=/tienda/${slug}/checkout`}
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Inicia sesión
          </Link>{" "}
          o{" "}
          <Link
            href={`/tienda/${slug}/cuenta/registro?next=/tienda/${slug}/checkout`}
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            crea una cuenta
          </Link>{" "}
          para seguir tus pedidos después.
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <CheckoutForm
          slug={slug}
          defaults={{
            name: customer?.name,
            email: customer?.email,
            phone: customer?.phone ?? undefined,
          }}
        />

        <aside className="h-fit rounded-xl border p-6">
          <h2 className="font-semibold">Resumen</h2>

          <ul className="mt-4 space-y-3">
            {cart.items.map((item) => (
              <li key={item.productId} className="flex justify-between text-sm">
                <span>
                  {item.name}
                  <span className="text-gray-500"> × {item.quantity}</span>
                </span>
                <span>{formatMoney(item.subtotal, store.currency)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 space-y-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Subtotal</span>
              <span>{formatMoney(cart.subtotal, store.currency)}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-slate-500">Envío</span>
              <span>
                {shipping === 0 ? (
                  <span className="font-medium text-emerald-600">Gratis</span>
                ) : (
                  formatMoney(shipping, store.currency)
                )}
              </span>
            </div>

            <div className="flex justify-between border-t pt-2 text-lg font-bold">
              <span>Total</span>
              <span>{formatMoney(total, store.currency)}</span>
            </div>
          </div>

          {shipping > 0 && store.freeShippingThreshold && (
            <p className="mt-3 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800">
              Te faltan{" "}
              {formatMoney(
                Number(store.freeShippingThreshold) - Number(cart.subtotal),
                store.currency,
              )}{" "}
              para tener envío gratis.
            </p>
          )}

          <p className="mt-4 text-xs text-gray-500">
            Las existencias se comprueban de nuevo al confirmar: si algún
            producto se agota mientras compras, te avisaremos antes de
            cobrar.
          </p>
        </aside>
      </div>
    </main>
  );
}
