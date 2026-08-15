import { formatMoney } from "@/lib/format";

/**
 * Gráfica de barras de los últimos días (§21).
 *
 * Se dibuja con divs en vez de una librería: son pocos datos, y así la
 * página no carga JavaScript extra para mostrarla.
 */
export function SalesChart({
  data,
}: {
  data: Array<{ day: string; label: string; total: number }>;
}) {
  const max = Math.max(...data.map((point) => point.total), 1);

  const totalPeriod = data.reduce((sum, point) => sum + point.total, 0);

  return (
    <section className="rounded-2xl border border-slate-200 p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-semibold">Ventas de los últimos 14 días</h2>
        <span className="text-sm text-slate-500">
          {formatMoney(totalPeriod)}
        </span>
      </div>

      {totalPeriod === 0 ? (
        <p className="mt-6 text-sm text-slate-500">
          Todavía no hay ventas en este periodo.
        </p>
      ) : (
        <div className="mt-6 flex h-44 items-end gap-1.5">
          {data.map((point) => {
            const height = Math.round((point.total / max) * 100);

            return (
              <div
                key={point.day}
                className="group flex flex-1 flex-col items-center justify-end gap-2"
              >
                <span className="pointer-events-none text-[10px] font-medium text-slate-500 opacity-0 transition group-hover:opacity-100">
                  {point.total > 0 ? formatMoney(point.total) : ""}
                </span>

                <div
                  className="w-full rounded-t bg-slate-900 transition group-hover:bg-indigo-600"
                  style={{ height: `${Math.max(height, 2)}%` }}
                  title={`${point.label}: ${formatMoney(point.total)}`}
                />

                <span className="text-[10px] text-slate-400">
                  {point.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
