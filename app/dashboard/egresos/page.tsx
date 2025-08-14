import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { EgresosTable } from "./components/egresos-table";

export default async function EgresosPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return <EgresosTable userId={userId} />;
}