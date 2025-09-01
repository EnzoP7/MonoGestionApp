import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { ServiciosTable } from "./components/servicios-table";

export default async function ServiciosPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return <ServiciosTable userId={userId} />;
}