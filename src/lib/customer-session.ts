import crypto from "crypto";
import { cookies } from "next/headers";

/**
 * Sesión de comprador, separada por completo de la del panel.
 *
 * Un Customer pertenece a UNA tienda, así que la sesión guarda también
 * el tenant: si el mismo navegador entra a otra tienda de la plataforma,
 * la sesión no aplica y se comporta como invitado.
 *
 * Es una cookie firmada con HMAC en vez de un JWT completo porque solo
 * necesita transportar dos ids y una expiración.
 */

const COOKIE = "customer_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type CustomerSession = {
  customerId: string;
  tenantId: string;
  exp: number;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET;

  if (!secret) {
    throw new Error("Falta AUTH_SECRET para firmar la sesión de cliente.");
  }

  return secret;
}

function sign(payload: string): string {
  return crypto
    .createHmac("sha256", getSecret())
    .update(payload)
    .digest("base64url");
}

function encode(session: CustomerSession): string {
  const payload = Buffer.from(JSON.stringify(session)).toString("base64url");

  return `${payload}.${sign(payload)}`;
}

function decode(value: string): CustomerSession | null {
  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expected = sign(payload);

  // Comparación en tiempo constante: evita distinguir firmas por timing.
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);

  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(payload, "base64url").toString("utf8"),
    ) as CustomerSession;

    if (
      typeof parsed.customerId !== "string" ||
      typeof parsed.tenantId !== "string" ||
      typeof parsed.exp !== "number" ||
      parsed.exp < Date.now()
    ) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export async function startCustomerSession(
  customerId: string,
  tenantId: string,
) {
  const cookieStore = await cookies();

  cookieStore.set(
    COOKIE,
    encode({
      customerId,
      tenantId,
      exp: Date.now() + MAX_AGE_SECONDS * 1000,
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: MAX_AGE_SECONDS,
    },
  );
}

export async function endCustomerSession() {
  const cookieStore = await cookies();

  cookieStore.delete(COOKIE);
}

/** Devuelve el cliente autenticado para ESTA tienda, o null. */
export async function getCustomerSession(
  tenantId: string,
): Promise<CustomerSession | null> {
  const cookieStore = await cookies();

  const raw = cookieStore.get(COOKIE)?.value;

  if (!raw) {
    return null;
  }

  const session = decode(raw);

  if (!session || session.tenantId !== tenantId) {
    return null;
  }

  return session;
}
