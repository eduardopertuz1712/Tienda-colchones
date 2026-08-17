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
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Resumen de la plataforma
        </h1>

        <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2">
          <Link
            href="/super-admin/tiendas"
            className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50 sm:p-6"
          >
            <p className="text-sm text-slate-500">Tiendas</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {tenants.length}
            </p>
            <p className="mt-2 text-sm text-slate-500">Administrar →</p>
          </Link>

          <Link
            href="/super-admin/products"
            className="rounded-2xl border border-slate-200 p-5 transition hover:border-slate-300 hover:bg-slate-50 sm:p-6"
          >
            <p className="text-sm text-slate-500">Productos</p>
            <p className="mt-2 text-3xl font-bold tabular-nums">
              {products.total}
            </p>
            <p className="mt-2 text-sm text-slate-500">Administrar →</p>
          </Link>
        </div>
      </div>
    </main>
  );
}
