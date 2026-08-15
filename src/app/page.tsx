import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function HomePage() {
  const stores = await prisma.tenant.findMany({
    where: { status: "ACTIVE" },
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true },
  });

  return (
    <main className="mx-auto max-w-4xl px-6 py-16">
      <h1 className="text-4xl font-bold">Tiendas</h1>
      <p className="mt-3 text-gray-600">
        Plataforma de comercio electrónico multi-tienda.
      </p>

      {stores.length === 0 ? (
        <p className="mt-10 text-gray-500">
          Todavía no hay tiendas publicadas.
        </p>
      ) : (
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {stores.map((store) => (
            <li key={store.id}>
              <Link
                href={`/tienda/${store.slug}`}
                className="block rounded-xl border p-6 hover:shadow-md"
              >
                <p className="text-lg font-semibold">{store.name}</p>
                <p className="mt-1 text-sm text-gray-500">/{store.slug}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-16 border-t pt-8">
        <Link href="/login" className="text-sm hover:underline">
          Acceso para administradores →
        </Link>
      </div>
    </main>
  );
}
