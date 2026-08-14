"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth-guards";
import { prisma } from "@/lib/prisma";
import { ACTIVE_TENANT_COOKIE } from "@/lib/tenant";

export async function selectTenant(formData: FormData) {
  await requireRole("SUPER_ADMIN");

  const tenantId = formData.get("tenantId");

  if (typeof tenantId !== "string" || !tenantId) {
    throw new Error("Tienda inválida.");
  }

  const tenant = await prisma.tenant.findUnique({
    where: {
      id: tenantId,
    },
    select: {
      id: true,
    },
  });

  if (!tenant) {
    throw new Error("Tienda inválida.");
  }

  const cookieStore = await cookies();

  cookieStore.set(ACTIVE_TENANT_COOKIE, tenant.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  redirect("/dashboard/products");
}
