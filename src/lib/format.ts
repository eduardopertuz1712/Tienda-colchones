/** Formato de moneda y fecha compartido por panel y tienda. */

const currency = new Intl.NumberFormat("es-CO", {
  style: "currency",
  currency: "COP",
  maximumFractionDigits: 2,
});

export function formatMoney(value: unknown): string {
  return currency.format(Number(value));
}

export function formatDate(value: Date): string {
  return value.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value: Date): string {
  return value.toLocaleString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
