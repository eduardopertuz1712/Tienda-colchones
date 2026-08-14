import { mkdir, unlink, writeFile } from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

const URL_PREFIX = "/uploads/";

/**
 * Tipo MIME permitido -> extensión en disco. Es la única fuente de
 * verdad: si un tipo está aquí, tiene extensión garantizada.
 */
const ALLOWED_TYPES: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/webp": ".webp",
  "image/gif": ".gif",
};

const MAX_FILE_SIZE = 5 * 1024 * 1024;

export async function uploadProductImage(
  file: File,
  tenantId: string,
  productId: string,
) {
  const extension = ALLOWED_TYPES[file.type];

  if (!extension) {
    throw new Error("Tipo de imagen no permitido");
  }

  if (file.size <= 0) {
    throw new Error("La imagen está vacía");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("La imagen no puede superar los 5 MB");
  }

  const filename = `${crypto.randomUUID()}${extension}`;

  const relativeDirectory = path.join(
    "tenants",
    tenantId,
    "products",
    productId,
  );

  const directory = path.join(UPLOADS_DIR, relativeDirectory);

  await mkdir(directory, {
    recursive: true,
  });

  const buffer = Buffer.from(await file.arrayBuffer());

  const filePath = path.join(directory, filename);

  await writeFile(filePath, buffer);

  return {
    filename,
    url: `${URL_PREFIX}${relativeDirectory.replaceAll(path.sep, "/")}/${filename}`,
    path: filePath,
  };
}

export async function deleteProductImage(filePath: string) {
  try {
    await unlink(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }
}

/**
 * Convierte una URL pública almacenada en ProductImage.url de vuelta a
 * la ruta en disco, verificando que no se escape del directorio de
 * subidas. Devuelve null si la URL no corresponde a un archivo nuestro.
 */
export function resolveUploadPath(url: string): string | null {
  if (!url.startsWith(URL_PREFIX)) {
    return null;
  }

  const relative = path.normalize(url.slice(URL_PREFIX.length));

  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    return null;
  }

  const absolute = path.join(UPLOADS_DIR, relative);

  if (!absolute.startsWith(UPLOADS_DIR + path.sep)) {
    return null;
  }

  return absolute;
}

/** Borra del disco los archivos de una lista de URLs, sin lanzar. */
export async function deleteProductImagesByUrl(urls: string[]) {
  await Promise.all(
    urls.map(async (url) => {
      const filePath = resolveUploadPath(url);

      if (!filePath) {
        return;
      }

      try {
        await deleteProductImage(filePath);
      } catch (error) {
        console.error("No se pudo borrar la imagen:", url, error);
      }
    }),
  );
}
