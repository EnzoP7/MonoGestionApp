import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { ProveedoresTable } from "./components/proveedoresTable";

export default async function ProveedoresPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return (
    <div className="p-4 md:p-6 space-y-6">
      <ProveedoresTable userId={userId} />
    </div>
  );
}
