"use server";

import { revalidatePath } from "next/cache";
import { authorizeTenantAction } from "@/lib/auth-guards";
import { CatalogError } from "@/lib/catalog";
import { createResetToken } from "@/lib/password-reset";
import {
  createTeamMember,
  setTeamMemberActive,
  updateTeamMemberRole,
} from "@/lib/users";

export type TeamFormState = { error: string | null; ok: string | null };

function read(formData: FormData, key: string): string {
  const value = formData.get(key);

  return typeof value === "string" ? value.trim() : "";
}

export async function createTeamMemberAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const { tenantId } = await authorizeTenantAction("create", "user");

  try {
    const member = await createTeamMember({
      tenantId,
      name: read(formData, "name"),
      email: read(formData, "email"),
      password: String(formData.get("password") ?? ""),
      role: read(formData, "role"),
    });

    revalidatePath("/dashboard/users");

    return { error: null, ok: `${member.name} ya puede iniciar sesión.` };
  } catch (error) {
    if (error instanceof CatalogError) {
      return { error: error.message, ok: null };
    }

    console.error("Error creando usuario:", error);

    return { error: "No se pudo crear el usuario.", ok: null };
  }
}

export async function changeRoleAction(formData: FormData) {
  const { tenantId } = await authorizeTenantAction("update", "user");

  await updateTeamMemberRole(
    tenantId,
    read(formData, "userId"),
    read(formData, "role"),
  );

  revalidatePath("/dashboard/users");
}

export async function toggleActiveAction(formData: FormData) {
  const { tenantId, user } = await authorizeTenantAction("update", "user");

  await setTeamMemberActive(
    tenantId,
    read(formData, "userId"),
    read(formData, "active") === "true",
    user.id,
  );

  revalidatePath("/dashboard/users");
}

/**
 * Genera un enlace de restablecimiento para un miembro del equipo. Es
 * lo que permite al Owner resolver un "olvidé mi contraseña" sin tocar
 * la base de datos.
 */
export async function issueResetLinkAction(
  _prev: TeamFormState,
  formData: FormData,
): Promise<TeamFormState> {
  const { tenantId } = await authorizeTenantAction("update", "user");

  const userId = read(formData, "userId");

  const { prisma } = await import("@/lib/prisma");

  const member = await prisma.user.findFirst({
    where: { id: userId, tenantId },
    select: { id: true, name: true },
  });

  if (!member) {
    return { error: "Usuario no encontrado.", ok: null };
  }

  const { token } = await createResetToken({ kind: "user", userId: member.id });

  return {
    error: null,
    ok: `Enlace para ${member.name}: /login/recuperar/${token}`,
  };
}
