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

  return {
    name,
    sku,
    price,
    slug: readText("slug"),
    description: readText("description") || null,
    compareAtPrice: readText("compareAtPrice") || null,
    categoryId: readText("categoryId") || null,
    active: formData.get("active") === "on",
    images,
  };
}
