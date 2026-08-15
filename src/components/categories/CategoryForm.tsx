"use client";

import Link from "next/link";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { CategoryFormState } from "@/app/dashboard/categories/actions";

type Option = { id: string; name: string };

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

export function CategoryForm({
  action,
  parents,
  values,
  submitLabel,
  hiddenFields,
}: {
  action: (
    state: CategoryFormState,
    formData: FormData,
  ) => Promise<CategoryFormState>;
  parents: Option[];
  values?: { name?: string; slug?: string; description?: string; parentId?: string };
  submitLabel: string;
  hiddenFields?: Record<string, string>;
}) {
  const [state, formAction] = useActionState(action, { error: null });

  return (
    <form action={formAction} className="space-y-6 rounded-xl border p-6">
      {hiddenFields &&
        Object.entries(hiddenFields).map(([key, value]) => (
          <input key={key} type="hidden" name={key} value={value} />
        ))}

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
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
          required
          defaultValue={values?.name}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Camisas"
        />
      </div>

      <div>
        <label htmlFor="slug" className="mb-2 block text-sm font-medium">
          Slug
        </label>
        <input
          id="slug"
          name="slug"
          defaultValue={values?.slug}
          className="w-full rounded-lg border px-3 py-2"
          placeholder="camisas"
        />
        <p className="mt-2 text-xs text-gray-500">
          Opcional: se genera a partir del nombre.
        </p>
      </div>

      <div>
        <label htmlFor="parentId" className="mb-2 block text-sm font-medium">
          Categoría padre
        </label>
        <select
          id="parentId"
          name="parentId"
          defaultValue={values?.parentId ?? ""}
          className="w-full rounded-lg border px-3 py-2"
        >
          <option value="">Sin padre (categoría raíz)</option>
          {parents.map((parent) => (
            <option key={parent.id} value={parent.id}>
              {parent.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="description" className="mb-2 block text-sm font-medium">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={values?.description}
          className="w-full rounded-lg border px-3 py-2"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Link
          href="/dashboard/categories"
          className="rounded-lg border px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </Link>
        <SubmitButton label={submitLabel} />
      </div>
    </form>
  );
}
