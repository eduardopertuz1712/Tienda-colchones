"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { createProductAction, type ProductFormState } from "./actions";

type Category = {
  id: string;
  name: string;
};

const INITIAL_STATE: ProductFormState = {
  error: null,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Creando..." : "Crear producto"}
    </button>
  );
}

export function ProductForm({ categories }: { categories: Category[] }) {
  const [state, formAction] = useActionState(
    createProductAction,
    INITIAL_STATE,
  );

  return (
    <form action={formAction} className="space-y-6 rounded-xl border p-6">
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
          className="w-full rounded-lg border px-3 py-2"
          placeholder="camiseta-basica"
        />

        <p className="mt-2 text-xs text-gray-500">
          Opcional: si lo dejas vacío se genera a partir del nombre.
        </p>
      </div>

      <div>
        <label htmlFor="sku" className="mb-2 block text-sm font-medium">
          SKU
        </label>

        <input
          id="sku"
          name="sku"
          type="text"
          required
          className="w-full rounded-lg border px-3 py-2"
          placeholder="CAM-004"
        />
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
          className="w-full rounded-lg border px-3 py-2"
          placeholder="45000"
        />
      </div>

      <div>
        <label htmlFor="categoryId" className="mb-2 block text-sm font-medium">
          Categoría
        </label>

        <select
          id="categoryId"
          name="categoryId"
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
          Puedes seleccionar hasta 5 imágenes. Máximo 5 MB por imagen.
        </p>
      </div>

      <div>
        <label
          htmlFor="description"
          className="mb-2 block text-sm font-medium"
        >
          Descripción
        </label>

        <textarea
          id="description"
          name="description"
          rows={5}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Descripción del producto..."
        />
      </div>

      <div className="flex justify-end gap-3">
        <a
          href="/dashboard/products"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </a>

        <SubmitButton />
      </div>
    </form>
  );
}
