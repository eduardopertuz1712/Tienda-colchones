"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";

const STORAGE_KEY = "sidebar-collapsed";

type NavItem = { href: string; label: string };

/**
 * La preferencia de menú plegado vive en localStorage, que es un almacén
 * externo a React: se lee con useSyncExternalStore en vez de copiarla a
 * un estado desde un efecto. Así el servidor pinta siempre desplegado y
 * el navegador corrige tras hidratar, sin desajuste ni salto visible.
 */
const listeners = new Set<() => void>();

let cached: boolean | null = null;

function subscribe(onChange: () => void) {
  listeners.add(onChange);

  return () => {
    listeners.delete(onChange);
  };
}

function getCollapsedSnapshot(): boolean {
  if (cached === null) {
    cached = window.localStorage.getItem(STORAGE_KEY) === "1";
  }

  return cached;
}

function getServerSnapshot(): boolean {
  return false;
}

function storeCollapsed(value: boolean) {
  cached = value;

  window.localStorage.setItem(STORAGE_KEY, value ? "1" : "0");

  for (const listener of listeners) {
    listener();
  }
}

/**
 * Navegación del panel.
 *
 * - En móvil es un panel deslizante que abre el botón hamburguesa y se
 *   cierra al navegar, porque ocupa toda la pantalla.
 * - En escritorio se puede plegar a solo iconos, y esa preferencia se
 *   guarda en el navegador para que no haya que repetirla en cada visita.
 */
export function SidebarShell({
  items,
  storeName,
  userName,
  footer,
  children,
}: {
  items: NavItem[];
  storeName: string;
  userName: string;
  footer: React.ReactNode;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);

  const collapsed = useSyncExternalStore(
    subscribe,
    getCollapsedSnapshot,
    getServerSnapshot,
  );

  // Al cambiar de página cerramos el panel móvil. Se ajusta durante el
  // render y no en un efecto, para no pintar el panel abierto sobre la
  // página nueva antes de cerrarlo.
  const [lastPath, setLastPath] = useState(pathname);

  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  // Escape cierra el panel móvil.
  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const isActive = (href: string) =>
    href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  const width = collapsed ? "lg:w-16" : "lg:w-60";

  return (
    <div className="flex min-h-screen bg-white">
      {/* Barra superior, solo en móvil */}
      <header className="fixed inset-x-0 top-0 z-30 flex h-14 items-center gap-3 border-b border-slate-200 bg-white px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          aria-expanded={open}
          className="-ml-2 rounded-lg p-2 text-slate-600 transition hover:bg-slate-100"
        >
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <span className="truncate font-semibold">{storeName}</span>
      </header>

      {/* Fondo oscuro del panel móvil */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-64 shrink-0 flex-col border-r border-slate-200 bg-slate-50 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0 lg:transition-[width] ${width} ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex h-14 items-center justify-between gap-2 border-b border-slate-200 px-3 lg:h-auto lg:flex-col lg:items-stretch lg:gap-1 lg:py-4">
          {!collapsed && (
            <div className="min-w-0 px-2">
              <p className="truncate text-sm font-semibold">{storeName}</p>
              <p className="truncate text-xs text-slate-500">{userName}</p>
            </div>
          )}

          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-200 lg:hidden"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-3">
          {items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`block truncate rounded-lg px-3 py-2 text-sm transition ${
                isActive(item.href)
                  ? "bg-slate-900 font-medium text-white"
                  : "text-slate-700 hover:bg-slate-200"
              } ${collapsed ? "lg:px-2 lg:text-center" : ""}`}
            >
              {collapsed ? (
                <>
                  <span className="lg:hidden">{item.label}</span>
                  <span className="hidden lg:inline">
                    {item.label.charAt(0)}
                  </span>
                </>
              ) : (
                item.label
              )}
            </Link>
          ))}
        </nav>

        <div className="space-y-1 border-t border-slate-200 p-3">
          {footer}

          {/* Plegar es solo de escritorio: en móvil el panel ya se cierra. */}
          <button
            type="button"
            onClick={() => storeCollapsed(!collapsed)}
            className="hidden w-full rounded-lg px-3 py-2 text-left text-sm text-slate-500 transition hover:bg-slate-200 lg:block"
          >
            {collapsed ? "»" : "« Plegar menú"}
          </button>
        </div>
      </aside>

      {/* pt-14 deja sitio a la barra superior móvil */}
      <div className="min-w-0 flex-1 pt-14 lg:pt-0">{children}</div>
    </div>
  );
}
