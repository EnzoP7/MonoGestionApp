import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { IngresosTable } from "./components/ingresos-table";

export default async function IngresosPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return <IngresosTable userId={userId} />;
}