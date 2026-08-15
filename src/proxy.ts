import { NextResponse } from "next/server";
import { auth } from "@/auth";

/**
 * Primera línea de defensa: ninguna ruta protegida se renderiza sin
 * sesión. Los guards de cada página siguen siendo obligatorios (aquí
 * no se comprueba la propiedad de los recursos), pero esto evita que
 * olvidar un guard deje una ruta completamente abierta.
 *
 * `/uploads` NO está aquí: la tienda pública muestra fotos a compradores
 * sin sesión. Ese control vive en la propia ruta, que sirve sin sesión
 * solo las imágenes de productos publicados.
 */
const PROTECTED_PREFIXES = ["/dashboard", "/super-admin"];

function isProtected(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

export default auth((request) => {
  const { pathname, search } = request.nextUrl;

  if (!isProtected(pathname)) {
    return NextResponse.next();
  }

  if (!request.auth?.user) {
    const loginUrl = new URL("/login", request.nextUrl);

    loginUrl.searchParams.set("callbackUrl", `${pathname}${search}`);

    return NextResponse.redirect(loginUrl);
  }

  if (
    pathname.startsWith("/super-admin") &&
    request.auth.user.role !== "SUPER_ADMIN"
  ) {
    return NextResponse.redirect(new URL("/dashboard", request.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    // Todo excepto rutas de auth, estáticos y metadatos.
    "/((?!api/auth|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
