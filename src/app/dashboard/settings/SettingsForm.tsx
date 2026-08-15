"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { FormAlert } from "@/components/auth/fields";
import {
  updateSettingsAction,
  type SettingsFormState,
} from "./actions";

const INITIAL: SettingsFormState = { error: null, ok: false };

const INPUT =
  "w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10";

function Save() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:opacity-60"
    >
      {pending ? "Guardando..." : "Guardar cambios"}
    </button>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 p-6">
      <h2 className="font-semibold">{title}</h2>
      {hint && <p className="mt-1 text-sm text-slate-500">{hint}</p>}
      <div className="mt-5 grid gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function Input({
  id,
  label,
  hint,
  wide,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <label htmlFor={id} className="mb-2 block text-sm font-medium">
        {label}
      </label>
      <input id={id} name={id} className={INPUT} {...props} />
      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function SettingsForm({
  settings,
}: {
  settings: {
    name: string;
    description: string;
    primaryColor: string;
    currency: string;
    email: string;
    phone: string;
    address: string;
    instagramUrl: string;
    facebookUrl: string;
    whatsapp: string;
    shippingCost: string;
    freeShippingThreshold: string;
  };
}) {
  const [state, formAction] = useActionState(updateSettingsAction, INITIAL);

  return (
    <form action={formAction} className="space-y-6">
      {state.error && <FormAlert>{state.error}</FormAlert>}
      {state.ok && (
        <FormAlert tone="success">Configuración guardada.</FormAlert>
      )}

      <Section title="Identidad" hint="Cómo se ve tu tienda para los compradores.">
        <Input id="name" label="Nombre de la tienda" required defaultValue={settings.name} wide />

        <div className="sm:col-span-2">
          <label htmlFor="description" className="mb-2 block text-sm font-medium">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={settings.description}
            className={INPUT}
            placeholder="Qué vendes y qué te diferencia."
          />
        </div>

        <div>
          <label htmlFor="primaryColor" className="mb-2 block text-sm font-medium">
            Color principal
          </label>
          <div className="flex gap-3">
            <input
              type="color"
              defaultValue={settings.primaryColor}
              onChange={(event) => {
                const target = document.getElementById(
                  "primaryColor",
                ) as HTMLInputElement | null;
                if (target) target.value = event.target.value.toUpperCase();
              }}
              className="h-11 w-14 cursor-pointer rounded-xl border border-slate-200"
              aria-label="Selector de color"
            />
            <input
              id="primaryColor"
              name="primaryColor"
              defaultValue={settings.primaryColor}
              className={INPUT}
              placeholder="#0F172A"
            />
          </div>
          <p className="mt-2 text-xs text-slate-400">
            Se usa en botones y cabecera de tu tienda.
          </p>
        </div>

        <Input
          id="currency"
          label="Moneda"
          defaultValue={settings.currency}
          maxLength={3}
          hint="Código ISO de 3 letras: COP, USD, MXN..."
        />
      </Section>

      <Section title="Contacto" hint="Aparece en el pie de tu tienda.">
        <Input id="email" label="Correo" type="email" defaultValue={settings.email} />
        <Input id="phone" label="Teléfono" defaultValue={settings.phone} />
        <Input id="address" label="Dirección" defaultValue={settings.address} wide />
        <Input id="whatsapp" label="WhatsApp" defaultValue={settings.whatsapp} hint="Solo números, con indicativo: 573001234567" />
      </Section>

      <Section title="Redes sociales">
        <Input id="instagramUrl" label="Instagram" defaultValue={settings.instagramUrl} placeholder="https://instagram.com/tutienda" />
        <Input id="facebookUrl" label="Facebook" defaultValue={settings.facebookUrl} placeholder="https://facebook.com/tutienda" />
      </Section>

      <Section title="Envío" hint="Se aplica automáticamente en el checkout.">
        <Input
          id="shippingCost"
          label="Costo de envío"
          type="number"
          min="0"
          step="0.01"
          defaultValue={settings.shippingCost}
        />
        <Input
          id="freeShippingThreshold"
          label="Envío gratis desde"
          type="number"
          min="0"
          step="0.01"
          defaultValue={settings.freeShippingThreshold}
          hint="Déjalo vacío para no ofrecer envío gratis."
        />
      </Section>

      <div className="flex justify-end">
        <Save />
      </div>
    </form>
  );
}
