"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { adjustStockAction, type StockFormState } from "@/app/dashboard/inventory/actions";

const INITIAL: StockFormState = { error: null, ok: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
    >
      {pending ? "Aplicando..." : "Aplicar movimiento"}
    </button>
  );
}

export function StockForm({ productId }: { productId: string }) {
  const [state, formAction] = useActionState(adjustStockAction, INITIAL);

  return (
    <form action={formAction} className="space-y-4 rounded-xl border p-6">
      <input type="hidden" name="productId" value={productId} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      {state.ok && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          {state.ok}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="type" className="mb-2 block text-sm font-medium">
            Tipo de movimiento
          </label>
          <select
            id="type"
            name="type"
            className="w-full rounded-lg border px-3 py-2"
            defaultValue="PURCHASE"
          >
            <option value="PURCHASE">Entrada de mercancía</option>
            <option value="RETURN">Devolución</option>
            <option value="ADJUSTMENT">Ajuste manual</option>
            <option value="SALE">Venta / salida</option>
          </select>
        </div>

        <div>
          <label htmlFor="quantity" className="mb-2 block text-sm font-medium">
            Cantidad
          </label>
          <input
            id="quantity"
            name="quantity"
            type="number"
            step="1"
            required
            placeholder="20 o -3"
            className="w-full rounded-lg border px-3 py-2"
          />
          <p className="mt-2 text-xs text-gray-500">
            Positivo para sumar, negativo para restar.
          </p>
        </div>
      </div>

      <div>
        <label htmlFor="reason" className="mb-2 block text-sm font-medium">
          Motivo
        </label>
        <input
          id="reason"
          name="reason"
          className="w-full rounded-lg border px-3 py-2"
          placeholder="Compra a proveedor, rotura, conteo físico..."
        />
      </div>

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}
