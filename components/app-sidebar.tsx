"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  IconChartBar,
  IconDashboard,
  IconDatabase,
  IconFileDescription,
  IconFileWord,
  IconFolder,
  IconInnerShadowTop,
  IconListDetails,
  IconReport,
  IconUsers,
  IconBell,
  IconCurrencyDollar,
} from "@tabler/icons-react";

import { NavDocuments } from "@/components/nav-documents";
import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const data = {
  navMain: [
    { title: "Inicio", url: "/dashboard", icon: IconDashboard },
    { title: "Finanzas", url: "/finanzas", icon: IconCurrencyDollar },
    { title: "Notificaciones", url: "/notificaciones", icon: IconBell },
    { title: "Ingresos", url: "/ingresos", icon: IconDatabase },
    { title: "Egresos", url: "/egresos", icon: IconFileDescription },
    { title: "Ventas", url: "/ventas", icon: IconListDetails },
    { title: "Productos", url: "/dashboard/productos", icon: IconFolder },
    { title: "Clientes", url: "/clientes", icon: IconUsers },
  ],
  documents: [
    {
      name: "Reportes Mensuales",
      url: "/reportes/mensuales",
      icon: IconReport,
    },
    { name: "Comparativas", url: "/reportes/comparativas", icon: IconChartBar },
    {
      name: "Descargas Excel",
      url: "/reportes/exportaciones",
      icon: IconFileWord,
    },
  ],
};

export function AppSidebar({
  user,
  ...props
}: React.ComponentProps<typeof Sidebar> & {
  user: { id: string; name: string; email: string };
}) {
  const router = useRouter();

  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              type="button" // 👈 Asegura que no se interprete como submit
              onClick={() => router.push("/dashboard")}
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <IconInnerShadowTop className="!size-5" />
              <span className="text-base font-semibold">Mono Gestión</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
