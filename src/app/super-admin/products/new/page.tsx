import Link from "next/link";
import { requirePlatformPermission } from "@/lib/auth-guards";
import { getCategories, getTenants } from "@/lib/catalog";
import { ProductForm } from "@/components/products/ProductForm";
import { createProductAsPlatform } from "../actions";

export default async function NewPlatformProductPage({
  searchParams,
}: {
  searchParams: Promise<{ tenant?: string }>;
}) {
  await requirePlatformPermission("create", "product");

  const { tenant: tenantParam } = await searchParams;

  const tenants = await getTenants();

  const tenant = tenantParam
    ? tenants.find((item) => item.id === tenantParam)
    : undefined;

  return (
    <main className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/super-admin/products"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Volver a productos
          </Link>

          <h1 className="mt-4 text-3xl font-bold">Nuevo producto</h1>

          <p className="mt-2 text-sm text-gray-500">
            {tenant
              ? `Se creará en la tienda ${tenant.name}.`
              : "Elige primero en qué tienda quieres crearlo."}
          </p>
        </div>

        {/*
          La tienda se elige antes que el formulario porque las
          categorías disponibles dependen de ella. Así el select de
          categorías solo puede contener categorías de esa tienda.
        */}
        {!tenant ? (
          tenants.length === 0 ? (
            <div className="rounded-xl border p-12 text-center text-gray-500">
              Todavía no hay tiendas creadas.
            </div>
          ) : (
            <ul className="space-y-3">
              {tenants.map((item) => (
                <li key={item.id}>
                  <Link
                    href={`/super-admin/products/new?tenant=${item.id}`}
                    className="flex items-center justify-between rounded-xl border p-4 hover:bg-gray-50"
                  >
                    <span>
                      <span className="block font-medium">{item.name}</span>
                      <span className="block text-sm text-gray-500">
                        /{item.slug}
                      </span>
                    </span>

                    <span className="text-sm text-gray-500">Elegir →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ProductForm
            action={createProductAsPlatform}
            categories={await getCategories(tenant.id)}
            cancelHref="/super-admin/products"
            submitLabel="Crear producto"
            hiddenFields={{ tenantId: tenant.id }}
          />
        )}
      </div>
    </main>
  );
}
