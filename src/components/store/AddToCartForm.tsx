"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addToCartAction,
  type StoreFormState,
} from "@/app/tienda/[slug]/actions";

const INITIAL: StoreFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-xl bg-slate-900 px-4 py-3 font-medium text-white transition hover:bg-slate-800 disabled:opacity-50"
    >
      {pending ? "Añadiendo..." : "Añadir al carrito"}
    </button>
  );
}

export function AddToCartForm({
  slug,
  productId,
}: {
  slug: string;
  productId: string;
}) {
  const [state, formAction] = useActionState(addToCartAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="slug" value={slug} />
      <input type="hidden" name="productId" value={productId} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <label htmlFor="quantity" className="text-sm font-medium">
          Cantidad
        </label>
        <input
          id="quantity"
          name="quantity"
          type="number"
          min="1"
          max="99"
          defaultValue="1"
          className="w-24 rounded-xl border border-slate-200 px-3 py-2"
        />
      </div>

      <SubmitButton />
    </form>
  );
}
