import { CatalogError } from "@/lib/catalog";

/**
 * Lectura y saneado del FormData del producto. Compartido por el panel
 * del Owner y el del Super Admin: la validación de negocio vive en
 * `lib/catalog.ts`, aquí solo se normalizan los tipos.
 */
export function parseProductForm(formData: FormData) {
  const readText = (key: string): string => {
    const value = formData.get(key);

    return typeof value === "string" ? value.trim() : "";
  };

  const name = readText("name");
  const sku = readText("sku");
  const price = readText("price");

  if (!name || !sku || !price) {
    throw new CatalogError("Nombre, SKU y precio son obligatorios.");
  }

  const images = formData
    .getAll("images")
    .filter((value): value is File => value instanceof File && value.size > 0);

  const readInteger = (key: string, label: string): number => {
    const raw = readText(key);

    if (!raw) {
      return 0;
    }

    const parsed = Number(raw);

    if (!Number.isInteger(parsed) || parsed < 0) {
      throw new CatalogError(
        `${label} debe ser un entero mayor o igual a cero.`,
      );
    }

    return parsed;
  };

  return {
    name,
    sku,
    price,
    stock: readInteger("stock", "El stock"),
    minStock: readInteger("minStock", "El stock mínimo"),
    slug: readText("slug"),
    description: readText("description") || null,
    compareAtPrice: readText("compareAtPrice") || null,
    categoryId: readText("categoryId") || null,
    active: formData.get("active") === "on",
    images,
  };
}
