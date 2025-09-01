import { LoginForm } from "@/components/login-form";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (token) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            MonoGestión
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Sistema de gestión para monotributistas
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
