// app/dashboard/compras/page.tsx
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { ComprasTable } from "./components/ComprasTable";

export default async function ComprasPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;
  return (
    <main className="flex flex-col gap-6 p-4 md:p-6">
      <ComprasTable userId={userId} />
    </main>
  );
}
