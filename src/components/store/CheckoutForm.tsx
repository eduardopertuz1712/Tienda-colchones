"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import {
  checkoutAction,
  type StoreFormState,
} from "@/app/tienda/[slug]/actions";

const INITIAL: StoreFormState = { error: null };

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-black px-6 py-3 font-medium text-white disabled:opacity-50"
    >
      {pending ? "Procesando pedido..." : "Confirmar pedido"}
    </button>
  );
}

export function CheckoutForm({
  slug,
  defaults,
}: {
  slug: string;
  defaults?: { name?: string; email?: string; phone?: string };
}) {
  const [state, formAction] = useActionState(checkoutAction, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="slug" value={slug} />

      {state.error && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <section className="rounded-xl border p-6">
        <h2 className="font-semibold">Tus datos</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="customerName" className="mb-2 block text-sm font-medium">
              Nombre completo
            </label>
            <input
              id="customerName"
              name="customerName"
              required
              defaultValue={defaults?.name}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="customerEmail" className="mb-2 block text-sm font-medium">
              Correo electrónico
            </label>
            <input
              id="customerEmail"
              name="customerEmail"
              type="email"
              required
              defaultValue={defaults?.email}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="customerPhone" className="mb-2 block text-sm font-medium">
              Teléfono
            </label>
            <input
              id="customerPhone"
              name="customerPhone"
              defaultValue={defaults?.phone}
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="font-semibold">Dirección de envío</h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="shippingLine1" className="mb-2 block text-sm font-medium">
              Dirección
            </label>
            <input
              id="shippingLine1"
              name="shippingLine1"
              required
              placeholder="Calle 45 # 12-34"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div className="sm:col-span-2">
            <label htmlFor="shippingLine2" className="mb-2 block text-sm font-medium">
              Apartamento, barrio (opcional)
            </label>
            <input
              id="shippingLine2"
              name="shippingLine2"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="shippingCity" className="mb-2 block text-sm font-medium">
              Ciudad
            </label>
            <input
              id="shippingCity"
              name="shippingCity"
              required
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="shippingState" className="mb-2 block text-sm font-medium">
              Departamento
            </label>
            <input
              id="shippingState"
              name="shippingState"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>

          <div>
            <label htmlFor="shippingPostalCode" className="mb-2 block text-sm font-medium">
              Código postal
            </label>
            <input
              id="shippingPostalCode"
              name="shippingPostalCode"
              className="w-full rounded-lg border px-3 py-2"
            />
          </div>
        </div>
      </section>

      <section className="rounded-xl border p-6">
        <h2 className="font-semibold">Pago</h2>

        <div className="mt-4 space-y-3">
          <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <input
              type="radio"
              name="paymentMethod"
              value="CASH_ON_DELIVERY"
              defaultChecked
            />
            Contra entrega
          </label>

          <label className="flex items-center gap-3 rounded-lg border p-3 text-sm">
            <input type="radio" name="paymentMethod" value="BANK_TRANSFER" />
            Transferencia bancaria
          </label>
        </div>

        <div className="mt-4">
          <label htmlFor="notes" className="mb-2 block text-sm font-medium">
            Notas para el vendedor
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full rounded-lg border px-3 py-2"
          />
        </div>
      </section>

      <SubmitButton />
    </form>
  );
}
