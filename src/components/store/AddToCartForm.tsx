"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  addToCartAction,
  type StoreFormState,
} from "@/app/tienda/[slug]/actions";

const INITIAL: StoreFormState = { error: null };

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={disabled || pending}
      className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white disabled:opacity-50"
    >
      {disabled ? "Agotado" : pending ? "Añadiendo..." : "Añadir al carrito"}
    </button>
  );
}

export function AddToCartForm({
  slug,
  productId,
  stock,
}: {
  slug: string;
  productId: string;
  stock: number;
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
          max={Math.max(1, stock)}
          defaultValue="1"
          disabled={stock <= 0}
          className="w-24 rounded-lg border px-3 py-2"
        />
        <span className="text-sm text-gray-500">
          {stock > 0 ? `${stock} disponibles` : "Sin existencias"}
        </span>
      </div>

      <SubmitButton disabled={stock <= 0} />
    </form>
  );
}
