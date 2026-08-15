import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { RequestResetForm } from "./ResetForms";

export default function RequestResetPage() {
  return (
    <AuthLayout
      eyebrow="Recuperar acceso"
      title="¿Olvidaste tu contraseña?"
      subtitle="Escribe tu correo y te enviamos un enlace para crear una nueva."
      brandTitle="Tienda"
      brandPoints={[
        "El enlace caduca en 1 hora y solo se puede usar una vez.",
        "Pedir uno nuevo invalida automáticamente el anterior.",
        "Tu contraseña actual sigue funcionando hasta que la cambies.",
      ]}
      footer={
        <>
          ¿La recordaste?{" "}
          <Link
            href="/login"
            className="font-semibold text-indigo-600 hover:text-indigo-500"
          >
            Inicia sesión
          </Link>
        </>
      }
    >
      <RequestResetForm />
    </AuthLayout>
  );
}
