// app/dashboard/productos/page.tsx
import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { ProductosTable } from "./components/productos-table";

export default async function ProductosPage() {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  return <ProductosTable userId={userId} />;
}
