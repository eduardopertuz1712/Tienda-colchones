import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPlatformScoped } from "@/lib/permissions";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/**
 * Decide si una imagen puede servirse y con qué caché.
 *
 * - Pública: pertenece a un producto activo de una tienda activa, es
 *   decir, ya está expuesta en el catálogo público.
 * - Privada: cualquier otra (producto despublicado, tienda suspendida).
 *   Requiere sesión del propio tenant, o SUPER_ADMIN.
 */
async function authorize(
  url: string,
  tenantSegment: string,
): Promise<"public" | "private" | "denied"> {
  const image = await prisma.productImage.findFirst({
    where: {
      url,
      product: {
        tenantId: tenantSegment,
        active: true,
        tenant: { status: "ACTIVE" },
      },
    },
    select: { id: true },
  });

  if (image) {
    return "public";
  }

  const session = await auth();

  if (!session?.user) {
    return "denied";
  }

  if (
    isPlatformScoped(session.user.role) ||
    session.user.tenantId === tenantSegment
  ) {
    return "private";
  }

  return "denied";
}

export async function GET(
  _request: Request,
  context: {
    params: Promise<{
      path: string[];
    }>;
  },
) {
  const { path: filePathParts } = await context.params;

  if (!filePathParts || filePathParts.length === 0) {
    return new Response("Archivo no encontrado", { status: 404 });
  }

  // Las rutas tienen la forma tenants/<tenantId>/products/<id>/<archivo>.
  const [scope, tenantSegment] = filePathParts;

  if (scope !== "tenants" || !tenantSegment) {
    return new Response("Ruta no permitida", { status: 403 });
  }

  const relativePath = filePathParts.join("/");

  const normalizedPath = path.normalize(relativePath);

  if (
    normalizedPath.startsWith("..") ||
    normalizedPath.includes(`..${path.sep}`)
  ) {
    return new Response("Ruta no permitida", { status: 403 });
  }

  const extension = path.extname(normalizedPath).toLowerCase();

  const contentType = CONTENT_TYPES[extension];

  if (!contentType) {
    return new Response("Tipo de archivo no permitido", { status: 415 });
  }

  const visibility = await authorize(`/uploads/${relativePath}`, tenantSegment);

  if (visibility === "denied") {
    return new Response("No autorizado", { status: 403 });
  }

  const absolutePath = path.join(UPLOADS_DIR, normalizedPath);

  try {
    const file = await readFile(absolutePath);

    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control":
          visibility === "public"
            ? "public, max-age=31536000, immutable"
            : "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      return new Response("Archivo no encontrado", { status: 404 });
    }

    console.error("Error leyendo archivo:", error);

    return new Response("Error interno del servidor", { status: 500 });
  }
}
