/** Formato de moneda y fecha compartido por panel y tienda. */

const cache = new Map<string, Intl.NumberFormat>();

function formatter(currency: string): Intl.NumberFormat {
  const existing = cache.get(currency);

  if (existing) {
    return existing;
  }

  const created = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  });

  cache.set(currency, created);

  return created;
}

export function formatMoney(value: unknown, currency = "COP"): string {
  return formatter(currency).format(Number(value));
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
