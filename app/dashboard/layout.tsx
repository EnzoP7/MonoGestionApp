import { getCurrentUserId } from "@/lib/server/getCurrentUserId";
import { getUserById } from "@/lib/server/getUserById";
import DashboardWrapper from "@/components/layout/DashboardWrapper";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const userId = await getCurrentUserId();
  if (!userId) return <div>Acceso no autorizado</div>;

  const user = await getUserById(userId);
  if (!user) return <div>Usuario no encontrado</div>;

  return <DashboardWrapper user={user}>{children}</DashboardWrapper>;
}
