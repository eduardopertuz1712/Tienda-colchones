import Link from "next/link";
import { signOut } from "@/auth";
import { can, isPlatformScoped, type Resource } from "@/lib/permissions";
import type { UserRole } from "@/generated/prisma/enums";
import { SidebarShell } from "./SidebarShell";

const NAV: Array<{ href: string; label: string; resource: Resource | null }> = [
  { href: "/dashboard", label: "Dashboard", resource: null },
  { href: "/dashboard/orders", label: "Pedidos", resource: "order" },
  { href: "/dashboard/products", label: "Productos", resource: "product" },
  { href: "/dashboard/categories", label: "Categorías", resource: "category" },
  { href: "/dashboard/customers", label: "Clientes", resource: "customer" },
  { href: "/dashboard/sales", label: "Ventas", resource: "sale" },
  { href: "/dashboard/users", label: "Equipo", resource: "user" },
];

export function Sidebar({
  user,
  storeName,
  children,
}: {
  user: {
    name?: string | null;
    role: UserRole;
    tenantId: string | null;
  };
  storeName: string | null;
  children: React.ReactNode;
}) {
  // El menú solo muestra lo que el rol puede ver. Cada página vuelve a
  // comprobarlo: esto es cosmético, no seguridad.
  const items = NAV.filter(
    (item) => item.resource === null || can(user, "view", item.resource),
  ).map(({ href, label }) => ({ href, label }));

  return (
    <SidebarShell
      items={items}
      storeName={storeName ?? "Plataforma"}
      userName={user.name ?? ""}
      footer={
        <>
          {isPlatformScoped(user.role) && (
            <>
              <Link
                href="/super-admin"
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
              >
                Super Admin
              </Link>
              <Link
                href="/dashboard/select-tenant"
                className="block rounded-lg px-3 py-2 text-sm text-slate-700 transition hover:bg-slate-200"
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
              className="w-full rounded-lg px-3 py-2 text-left text-sm text-slate-700 transition hover:bg-slate-200"
            >
              Cerrar sesión
            </button>
          </form>
        </>
      }
    >
      {children}
    </SidebarShell>
  );
}
