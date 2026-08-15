"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  Field,
  FormAlert,
  PasswordField,
  SubmitButton,
} from "@/components/auth/fields";

export function LoginForm({ callbackUrl }: { callbackUrl: string }) {
  const router = useRouter();

  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);

    setError("");
    setPending(true);

    const result = await signIn("credentials", {
      email: String(formData.get("email") ?? ""),
      password: String(formData.get("password") ?? ""),
      redirect: false,
    });

    if (!result || result.error) {
      setError("Correo electrónico o contraseña incorrectos.");
      setPending(false);
      return;
    }

    // Volvemos a donde el usuario quería ir antes de que el proxy lo
    // mandara al login, no siempre al dashboard.
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <FormAlert>{error}</FormAlert>}

      <Field
        id="email"
        label="Correo electrónico"
        type="email"
        required
        autoComplete="email"
        autoFocus
        placeholder="tucorreo@tienda.com"
        disabled={pending}
      />

      <PasswordField
        id="password"
        label="Contraseña"
        required
        autoComplete="current-password"
        placeholder="••••••••"
        disabled={pending}
      />

      <SubmitButton
        label="Entrar al panel"
        pendingLabel="Verificando..."
        pending={pending}
      />
    </form>
  );
}
