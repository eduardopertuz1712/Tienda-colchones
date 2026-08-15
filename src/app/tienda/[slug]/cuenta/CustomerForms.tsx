"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  Field,
  FormAlert,
  PasswordField,
  SubmitButton,
} from "@/components/auth/fields";
import {
  loginCustomerAction,
  registerCustomerAction,
  type AccountFormState,
} from "./actions";

const INITIAL: AccountFormState = { error: null };

function Submit({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <SubmitButton label={label} pendingLabel={pendingLabel} pending={pending} />
  );
}

export function CustomerLoginForm({
  slug,
  next,
}: {
  slug: string;
  next: string;
}) {
  const [state, formAction] = useActionState(loginCustomerAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="next" value={next} />

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Field
        id="email"
        label="Correo electrónico"
        type="email"
        required
        autoComplete="email"
        autoFocus
        placeholder="tucorreo@ejemplo.com"
      />

      <PasswordField
        id="password"
        label="Contraseña"
        required
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <Submit label="Entrar" pendingLabel="Entrando..." />
    </form>
  );
}

export function CustomerRegisterForm({
  slug,
  next,
}: {
  slug: string;
  next: string;
}) {
  const [state, formAction] = useActionState(registerCustomerAction, INITIAL);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="next" value={next} />

      {state.error && <FormAlert>{state.error}</FormAlert>}

      <Field
        id="name"
        label="Nombre completo"
        required
        autoComplete="name"
        autoFocus
        placeholder="Ana Pérez"
      />

      <Field
        id="email"
        label="Correo electrónico"
        type="email"
        required
        autoComplete="email"
        placeholder="tucorreo@ejemplo.com"
      />

      <Field
        id="phone"
        label="Teléfono"
        type="tel"
        autoComplete="tel"
        placeholder="300 000 0000"
        hint="Opcional. Lo usamos para coordinar la entrega."
      />

      <PasswordField
        id="password"
        label="Contraseña"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="••••••••"
        hint="Mínimo 8 caracteres."
      />

      <PasswordField
        id="passwordConfirm"
        label="Repite la contraseña"
        required
        minLength={8}
        autoComplete="new-password"
        placeholder="••••••••"
      />

      <Submit label="Crear cuenta" pendingLabel="Creando cuenta..." />
    </form>
  );
}
