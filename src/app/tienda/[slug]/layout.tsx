import Link from "next/link";
import { requireStore } from "@/lib/storefront";
import { getCartSummary } from "@/lib/cart";
import { getCustomerSession } from "@/lib/customer-session";
import { getCustomerById } from "@/lib/customers";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await requireStore(slug);

  const [cart, session] = await Promise.all([
    getCartSummary(store.id),
    getCustomerSession(store.id),
  ]);

  const customer = session
    ? await getCustomerById(store.id, session.customerId)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
          <Link
            href={`/tienda/${slug}`}
            className="flex items-center gap-3 text-lg font-bold tracking-tight"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold text-white">
              {store.name.charAt(0).toUpperCase()}
            </span>
            {store.name}
          </Link>

          <nav className="flex items-center gap-2 text-sm">
            <Link
              href={`/tienda/${slug}`}
              className="hidden rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100 sm:block"
            >
              Productos
            </Link>

            {customer ? (
              <Link
                href={`/tienda/${slug}/cuenta`}
                className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100"
              >
                {customer.name.split(" ")[0]}
              </Link>
            ) : (
              <Link
                href={`/tienda/${slug}/cuenta/login`}
                className="rounded-lg px-3 py-2 text-slate-600 transition hover:bg-slate-100"
              >
                Entrar
              </Link>
            )}

            <Link
              href={`/tienda/${slug}/carrito`}
              className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-800"
            >
              Carrito
              {cart.count > 0 && (
                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-xs font-bold text-slate-900">
                  {cart.count}
                </span>
              )}
            </Link>
          </nav>
        </div>
      </header>

      <div className="flex-1">{children}</div>

      <footer className="mt-16 border-t border-slate-200 py-8">
        <p className="text-center text-sm text-slate-500">{store.name}</p>
      </footer>
    </div>
  );
}
