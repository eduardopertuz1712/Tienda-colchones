"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  PRODUCT_FORM_INITIAL_STATE,
  type ProductFormAction,
} from "./form-state";

type Category = {
  id: string;
  name: string;
};

export type ProductFormValues = {
  name: string;
  slug: string;
  sku: string;
  price: string;
  compareAtPrice: string;
  stock: string;
  minStock: string;
  description: string;
  categoryId: string;
  active: boolean;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Guardando..." : label}
    </button>
  );
}

export function ProductForm({
  action,
  categories,
  values,
  cancelHref,
  submitLabel = "Guardar",
  showActive = false,
  showStock = true,
  showInitialStock = true,
  imagesHint,
  hiddenFields,
}: {
  action: ProductFormAction;
  categories: Category[];
  values?: Partial<ProductFormValues>;
  cancelHref: string;
  submitLabel?: string;
  showActive?: boolean;
  showStock?: boolean;
  /** El saldo solo se fija al crear; después cambia vía movimientos. */
  showInitialStock?: boolean;
  imagesHint?: string;
  /** Contexto que la action necesita (tenantId, productId...). */
  hiddenFields?: Record<string, string>;
}) {
  const [state, formAction] = useActionState(
    action,
    PRODUCT_FORM_INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-6 rounded-xl border p-6">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

      {state.error && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <div>
        <label htmlFor="name" className="mb-2 block text-sm font-medium">
          Nombre
        </label>

        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={values?.name}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Camiseta básica"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-2 block text-sm font-medium">
          Slug
        </label>

        <input
          id="slug"
          name="slug"
          type="text"
          defaultValue={values?.slug}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="camiseta-basica"
        />

        <p className="mt-2 text-xs text-gray-500">
          Opcional: si lo dejas vacío se genera a partir del nombre.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="sku" className="mb-2 block text-sm font-medium">
            SKU
          </label>

          <input
            id="sku"
            name="sku"
            type="text"
            required
            defaultValue={values?.sku}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="CAM-004"
          />
        </div>

        <div>
          <label
            htmlFor="categoryId"
            className="mb-2 block text-sm font-medium"
          >
            Categoría
          </label>

          <select
            id="categoryId"
            name="categoryId"
            defaultValue={values?.categoryId ?? ""}
            className="w-full rounded-lg border px-3 py-2"
          >
            <option value="">Sin categoría</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="price" className="mb-2 block text-sm font-medium">
            Precio
          </label>

          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={values?.price}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="45000"
          />
        </div>

        <div>
          <label
            htmlFor="compareAtPrice"
            className="mb-2 block text-sm font-medium"
          >
            Precio anterior
          </label>

          <input
            id="compareAtPrice"
            name="compareAtPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={values?.compareAtPrice}
            className="w-full rounded-lg border px-3 py-2"
            placeholder="Opcional"
          />
        </div>

        {showStock && showInitialStock && (
          <div>
            <label htmlFor="stock" className="mb-2 block text-sm font-medium">
              Stock inicial
            </label>

            <input
              id="stock"
              name="stock"
              type="number"
              min="0"
              step="1"
              defaultValue={values?.stock ?? "0"}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        )}

        {showStock && (
          <div>
            <label
              htmlFor="minStock"
              className="mb-2 block text-sm font-medium"
            >
              Stock mínimo
            </label>

            <input
              id="minStock"
              name="minStock"
              type="number"
              min="0"
              step="1"
              defaultValue={values?.minStock ?? "0"}
              className="w-full rounded-lg border px-3 py-2"
            />

            <p className="mt-2 text-xs text-gray-500">
              Avisa cuando el stock baje de este valor.
            </p>
          </div>
        )}
      </div>

      <div>
        <label htmlFor="images" className="mb-2 block text-sm font-medium">
          Imágenes
        </label>

        <input
          id="images"
          name="images"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          className="w-full rounded-lg border px-3 py-2"
        />

        <p className="mt-2 text-xs text-gray-500">
          {imagesHint ??
            "Puedes seleccionar hasta 5 imágenes. Máximo 5 MB por imagen."}
        </p>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Descripción
        </label>

        <textarea
          id="description"
          name="description"
          rows={5}
          defaultValue={values?.description}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Descripción del producto..."
        />
      </div>

      {showActive && (
        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            name="active"
            value="on"
            defaultChecked={values?.active ?? true}
            className="h-4 w-4"
          />
          Producto activo
        </label>
      )}

      <div className="flex justify-end gap-3">
        <Link
          href={cancelHref}
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </Link>

        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
