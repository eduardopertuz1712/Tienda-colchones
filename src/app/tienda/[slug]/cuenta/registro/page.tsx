import Link from "next/link";
import { redirect } from "next/navigation";
import { requireStore } from "@/lib/storefront";
import { getCustomerSession } from "@/lib/customer-session";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { CustomerRegisterForm } from "../CustomerForms";

export default async function CustomerRegisterPage({
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
      title="Crea tu cuenta"
      subtitle="Solo te tomará un minuto y podrás seguir tus pedidos."
      brandTitle={store.name}
      brandPoints={[
        "Compra más rápido: tus datos quedan guardados.",
        "Sigue cada pedido desde que lo haces hasta que llega.",
        "Tu cuenta es exclusiva de esta tienda.",
      ]}
      homeHref={`/tienda/${slug}`}
      footer={
        <>
          ¿Ya tienes cuenta?{" "}
          <Link
            href={`/tienda/${slug}/cuenta/login`}
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <CustomerRegisterForm slug={slug} next={destination} />
    </AuthLayout>
  );
}
