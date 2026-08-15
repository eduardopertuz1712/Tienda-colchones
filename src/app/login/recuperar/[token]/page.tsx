import Link from "next/link";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { isResetTokenValid } from "@/lib/password-reset";
import { ResetPasswordForm } from "../ResetForms";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const valid = await isResetTokenValid(token);

  return (
    <AuthLayout
      eyebrow="Recuperar acceso"
      title={valid ? "Crea tu nueva contraseña" : "Enlace no válido"}
      subtitle={
        valid
          ? "Elige una contraseña que no uses en otros sitios."
          : "Este enlace caducó o ya fue utilizado."
      }
      brandTitle="Tienda"
      brandPoints={[
        "El enlace caduca en 1 hora y solo se puede usar una vez.",
        "Pedir uno nuevo invalida automáticamente el anterior.",
        "Tu contraseña actual sigue funcionando hasta que la cambies.",
      ]}
      footer={
        <Link
          href="/login"
          className="font-semibold text-indigo-600 hover:text-indigo-500"
        >
          Volver al inicio de sesión
        </Link>
      }
    >
      {valid ? (
        <ResetPasswordForm token={token} />
      ) : (
        <Link
          href="/login/recuperar"
          className="block w-full rounded-xl bg-slate-900 px-4 py-3 text-center text-sm font-semibold text-white"
        >
          Pedir un enlace nuevo
        </Link>
      )}
    </AuthLayout>
  );
}
