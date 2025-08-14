import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { CategoriasTable } from "./components/categorias-table";

export default async function CategoriasPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return <CategoriasTable userId={userId} />;
}
