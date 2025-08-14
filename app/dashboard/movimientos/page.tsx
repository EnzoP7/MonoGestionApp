import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { MovimientosTable } from "./components/movimientos-table";

export default async function MovimientosPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return <MovimientosTable userId={userId} />;
}