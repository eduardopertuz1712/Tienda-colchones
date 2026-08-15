import Link from "next/link";
import { redirect } from "next/navigation";
import { getCartSummary } from "@/lib/cart";
import { requireStore } from "@/lib/storefront";
import { getCustomerSession } from "@/lib/customer-session";
import { getCustomerById } from "@/lib/customers";
import { formatMoney } from "@/lib/format";
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

      <h1 className="mt-4 text-3xl font-bold">Finalizar compra</h1>

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
                <span>{formatMoney(item.subtotal)}</span>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex justify-between border-t pt-4 text-lg font-bold">
            <span>Total</span>
            <span>{formatMoney(cart.subtotal)}</span>
          </div>

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
