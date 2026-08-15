import crypto from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { CatalogError } from "@/lib/catalog";

/**
 * Restablecimiento de contraseña por token de un solo uso.
 *
 * En la tabla solo se guarda el hash del token: quien lea la base de
 * datos no puede usarlo para entrar. El token en claro se devuelve una
 * única vez, al crearlo.
 */

const TOKEN_TTL_MINUTES = 60;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type ResetTarget =
  | { kind: "user"; userId: string }
  | { kind: "customer"; customerId: string };

export async function createResetToken(target: ResetTarget) {
  const token = crypto.randomBytes(32).toString("base64url");

  const expiresAt = new Date(Date.now() + TOKEN_TTL_MINUTES * 60 * 1000);

  // Un solo token vivo por persona: pedir otro invalida el anterior.
  await prisma.passwordResetToken.updateMany({
    where: {
      ...(target.kind === "user"
        ? { userId: target.userId }
        : { customerId: target.customerId }),
      usedAt: null,
    },
    data: { usedAt: new Date() },
  });

  await prisma.passwordResetToken.create({
    data: {
      ...(target.kind === "user"
        ? { userId: target.userId }
        : { customerId: target.customerId }),
      tokenHash: hashToken(token),
      expiresAt,
    },
  });

  return { token, expiresAt };
}

/**
 * Genera un token para el correo dado, si existe.
 *
 * Devuelve null cuando no hay cuenta, y quien llama debe responder lo
 * mismo en ambos casos: si el mensaje cambiara, el formulario serviría
 * para averiguar qué correos están registrados.
 */
export async function requestUserReset(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, active: true },
  });

  if (!user || !user.active) {
    return null;
  }

  return createResetToken({ kind: "user", userId: user.id });
}

export async function requestCustomerReset(tenantId: string, email: string) {
  const customer = await prisma.customer.findUnique({
    where: { tenantId_email: { tenantId, email: email.trim().toLowerCase() } },
    select: { id: true },
  });

  if (!customer) {
    return null;
  }

  return createResetToken({ kind: "customer", customerId: customer.id });
}

async function findValidToken(token: string) {
  const record = await prisma.passwordResetToken.findUnique({
    where: { tokenHash: hashToken(token) },
  });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    return null;
  }

  return record;
}

export async function isResetTokenValid(token: string): Promise<boolean> {
  return (await findValidToken(token)) !== null;
}

export async function resetPassword(token: string, password: string) {
  if (password.length < 8) {
    throw new CatalogError("La contraseña debe tener al menos 8 caracteres.");
  }

  const record = await findValidToken(token);

  if (!record) {
    throw new CatalogError(
      "Este enlace ya no es válido. Solicita uno nuevo.",
    );
  }

  const passwordHash = await bcrypt.hash(password, 12);

  // Marcar el token como usado y cambiar la clave van juntos: si algo
  // falla, no queremos un token consumido sin clave nueva.
  await prisma.$transaction(async (tx) => {
    const consumed = await tx.passwordResetToken.updateMany({
      where: { id: record.id, usedAt: null },
      data: { usedAt: new Date() },
    });

    // Si otra petición lo consumió primero, no seguimos.
    if (consumed.count === 0) {
      throw new CatalogError("Este enlace ya fue utilizado.");
    }

    if (record.userId) {
      await tx.user.update({
        where: { id: record.userId },
        data: { passwordHash },
      });
    } else if (record.customerId) {
      await tx.customer.update({
        where: { id: record.customerId },
        data: { passwordHash },
      });
    }
  });

  return record.userId ? ("user" as const) : ("customer" as const);
}
