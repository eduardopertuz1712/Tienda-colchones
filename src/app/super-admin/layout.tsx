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
      <header className="border-b">
        <div className="mx-auto flex max-w-6xl items-center gap-6 px-8 py-4">
          <Link href="/super-admin" className="font-semibold">
            Super Admin
          </Link>

          <nav className="flex gap-4 text-sm text-gray-600">
            <Link href="/super-admin/products" className="hover:text-black">
              Productos
            </Link>

            <Link href="/dashboard" className="hover:text-black">
              Ir al panel de tienda
            </Link>
          </nav>
        </div>
      </header>

      {children}
    </div>
  );
}
