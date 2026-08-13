import { requireAuth } from "@/lib/auth-guards";

export default async function DashboardPage() {
  const session = await requireAuth();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-3xl font-bold">
          Dashboard
        </h1>

        <div className="mt-6 rounded-xl border p-6">
          <h2 className="text-xl font-semibold">
            Bienvenido, {session.user.name}
          </h2>

          <div className="mt-4 space-y-2 text-sm">
            <p>
              <strong>Email:</strong>{" "}
              {session.user.email}
            </p>

            <p>
              <strong>Rol:</strong>{" "}
              {session.user.role}
            </p>

            <p>
              <strong>Tenant:</strong>{" "}
              {session.user.tenantId ?? "Plataforma"}
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}