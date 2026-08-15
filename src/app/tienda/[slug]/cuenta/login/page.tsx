import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStore } from "@/lib/storefront";
import { getCustomerSession } from "@/lib/customer-session";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CustomerLoginForm } from "../CustomerForms";

export default async function CustomerLoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { slug } = await params;
  const { next } = await searchParams;

  const store = await requireStore(slug);

  if (await getCustomerSession(store.id)) {
    redirect(`/tienda/${slug}/cuenta`);
  }

  const destination = next ?? `/tienda/${slug}/cuenta`;

  return (
    <AuthLayout
      eyebrow={store.name}
      title="Bienvenido de vuelta"
      subtitle="Inicia sesión para agilizar tu compra y seguir tus pedidos."
      brandTitle={store.name}
      brandPoints={[
        "Guarda tus datos y compra en menos pasos la próxima vez.",
        "Consulta el estado de todos tus pedidos cuando quieras.",
        "Tu historial de compras siempre disponible.",
      ]}
      homeHref={`/tienda/${slug}`}
      footer={
        <>
          ¿Todavía no tienes cuenta?{" "}
          <Link
            href={`/tienda/${slug}/cuenta/registro`}
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Regístrate
          </Link>
        </>
      }
    >
      <CustomerLoginForm slug={slug} next={destination} />
    </AuthLayout>
  );
}
