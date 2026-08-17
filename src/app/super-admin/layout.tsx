import Link from "next/link";
import { requireRole } from "@/lib/auth-guards";

export default async function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Segunda capa: el proxy ya bloquea /super-admin, pero el layout no
  // debe depender de que el proxy exista.
  await requireRole("SUPER_ADMIN");

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/super-admin" className="font-semibold">
            Super Admin
          </Link>

          <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
            <Link href="/super-admin/tiendas" className="hover:text-slate-900">
              Tiendas
            </Link>

            <Link href="/super-admin/products" className="hover:text-slate-900">
              Productos
            </Link>

            <Link href="/dashboard" className="hover:text-slate-900">
              Ir al panel de tienda
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
