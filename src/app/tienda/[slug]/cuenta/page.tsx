import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStore } from "@/lib/storefront";
import { getCustomerSession } from "@/lib/customer-session";
import { getCustomerById } from "@/lib/customers";
import { prisma } from "@/lib/prisma";
import { STATUS_LABELS } from "@/lib/orders";
import { formatDate, formatMoney } from "@/lib/format";
import { logoutCustomerAction } from "./actions";

export default async function AccountPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const store = await requireStore(slug);

  const session = await getCustomerSession(store.id);

  if (!session) {
    redirect(`/tienda/${slug}/cuenta/login`);
  }

  const customer = await getCustomerById(store.id, session.customerId);

  if (!customer) {
    redirect(`/tienda/${slug}/cuenta/login`);
  }

  const orders = await prisma.order.findMany({
    where: { tenantId: store.id, customerId: customer.id },
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { items: true } } },
  });

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Mi cuenta</h1>
          <p className="mt-2 text-sm text-slate-500">
            {customer.name} · {customer.email}
          </p>
        </div>

        <form action={logoutCustomerAction}>
          <input type="hidden" name="slug" value={slug} />
          <button
            type="submit"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
          >
            Cerrar sesión
          </button>
        </form>
      </div>

      <section className="mt-10">
        <h2 className="font-semibold">Mis pedidos</h2>

        {orders.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-slate-200 p-12 text-center">
            <p className="text-slate-500">Todavía no has hecho pedidos.</p>
            <Link
              href={`/tienda/${slug}`}
              className="mt-6 inline-block rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
            >
              Ver productos
            </Link>
          </div>
        ) : (
          <ul className="mt-4 space-y-3">
            {orders.map((order) => (
              <li
                key={order.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 p-5"
              >
                <div>
                  <Link
                    href={`/tienda/${slug}/pedido/${order.number}`}
                    className="font-semibold hover:underline"
                  >
                    {order.number}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDate(order.createdAt)} · {order._count.items}{" "}
                    producto(s)
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-semibold">{formatMoney(order.total)}</p>
                  <p className="text-sm text-slate-500">
                    {STATUS_LABELS[order.status]}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
