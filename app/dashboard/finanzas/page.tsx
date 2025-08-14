import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { FinanzasDashboard } from "./components/FinanzasDashboard";

export default async function FinanzasPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return <FinanzasDashboard userId={userId} />;
}