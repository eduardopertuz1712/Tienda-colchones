import Link from "next/link";
import { notFound } from "next/navigation";
import { requireTenantPermission } from "@/lib/auth-guards";
import { getProduct } from "@/lib/catalog";
import { getMovements } from "@/lib/inventory";
import { can } from "@/lib/permissions";
import { formatDateTime } from "@/lib/format";
import { StockForm } from "@/components/inventory/StockForm";

const TYPE_LABELS: Record<string, string> = {
  PURCHASE: "Entrada",
  SALE: "Venta",
  ADJUSTMENT: "Ajuste",
  RETURN: "Devolución",
};

export default async function ProductInventoryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { tenantId, user } = await requireTenantPermission(
    "view",
    "inventory",
  );

  const { id } = await params;

  const product = await getProduct(tenantId, id);

  if (!product) {
    notFound();
  }

  const movements = await getMovements(tenantId, product.id);

  const balance = movements.reduce((sum, m) => sum + m.quantity, 0);

  return (
    <main className="p-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8">
          <Link
            href="/dashboard/inventory"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Volver a inventario
          </Link>
          <h1 className="mt-4 text-3xl font-bold">{product.name}</h1>
          <p className="mt-2 text-sm text-gray-500">
            SKU {product.sku} · Stock actual{" "}
            <strong>{product.stock}</strong> · Mínimo {product.minStock}
          </p>
        </div>

        {can(user, "update", "inventory") && (
          <StockForm productId={product.id} />
        )}

        <div className="mt-8">
          <h2 className="font-semibold">Histórico de movimientos</h2>

          <div className="mt-4 overflow-hidden rounded-xl border">
            <table className="w-full">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Fecha
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Tipo
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Cantidad
                  </th>
                  <th className="px-4 py-3 text-right text-sm font-semibold">
                    Stock después
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">
                    Motivo
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.map((movement) => (
                  <tr key={movement.id} className="border-b last:border-0">
                    <td className="px-4 py-3 text-sm">
                      {formatDateTime(movement.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {TYPE_LABELS[movement.type] ?? movement.type}
                    </td>
                    <td
                      className={`px-4 py-3 text-right font-medium ${movement.quantity < 0 ? "text-red-600" : "text-green-700"}`}
                    >
                      {movement.quantity > 0 ? "+" : ""}
                      {movement.quantity}
                    </td>
                    <td className="px-4 py-3 text-right text-sm">
                      {movement.stockAfter}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {movement.reason ?? "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {movements.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                Sin movimientos registrados.
              </div>
            )}
          </div>

          {movements.length > 0 && (
            <p className="mt-3 text-xs text-gray-500">
              Suma de movimientos: {balance}
              {balance !== product.stock &&
                ` (el stock actual es ${product.stock}; hay movimientos anteriores fuera de las últimas 50 filas)`}
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
