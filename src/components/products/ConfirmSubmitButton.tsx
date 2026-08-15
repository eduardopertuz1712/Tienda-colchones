"use client";

import { useFormStatus } from "react-dom";

export function ConfirmSubmitButton({
  message,
  label,
  pendingLabel,
  className,
}: {
  message: string;
  label: string;
  pendingLabel?: string;
  className?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className={className}
      onClick={(event) => {
        if (!window.confirm(message)) {
          event.preventDefault();
        }
      }}
    >
      {pending ? (pendingLabel ?? "Eliminando...") : label}
    </button>
  );
}
