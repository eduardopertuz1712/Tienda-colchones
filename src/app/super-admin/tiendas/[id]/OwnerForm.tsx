"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormAlert } from "@/components/auth/fields";
import { assignOwnerAction, type TenantFormState } from "../actions";

const INITIAL: TenantFormState = { error: null, ok: null };

const INPUT =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold transition hover:bg-slate-50 disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Creando..." : "Crear propietario"}
    </button>
  );
}

export function OwnerForm({ tenantId }: { tenantId: string }) {
  const [state, formAction] = useActionState(assignOwnerAction, INITIAL);

  return (
    <form action={formAction} className="mt-5 space-y-5">
      <input type="hidden" name="tenantId" value={tenantId} />

      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.ok && <FormAlert tone="success">{state.ok}</FormAlert>}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="ownerName" className="mb-2 block text-sm font-medium">
            Nombre
          </label>
          <input id="ownerName" name="ownerName" required className={INPUT} />
        </div>

        <div>
          <label
            htmlFor="ownerEmail"
            className="mb-2 block text-sm font-medium"
          >
            Correo
          </label>
          <input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            required
            className={INPUT}
          />
        </div>

        <div className="sm:col-span-2">
          <label
            htmlFor="ownerPassword"
            className="mb-2 block text-sm font-medium"
          >
            Contraseña provisional
          </label>
          <input
            id="ownerPassword"
            name="ownerPassword"
            type="text"
            required
            minLength={8}
            className={INPUT}
          />
        </div>
      </div>

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
