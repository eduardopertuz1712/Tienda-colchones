import type { DefaultSession } from "next-auth";

type AppUserRole = "SUPER_ADMIN" | "OWNER" | "ADMIN" | "STAFF";

declare module "next-auth" {
  interface User {
    role: AppUserRole;
    tenantId: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: AppUserRole;
      tenantId: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppUserRole;
    tenantId?: string | null;
  }
}