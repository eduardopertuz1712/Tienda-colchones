import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

/** Cada cuánto se revalidan rol y tenant contra la base de datos. */
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

export const { handlers, signIn, signOut, auth } = NextAuth({
  // Necesario fuera de Vercel: sin esto Auth.js rechaza el host en
  // producción con UntrustedHost y el login deja de funcionar.
  trustHost: true,

  providers: [
    Credentials({
      name: "Credenciales",

      credentials: {
        email: {
          label: "Correo electrónico",
          type: "email",
        },
        password: {
          label: "Contraseña",
          type: "password",
        },
      },

      async authorize(credentials) {
        if (
          typeof credentials?.email !== "string" ||
          typeof credentials?.password !== "string"
        ) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user) {
          return null;
        }

        const passwordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash,
        );

        if (!passwordValid) {
          return null;
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          tenantId: user.tenantId,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 8,
  },

  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.refreshedAt = Date.now();

        return token;
      }

      // El rol y el tenant pueden cambiar mientras la sesión sigue viva
      // (el Super Admin administra usuarios). Sin esto, un token viejo
      // conservaría permisos revocados hasta expirar.
      const fresh =
        typeof token.refreshedAt === "number" &&
        Date.now() - token.refreshedAt < REFRESH_INTERVAL_MS;

      if (fresh && trigger !== "update") {
        return token;
      }

      if (typeof token.sub !== "string") {
        return null;
      }

      const dbUser = await prisma.user.findUnique({
        where: {
          id: token.sub,
        },
        select: {
          role: true,
          tenantId: true,
        },
      });

      if (!dbUser) {
        // Usuario eliminado: invalidamos la sesión.
        return null;
      }

      token.role = dbUser.role;
      token.tenantId = dbUser.tenantId;
      token.refreshedAt = Date.now();

      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        if (typeof token.sub === "string") {
          session.user.id = token.sub;
        }

        if (
          token.role === "SUPER_ADMIN" ||
          token.role === "OWNER" ||
          token.role === "ADMIN" ||
          token.role === "STAFF"
        ) {
          session.user.role = token.role;
        }

        if (
          token.tenantId === null ||
          typeof token.tenantId === "string"
        ) {
          session.user.tenantId = token.tenantId;
        }
      }

      return session;
    },
  },
});