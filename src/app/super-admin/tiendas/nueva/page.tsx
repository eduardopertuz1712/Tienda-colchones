import { requirePlatformPermission } from "@/lib/auth-guards";
import { NewTenantForm } from "./NewTenantForm";

export default async function NewTenantPage() {
  await requirePlatformPermission("create", "tenant");

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Nueva tienda
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Crea la tienda y, si quieres, la cuenta de su propietario.
        </p>

        <NewTenantForm />
      </div>
    </main>
  );
}
