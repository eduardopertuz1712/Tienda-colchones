import { requireTenantPermission } from "@/lib/auth-guards";
import { getTeam, ROLE_LABELS } from "@/lib/users";
import { formatDate } from "@/lib/format";
import { NewMemberForm, ResetLinkForm } from "./TeamForms";
import { changeRoleAction, toggleActiveAction } from "./actions";

export default async function UsersPage() {
  const { tenantId, user } = await requireTenantPermission("view", "user");

  const team = await getTeam(tenantId);

  return (
    <main className="p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Equipo
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Da acceso a tus empleados con permisos limitados. Desactivar
          conserva el historial; eliminar lo perdería.
        </p>

        <div className="mt-6 sm:mt-8">
          <NewMemberForm />
        </div>

        {/* Tarjetas en vez de tabla: en un móvil una tabla de 4 columnas
            obliga a hacer scroll horizontal para llegar a las acciones. */}
        <ul className="mt-6 space-y-3 sm:mt-8">
          {team.map((member) => {
            const isSelf = member.id === user.id;
            const isOwner = member.role === "OWNER";

            return (
              <li
                key={member.id}
                className="rounded-2xl border border-slate-200 p-4 sm:p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium">
                      {member.name}
                      {isSelf && (
                        <span className="ml-2 text-xs text-slate-400">
                          (tú)
                        </span>
                      )}
                    </p>
                    <p className="truncate text-sm text-slate-500">
                      {member.email}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {ROLE_LABELS[member.role]} · desde{" "}
                      {formatDate(member.createdAt)}
                    </p>
                  </div>

                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium ${
                      member.active
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {member.active ? "Activo" : "Desactivado"}
                  </span>
                </div>

                {!isOwner && !isSelf && (
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-slate-100 pt-4">
                    {/* Los ADMIN heredados se pueden bajar a Empleado, pero
                        ya no se crean nuevos desde aquí. */}
                    {member.role !== "STAFF" && (
                      <form action={changeRoleAction}>
                        <input type="hidden" name="userId" value={member.id} />
                        <input type="hidden" name="role" value="STAFF" />
                        <button
                          type="submit"
                          className="text-sm font-medium hover:underline"
                        >
                          Convertir en empleado
                        </button>
                      </form>
                    )}

                    <form action={toggleActiveAction}>
                      <input type="hidden" name="userId" value={member.id} />
                      <input
                        type="hidden"
                        name="active"
                        value={member.active ? "false" : "true"}
                      />
                      <button
                        type="submit"
                        className="text-sm font-medium hover:underline"
                      >
                        {member.active ? "Desactivar" : "Reactivar"}
                      </button>
                    </form>

                    <ResetLinkForm userId={member.id} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </main>
  );
}
