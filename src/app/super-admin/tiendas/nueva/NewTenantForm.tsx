"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormAlert } from "@/components/auth/fields";
import { createTenantAction, type TenantFormState } from "../actions";

const INITIAL: TenantFormState = { error: null, ok: null };

const INPUT =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function Submit() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60 sm:w-auto"
    >
      {pending ? "Creando..." : "Crear tienda"}
    </button>
  );
}

export function NewTenantForm() {
  const [state, formAction] = useActionState(createTenantAction, INITIAL);

  return (
    <form action={formAction} className="mt-8 space-y-6">
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <section className="rounded-2xl border border-slate-200 p-4 sm:p-6">
        <h2 className="font-semibold">La tienda</h2>

        <div className="mt-5 space-y-5">
          <div>
            <label htmlFor="name" className="mb-2 block text-sm font-medium">
              Nombre
            </label>
            <input
              id="name"
              name="name"
              required
              className={INPUT}
              placeholder="Moda Urbana"
            />
          </div>

          <div>
            <label htmlFor="slug" className="mb-2 block text-sm font-medium">
              Enlace público
            </label>
            <input
              id="slug"
              name="slug"
              className={INPUT}
              placeholder="moda-urbana"
            />
            <p className="mt-2 text-xs text-slate-400">
              Opcional: si lo dejas vacío se genera desde el nombre. Quedará
              como /tienda/moda-urbana
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-200 p-4 sm:p-6">
        <h2 className="font-semibold">Su propietario</h2>
        <p className="mt-1 text-sm text-slate-500">
          Opcional: puedes crearlo ahora o más tarde desde la ficha de la
          tienda.
        </p>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ownerName"
              className="mb-2 block text-sm font-medium"
            >
              Nombre
            </label>
            <input id="ownerName" name="ownerName" className={INPUT} />
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
              className={INPUT}
              placeholder="Mínimo 8 caracteres"
            />
            <p className="mt-2 text-xs text-slate-400">
              Compártela con el propietario para que entre y la cambie.
            </p>
          </div>
        </div>
      </section>

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Link
          href="/super-admin/tiendas"
          className="rounded-xl border border-slate-200 px-5 py-2.5 text-center text-sm font-semibold transition hover:bg-slate-50"
        >
          Cancelar
        </Link>

        <Submit />
      </div>
    </form>
  );
}
