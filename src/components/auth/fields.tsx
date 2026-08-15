"use client";

import { useState } from "react";

const INPUT_CLASS =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 disabled:bg-slate-50";

export function Field({
  id,
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
}) {
  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <input id={id} name={id} className={INPUT_CLASS} {...props} />

      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

/** Campo de contraseña con conmutador de visibilidad. */
export function PasswordField({
  id,
  label,
  hint,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  hint?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div>
      <label
        htmlFor={id}
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        {label}
      </label>

      <div className="relative">
        <input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          className={`${INPUT_CLASS} pr-12`}
          {...props}
        />

        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          aria-label={visible ? "Ocultar contraseña" : "Mostrar contraseña"}
          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
        >
          {visible ? (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M3.3 2.3a1 1 0 0 0-1.4 1.4l14 14a1 1 0 0 0 1.4-1.4l-1.9-1.9A9.6 9.6 0 0 0 18.6 10C17.3 6.7 13.9 4.4 10 4.4c-1.2 0-2.4.2-3.4.7L3.3 2.3ZM10 13.6c-2 0-3.6-1.6-3.6-3.6 0-.4.1-.8.2-1.2l4.6 4.6c-.4.1-.8.2-1.2.2Z" />
              <path d="M1.4 10c.7-1.8 2-3.3 3.6-4.3l2.2 2.2A3.6 3.6 0 0 0 10 13.6l1.6 1.6c-.5.1-1 .2-1.6.2-3.9 0-7.3-2.3-8.6-5.4Z" />
            </svg>
          ) : (
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
              <path d="M10 4.4c3.9 0 7.3 2.3 8.6 5.6-1.3 3.3-4.7 5.6-8.6 5.6S2.7 13.3 1.4 10C2.7 6.7 6.1 4.4 10 4.4Zm0 9.2a3.6 3.6 0 1 0 0-7.2 3.6 3.6 0 0 0 0 7.2Zm0-1.8a1.8 1.8 0 1 1 0-3.6 1.8 1.8 0 0 1 0 3.6Z" />
            </svg>
          )}
        </button>
      </div>

      {hint && <p className="mt-2 text-xs text-slate-400">{hint}</p>}
    </div>
  );
}

export function FormAlert({
  tone = "error",
  children,
}: {
  tone?: "error" | "success";
  children: React.ReactNode;
}) {
  const styles =
    tone === "error"
      ? "border-red-100 bg-red-50 text-red-700"
      : "border-emerald-100 bg-emerald-50 text-emerald-700";

  return (
    <p
      role="alert"
      className={`flex items-start gap-2 rounded-xl border p-3 text-sm ${styles}`}
    >
      <svg
        aria-hidden
        viewBox="0 0 20 20"
        fill="currentColor"
        className="mt-0.5 h-4 w-4 shrink-0"
      >
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16Zm.75-11.5a.75.75 0 0 0-1.5 0v4a.75.75 0 0 0 1.5 0v-4ZM10 14a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z"
          clipRule="evenodd"
        />
      </svg>
      <span>{children}</span>
    </p>
  );
}

export function SubmitButton({
  label,
  pendingLabel,
  pending,
}: {
  label: string;
  pendingLabel: string;
  pending: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-900/20 disabled:opacity-60"
    >
      {pending && (
        <svg
          aria-hidden
          viewBox="0 0 24 24"
          className="h-4 w-4 animate-spin"
          fill="none"
        >
          <circle
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            className="opacity-25"
          />
          <path
            fill="currentColor"
            className="opacity-75"
            d="M4 12a8 8 0 0 1 8-8v4a4 4 0 0 0-4 4H4Z"
          />
        </svg>
      )}
      {pending ? pendingLabel : label}
    </button>
  );
}
