"use client";

import { IconDots, type Icon } from "@tabler/icons-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

import Link from "next/link";
import { cn } from "@/lib/utils";

export function NavDocuments({
  title,
  items,
}: {
  title: string;
  items: {
    name: string;
    url: string;
    icon: Icon;
  }[];
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-muted-foreground tracking-wide text-sm px-4 py-2 uppercase">
        {title}
      </SidebarGroupLabel>
      <SidebarMenu className="space-y-1 px-2">
        {items.map((item) => (
          <SidebarMenuItem
            key={item.name}
            className="transition-colors rounded-lg hover:bg-accent/40"
          >
            <SidebarMenuButton
              asChild
              className="w-full flex items-center gap-3 p-2 rounded-lg"
            >
              <Link
                href={item.url}
                className="flex items-center gap-3 text-sm font-medium text-muted-foreground hover:text-foreground"
              >
                <item.icon className="w-5 h-5 text-primary" />
                <span>{item.name}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
