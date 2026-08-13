import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">
        Dashboard
      </h1>

      <p className="mt-4">
        Bienvenido, {session.user.name}
      </p>

      <p className="mt-2 text-gray-600">
        {session.user.email}
      </p>
    </main>
  );
}