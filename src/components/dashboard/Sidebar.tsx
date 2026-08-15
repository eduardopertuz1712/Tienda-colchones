import Link from "next/link";
import { signOut } from "@/auth";
import { can, isPlatformScoped, type Resource } from "@/lib/permissions";
import type { UserRole } from "@/generated/prisma/enums";

type NavItem = {
  href: string;
  label: string;
  resource: Resource | null;
};

const NAV: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", resource: null },
  { href: "/dashboard/orders", label: "Pedidos", resource: "order" },
  { href: "/dashboard/products", label: "Productos", resource: "product" },
  { href: "/dashboard/categories", label: "Categorías", resource: "category" },
  { href: "/dashboard/inventory", label: "Inventario", resource: "inventory" },
  { href: "/dashboard/customers", label: "Clientes", resource: "customer" },
  { href: "/dashboard/sales", label: "Ventas", resource: "sale" },
];

export function Sidebar({
  user,
  storeName,
}: {
  user: { name?: string | null; role: UserRole; tenantId: string | null };
  storeName: string | null;
}) {
  // El menú solo muestra lo que el rol puede ver. La página además
  // vuelve a comprobar el permiso: esto es cosmético, no seguridad.
  const items = NAV.filter(
    (item) => item.resource === null || can(user, "view", item.resource),
  );

  return (
    <aside className="flex w-60 shrink-0 flex-col border-r bg-gray-50">
      <div className="border-b p-5">
        <p className="text-sm font-semibold">{storeName ?? "Plataforma"}</p>
        <p className="mt-1 text-xs text-gray-500">{user.name}</p>
      </div>

      <nav className="flex-1 space-y-1 p-3">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-200"
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="space-y-1 border-t p-3">
        {isPlatformScoped(user.role) && (
          <>
            <Link
              href="/super-admin"
              className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-200"
            >
              Super Admin
            </Link>
            <Link
              href="/dashboard/select-tenant"
              className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-200"
            >
              Cambiar de tienda
            </Link>
          </>
        )}

        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/login" });
          }}
        >
          <button
            type="submit"
            className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-gray-200"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  );
}
