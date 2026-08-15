"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Field, FormAlert, PasswordField, SubmitButton } from "@/components/auth/fields";
import {
  createTeamMemberAction,
  issueResetLinkAction,
  type TeamFormState,
} from "./actions";

const INITIAL: TeamFormState = { error: null, ok: null };

const INPUT =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return <SubmitButton label={label} pendingLabel={pendingLabel} pending={pending} />;
}

export function NewMemberForm() {
  const [state, formAction] = useActionState(createTeamMemberAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5 rounded-2xl border border-slate-200 p-6">
      <h2 className="font-semibold">Añadir a alguien al equipo</h2>

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.ok && <FormAlert tone="success">{state.ok}</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <Field id="name" label="Nombre" required placeholder="Juan Gómez" />
        <Field id="email" label="Correo" type="email" required placeholder="juan@tienda.com" />

        <div>
          <label htmlFor="role" className="mb-2 block text-sm font-medium text-slate-700">
            Rol
          </label>
          <select id="role" name="role" defaultValue="STAFF" className={INPUT}>
            <option value="STAFF">Empleado — pedidos e inventario</option>
            <option value="ADMIN">Administrador — todo menos usuarios y ajustes</option>
          </select>
        </div>

        <PasswordField
          id="password"
          label="Contraseña inicial"
          required
          minLength={8}
          autoComplete="new-password"
          hint="Mínimo 8 caracteres. Podrá cambiarla después."
        />
      </div>

      <div className="flex justify-end">
        <div className="w-48">
          <Submit label="Crear usuario" pendingLabel="Creando..." />
        </div>
      </div>
    </form>
  );
}

export function ResetLinkForm({ userId }: { userId: string }) {
  const [state, formAction] = useActionState(issueResetLinkAction, INITIAL);

  return (
    <form action={formAction}>
      <input type="hidden" name="userId" value={userId} />

      <button
        type="submit"
        className="text-sm text-slate-500 underline-offset-2 hover:text-slate-900 hover:underline"
      >
        Generar enlace de recuperación
      </button>

      {state.ok && (
        <p className="mt-2 break-all rounded-lg bg-slate-100 p-2 font-mono text-xs">
          {state.ok}
        </p>
      )}
      {state.error && (
        <p className="mt-2 text-xs text-red-600">{state.error}</p>
      )}
    </form>
  );
}
