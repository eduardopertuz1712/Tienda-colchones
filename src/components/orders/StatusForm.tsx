"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  changeOrderStatusAction,
  type OrderActionState,
} from "@/app/dashboard/orders/actions";

const INITIAL: OrderActionState = { error: null };

function SubmitButton({ danger }: { danger: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={`rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50 ${
        danger ? "bg-red-600 text-white" : "bg-black text-white"
      }`}
    >
      {pending ? "Aplicando..." : "Cambiar estado"}
    </button>
  );
}

export function StatusForm({
  orderId,
  options,
}: {
  orderId: string;
  options: Array<{ value: string; label: string }>;
}) {
  const [state, formAction] = useActionState(
    changeOrderStatusAction,
    INITIAL,
  );

  if (options.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        Este pedido está en un estado final; no admite más cambios.
      </p>
    );
  }

  return (
    <form action={formAction} className="space-y-3">
      <input type="hidden" name="orderId" value={orderId} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <select
          name="status"
          className="rounded-lg border px-3 py-2 text-sm"
          defaultValue={options[0].value}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        <SubmitButton danger={false} />
      </div>

      <p className="text-xs text-gray-500">
        Cancelar o reembolsar devuelve las unidades al inventario.
      </p>
    </form>
  );
}
