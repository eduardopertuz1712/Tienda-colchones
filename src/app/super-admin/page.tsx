import Link from "next/link";
import { requirePlatformPermission } from "@/lib/auth-guards";
import { getAllProducts, getTenants } from "@/lib/catalog";

export default async function SuperAdminPage() {
  await requirePlatformPermission("view", "product");

  const [tenants, products] = await Promise.all([
    getTenants(),
    getAllProducts({ pageSize: 1 }),
  ]);

  return (
    <main className="p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">
          Resumen de la plataforma
        </h1>

        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border p-6">
            <p className="text-sm text-gray-500">Tiendas</p>
            <p className="mt-2 text-3xl font-bold">{tenants.length}</p>
          </div>

          <Link
            href="/super-admin/products"
            className="rounded-xl border p-6 hover:bg-gray-50"
          >
            <p className="text-sm text-gray-500">Productos</p>
            <p className="mt-2 text-3xl font-bold">{products.total}</p>
            <p className="mt-2 text-sm text-gray-500">Administrar →</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
