import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { LoginForm } from "./LoginForm";

/** Solo aceptamos rutas internas como destino tras el login. */
function safeCallbackUrl(value: string | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/dashboard";
  }

  return value;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();

  const { callbackUrl } = await searchParams;

  const destination = safeCallbackUrl(callbackUrl);

  // Si ya hay sesión, no tiene sentido mostrar el formulario.
  if (session?.user) {
    redirect(destination);
  }

  return (
    <AuthLayout
      eyebrow="Panel de administración"
      title="Inicia sesión"
      subtitle="Accede para gestionar productos, pedidos e inventario de tu tienda."
      brandTitle="Tienda"
      brandPoints={[
        "Controla productos, categorías e inventario desde un mismo panel.",
        "Sigue tus pedidos desde que entran hasta que se entregan.",
        "Consulta ventas del día, del mes y tus productos más vendidos.",
      ]}
      footer={
        <>
          ¿Buscas comprar?{" "}
          <Link
            href="/"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Ver las tiendas
          </Link>
        </>
      }
    >
      <LoginForm callbackUrl={destination} />
    </AuthLayout>
  );
}
