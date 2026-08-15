import { requireTenantPermission } from "@/lib/auth-guards";
import { getTeam, ROLE_LABELS } from "@/lib/users";
import { formatDate } from "@/lib/format";
import { NewMemberForm, ResetLinkForm } from "./TeamForms";
import { changeRoleAction, toggleActiveAction } from "./actions";

export default async function UsersPage() {
  const { tenantId, user } = await requireTenantPermission("view", "user");

  const team = await getTeam(tenantId);

  return (
    <main className="p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold tracking-tight">Equipo</h1>
        <p className="mt-2 text-sm text-slate-500">
          Da acceso a tus empleados con permisos limitados. Desactivar
          conserva el historial; eliminar lo perdería.
        </p>

        <div className="mt-8">
          <NewMemberForm />
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full">
            <thead className="border-b bg-slate-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold">Persona</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Rol</th>
                <th className="px-6 py-4 text-left text-sm font-semibold">Estado</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {team.map((member) => {
                const isSelf = member.id === user.id;
                const isOwner = member.role === "OWNER";

                return (
                  <tr key={member.id} className="border-b last:border-0 align-top">
                    <td className="px-6 py-4">
                      <p className="font-medium">
                        {member.name}
                        {isSelf && (
                          <span className="ml-2 text-xs text-slate-400">(tú)</span>
                        )}
                      </p>
                      <p className="text-sm text-slate-500">{member.email}</p>
                      <p className="mt-1 text-xs text-slate-400">
                        Desde {formatDate(member.createdAt)}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      {isOwner ? (
                        <span className="text-sm">{ROLE_LABELS[member.role]}</span>
                      ) : (
                        <form action={changeRoleAction} className="flex gap-2">
                          <input type="hidden" name="userId" value={member.id} />
                          <select
                            name="role"
                            defaultValue={member.role}
                            className="rounded-lg border border-slate-200 px-2 py-1 text-sm"
                          >
                            <option value="ADMIN">Administrador</option>
                            <option value="STAFF">Empleado</option>
                          </select>
                          <button
                            type="submit"
                            className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                          >
                            Cambiar
                          </button>
                        </form>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-sm ${member.active ? "text-emerald-700" : "text-slate-400"}`}
                      >
                        {member.active ? "Activo" : "Desactivado"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      {!isOwner && !isSelf && (
                        <div className="space-y-2">
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
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}
