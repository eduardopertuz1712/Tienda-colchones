import Link from "next/link";
import { requireStore } from "@/lib/storefront";
import { getCartSummary } from "@/lib/cart";

export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await requireStore(slug);

  const cart = await getCartSummary(store.id);

  return (
    <div className="min-h-screen">
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href={`/tienda/${slug}`} className="text-lg font-bold">
            {store.name}
          </Link>

          <nav className="flex items-center gap-4 text-sm">
            <Link href={`/tienda/${slug}`} className="hover:underline">
              Productos
            </Link>
            <Link
              href={`/tienda/${slug}/carrito`}
              className="rounded-lg border px-3 py-2 font-medium"
            >
              Carrito ({cart.count})
            </Link>
          </nav>
        </div>
      </header>

      {children}

      <footer className="mt-16 border-t py-8">
        <p className="text-center text-sm text-gray-500">
          {store.name}
        </p>
      </footer>
    </div>
  );
}
