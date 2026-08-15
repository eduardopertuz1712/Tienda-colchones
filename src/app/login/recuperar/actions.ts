"use server";

import { headers } from "next/headers";
import { CatalogError } from "@/lib/catalog";
import { requestUserReset, resetPassword } from "@/lib/password-reset";

export type ResetRequestState = {
  error: string | null;
  sent: boolean;
  /** Enlace mostrado en pantalla mientras no haya servidor de correo. */
  devLink: string | null;
};

export type ResetPasswordState = { error: string | null };

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function requestResetAction(
  _prev: ResetRequestState,
  formData: FormData,
): Promise<ResetRequestState> {
  const email = read(formData, "email");

  if (!email) {
    return { error: "Escribe tu correo electrónico.", sent: false, devLink: null };
  }

  const result = await requestUserReset(email);

  // Se responde igual exista o no la cuenta: si el mensaje cambiara,
  // este formulario serviría para averiguar qué correos están dados de
  // alta en la plataforma.
  if (!result) {
    return { error: null, sent: true, devLink: null };
  }

  const host = (await headers()).get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";

  const link = `${protocol}://${host}/login/recuperar/${result.token}`;

  // TODO: enviar por correo. Sin proveedor configurado, se registra en
  // el servidor y se muestra en pantalla solo fuera de producción.
  console.log(`[reset] Enlace para ${email}: ${link}`);

  return {
    error: null,
    sent: true,
    devLink: process.env.NODE_ENV === "production" ? null : link,
  };
}

export async function resetPasswordAction(
  _prev: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const token = read(formData, "token");
  const password = String(formData.get("password") ?? "");

  if (password !== String(formData.get("passwordConfirm") ?? "")) {
    return { error: "Las contraseñas no coinciden." };
  }

  try {
    await resetPassword(token, password);
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message };
    }

    console.error("Error restableciendo contraseña:", error);

    return { error: "No se pudo cambiar la contraseña." };
  }

  return { error: null };
}
