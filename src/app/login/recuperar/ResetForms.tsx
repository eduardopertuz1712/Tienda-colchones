"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Field,
  FormAlert,
  PasswordField,
  SubmitButton,
} from "@/components/auth/fields";
import {
  requestResetAction,
  resetPasswordAction,
  type ResetPasswordState,
  type ResetRequestState,
} from "./actions";

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <SubmitButton label={label} pendingLabel={pendingLabel} pending={pending} />
  );
}

const REQUEST_INITIAL: ResetRequestState = {
  error: null,
  sent: false,
  devLink: null,
};

export function RequestResetForm() {
  const [state, formAction] = useActionState(
    requestResetAction,
    REQUEST_INITIAL,
  );

  if (state.sent) {
    return (
      <div className="space-y-4">
        <FormAlert tone="success">
          Si existe una cuenta con ese correo, te enviamos un enlace para
          restablecer la contraseña. Caduca en 1 hora.
        </FormAlert>

        {state.devLink && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm">
            <p className="font-medium text-amber-900">
              Modo desarrollo: no hay servidor de correo configurado.
            </p>
            <Link
              href={state.devLink}
              className="mt-2 block break-all font-mono text-xs text-amber-800 underline"
            >
              {state.devLink}
            </Link>
          </div>
        )}

        <Link
          href="/login"
          className="block text-center text-sm font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Field
        id="email"
        label="Correo electrónico"
        type="email"
        required
        autoFocus
        autoComplete="email"
        placeholder="tucorreo@tienda.com"
      />

      <Submit label="Enviar enlace" pendingLabel="Enviando..." />
    </form>
  );
}

const RESET_INITIAL: ResetPasswordState = { error: null };

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction] = useActionState(
    resetPasswordAction,
    RESET_INITIAL,
  );

  // error === null tras un envío significa que se cambió correctamente.
  const done = state.error === null && state !== RESET_INITIAL;

  if (done) {
    return (
      <div className="space-y-5">
        <FormAlert tone="success">
          Tu contraseña se cambió correctamente.
        </FormAlert>

        <Link
          href="/login"
          className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Iniciar sesión
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="token" value={token} />

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <PasswordField
        id="password"
        label="Nueva contraseña"
        required
        minLength={8}
        autoFocus
        autoComplete="new-password"
        hint="Mínimo 8 caracteres."
      />

      <PasswordField
        id="passwordConfirm"
        label="Repite la contraseña"
        required
        minLength={8}
        autoComplete="new-password"
      />

      <Submit label="Cambiar contraseña" pendingLabel="Guardando..." />
    </form>
  );
}
