import Link from "next/link";
import { notFound } from "next/navigation";
import { requirePlatformPermission } from "@/lib/auth-guards";
import { getTenant, STATUS_LABELS } from "@/lib/tenants";
import { getSettings } from "@/lib/settings";
import { StoreSettingsForm } from "@/components/settings/StoreSettingsForm";
import { selectTenant } from "@/app/dashboard/select-tenant/actions";
import { changeTenantStatusAction, updateTenantSettingsAction } from "../actions";
import { OwnerForm } from "./OwnerForm";
import type { TenantStatus } from "@/generated/prisma/enums";

const STATUS_ACTIONS: { status: TenantStatus; label: string }[] = [
  { status: "ACTIVE", label: "Activar" },
  { status: "SUSPENDED", label: "Suspender" },
  { status: "INACTIVE", label: "Desactivar" },
];

export default async function TenantDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePlatformPermission("update", "tenant");

  const { id } = await params;

  const tenant = await getTenant(id);

  if (!tenant) {
    notFound();
  }

  const settings = await getSettings(tenant.id);

  const owner = tenant.users[0];

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/super-admin/tiendas"
          className="text-sm text-slate-500 hover:text-slate-900"
        >
          ← Tiendas
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {tenant.name}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              <Link
                href={`/tienda/${tenant.slug}`}
                className="hover:text-slate-900 hover:underline"
              >
                /tienda/{tenant.slug}
              </Link>{" "}
              · {STATUS_LABELS[tenant.status]}
            </p>
          </div>

          {/* Entrar a la tienda: cambia el tenant activo del Super Admin. */}
          <form action={selectTenant}>
            <input type="hidden" name="tenantId" value={tenant.id} />
            <button
              type="submit"
              className="rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Entrar al panel
            </button>
          </form>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          {[
            { label: "Productos", value: tenant._count.products },
            { label: "Pedidos", value: tenant._count.orders },
            { label: "Clientes", value: tenant._count.customers },
          ].map((card) => (
            <div
              key={card.label}
              className="rounded-2xl border border-slate-200 p-4"
            >
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className="mt-1 text-xl font-bold tabular-nums">
                {card.value}
              </p>
            </div>
          ))}
        </div>

        <section className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h2 className="font-semibold">Propietario</h2>

          {owner ? (
            <p className="mt-2 text-sm text-slate-600">
              {owner.name} · {owner.email}
              {!owner.active && " (inactivo)"}
            </p>
          ) : (
            <>
              <p className="mt-1 text-sm text-slate-500">
                Esta tienda no tiene propietario. Créalo para que pueda
                entrar a su panel.
              </p>
              <OwnerForm tenantId={tenant.id} />
            </>
          )}
        </section>

        <section className="mt-6 rounded-2xl border border-slate-200 p-4 sm:p-6">
          <h2 className="font-semibold">Estado</h2>
          <p className="mt-1 text-sm text-slate-500">
            Una tienda suspendida deja de ser visible para los compradores,
            pero conserva todos sus datos.
          </p>

          <div className="mt-4 flex flex-wrap gap-2">
            {STATUS_ACTIONS.filter((item) => item.status !== tenant.status).map(
              (item) => (
                <form key={item.status} action={changeTenantStatusAction}>
                  <input type="hidden" name="tenantId" value={tenant.id} />
                  <input type="hidden" name="status" value={item.status} />
                  <button
                    type="submit"
                    className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium transition hover:bg-slate-50"
                  >
                    {item.label}
                  </button>
                </form>
              ),
            )}
          </div>
        </section>

        <div className="mt-6">
          <h2 className="text-lg font-semibold">Configuración</h2>
          <p className="mt-1 mb-5 text-sm text-slate-500">
            Identidad, contacto y envío de esta tienda.
          </p>

          <StoreSettingsForm
            tenantId={tenant.id}
            action={updateTenantSettingsAction}
            values={{
              name: settings.name,
              description: settings.description ?? "",
              primaryColor: settings.primaryColor,
              currency: settings.currency,
              email: settings.email ?? "",
              phone: settings.phone ?? "",
              address: settings.address ?? "",
              instagramUrl: settings.instagramUrl ?? "",
              facebookUrl: settings.facebookUrl ?? "",
              whatsapp: settings.whatsapp ?? "",
              shippingCost: settings.shippingCost.toString(),
              freeShippingThreshold:
                settings.freeShippingThreshold?.toString() ?? "",
            }}
          />
        </div>
      </div>
    </main>
  );
}
