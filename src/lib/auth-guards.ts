import { auth } from "@/auth";
import { redirect } from "next/navigation";

export async function requireAuth() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return session;
}

export async function requireRole(
  ...allowedRoles: Array<"SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF">
) {
  const session = await requireAuth();

  if (!allowedRoles.includes(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireTenant() {
  const session = await requireAuth();

  if (!session.user.tenantId) {
    redirect("/dashboard");
  }

  return {
    session,
    tenantId: session.user.tenantId,
  };
}