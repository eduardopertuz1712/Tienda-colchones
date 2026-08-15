import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const stores = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      _count: { select: { products: true } },
    },
  });

  return (
    <main className="min-h-screen bg-white text-slate-900">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
          <span className="flex items-center gap-3 font-bold tracking-tight">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900 text-sm text-white">
              T
            </span>
            Tienda
          </span>

          <Link
            href="/login"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Acceso administradores
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-20">
        <h1 className="max-w-2xl text-5xl font-bold leading-tight tracking-tight">
          Compra en las tiendas de la plataforma
        </h1>

        <p className="mt-4 max-w-xl text-lg text-slate-500">
          Cada tienda tiene su propio catálogo, su inventario y sus
          pedidos.
        </p>

        {stores.length === 0 ? (
          <p className="mt-16 text-slate-500">
            Todavía no hay tiendas publicadas.
          </p>
        ) : (
          <ul className="mt-14 grid gap-4 sm:grid-cols-2">
            {stores.map((store) => (
              <li key={store.id}>
                <Link
                  href={`/tienda/${store.slug}`}
                  className="group flex items-center gap-4 rounded-2xl border border-slate-200 p-6 transition hover:border-slate-900 hover:shadow-sm"
                >
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-lg font-bold text-white">
                    {store.name.charAt(0).toUpperCase()}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{store.name}</span>
                    <span className="block text-sm text-slate-500">
                      {store._count.products} producto(s)
                    </span>
                  </span>

                  <span className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-900">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
