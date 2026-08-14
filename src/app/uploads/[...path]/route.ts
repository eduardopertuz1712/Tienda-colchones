import { readFile } from "fs/promises";
import path from "path";
import { auth } from "@/auth";
import { isPlatformScoped } from "@/lib/permissions";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const CONTENT_TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

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
    return new Response("Archivo no encontrado", {
      status: 404,
    });
  }

  const session = await auth();

  if (!session?.user) {
    return new Response("No autenticado", {
      status: 401,
    });
  }

  // Las rutas tienen la forma tenants/<tenantId>/products/<productId>/<archivo>.
  // El segmento del tenant debe coincidir con el del usuario: los UUID de
  // la ruta no son un control de acceso.
  const [scope, tenantSegment] = filePathParts;

  if (scope !== "tenants" || !tenantSegment) {
    return new Response("Ruta no permitida", {
      status: 403,
    });
  }

  if (
    !isPlatformScoped(session.user.role) &&
    tenantSegment !== session.user.tenantId
  ) {
    return new Response("Ruta no permitida", {
      status: 403,
    });
  }

  const relativePath = filePathParts.join("/");

  const normalizedPath = path.normalize(relativePath);

  if (
    normalizedPath.startsWith("..") ||
    normalizedPath.includes(`..${path.sep}`)
  ) {
    return new Response("Ruta no permitida", {
      status: 403,
    });
  }

  const absolutePath = path.join(UPLOADS_DIR, normalizedPath);

  const extension = path.extname(absolutePath).toLowerCase();

  const contentType = CONTENT_TYPES[extension];

  if (!contentType) {
    return new Response("Tipo de archivo no permitido", {
      status: 415,
    });
  }

  try {
    const file = await readFile(absolutePath);

    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        // Privado: la respuesta depende de la sesión, no debe quedar
        // en cachés compartidas.
        "Cache-Control": "private, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;

    if (code === "ENOENT") {
      return new Response("Archivo no encontrado", {
        status: 404,
      });
    }

    console.error("Error leyendo archivo:", error);

    return new Response("Error interno del servidor", {
      status: 500,
    });
  }
}
