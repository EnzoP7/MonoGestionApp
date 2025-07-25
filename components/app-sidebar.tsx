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
  secciones: {
    inicio: [
      { name: "Inicio", url: "/dashboard", icon: IconDashboard },
      { name: "Finanzas", url: "/finanzas", icon: IconCurrencyDollar },
      { name: "Movimientos", url: "/movimientos", icon: IconInnerShadowTop },
    ],
    ingresosEgresos: [
      { name: "Ingresos", url: "/ingresos", icon: IconDatabase },
      { name: "Egresos", url: "/egresos", icon: IconFileDescription },
      { name: "Categorías", url: "/categorias", icon: IconFolder },
    ],
    ventasClientes: [
      { name: "Ventas", url: "/ventas", icon: IconListDetails },
      { name: "Clientes", url: "/clientes", icon: IconUsers },
      { name: "Servicios", url: "/servicios", icon: IconFileWord },
    ],
    inventarioProveedores: [
      { name: "Productos", url: "/dashboard/productos", icon: IconFolder },
      { name: "Compras", url: "/dashboard/compras", icon: IconFileDescription },
      { name: "Proveedores", url: "/dashboard/proveedores", icon: IconUsers },
    ],
    comunicacion: [
      { name: "Notificaciones", url: "/notificaciones", icon: IconBell },
    ],
  },

  reportes: {
    mensuales: [
      {
        name: "Reportes Mensuales",
        url: "/reportes/mensuales",
        icon: IconReport,
      },
    ],
    comparativas: [
      {
        name: "Comparativas",
        url: "/reportes/comparativas",
        icon: IconChartBar,
      },
    ],
    exportaciones: [
      {
        name: "Exportaciones",
        url: "/reportes/exportaciones",
        icon: IconFileWord,
      },
    ],
  },
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
        <NavDocuments title="Inicio" items={data.secciones.inicio} />
        <NavDocuments
          title="Ingresos y Egresos"
          items={data.secciones.ingresosEgresos}
        />
        <NavDocuments
          title="Ventas y Clientes"
          items={data.secciones.ventasClientes}
        />
        <NavDocuments
          title="Inventario y Proveedores"
          items={data.secciones.inventarioProveedores}
        />
        <NavDocuments
          title="Comunicación"
          items={data.secciones.comunicacion}
        />

        <NavDocuments
          title="Reportes Mensuales"
          items={data.reportes.mensuales}
        />
        <NavDocuments title="Comparativas" items={data.reportes.comparativas} />
        <NavDocuments
          title="Exportaciones"
          items={data.reportes.exportaciones}
        />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
