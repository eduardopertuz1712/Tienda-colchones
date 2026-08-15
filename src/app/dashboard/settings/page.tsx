import { requireTenantPermission } from "@/lib/auth-guards";
import { getSettings } from "@/lib/settings";
import { SettingsForm } from "./SettingsForm";

export default async function SettingsPage() {
  const { tenantId } = await requireTenantPermission("update", "settings");

  const settings = await getSettings(tenantId);

  return (
    <main className="p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight">Configuración</h1>
        <p className="mt-2 text-sm text-slate-500">
          Tu tienda pública está en{" "}
          <code className="rounded bg-slate-100 px-1.5 py-0.5 text-xs">
            /tienda/{settings.slug}
          </code>
        </p>

        <div className="mt-8">
          <SettingsForm
            settings={{
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
