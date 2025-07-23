"use client";

import { useState } from "react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Plus, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Proveedor {
  id: string;
  nombre: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  proveedores: Proveedor[];
  onCrearNuevo: () => void;
}

export function ProveedorCombobox({
  value,
  onChange,
  proveedores,
  onCrearNuevo,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = proveedores.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected?.nombre ?? "Seleccionar proveedor"}
          <ChevronsUpDown size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput placeholder="Buscar proveedor..." />
          <CommandEmpty>No se encontró proveedor.</CommandEmpty>
          <CommandGroup>
            {proveedores.map((prov) => (
              <CommandItem
                key={prov.id}
                onSelect={() => {
                  onChange(prov.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    prov.id === value ? "opacity-100" : "opacity-0"
                  )}
                />
                {prov.nombre}
              </CommandItem>
            ))}
            <CommandItem
              onSelect={() => {
                setOpen(false);
                onCrearNuevo();
              }}
              className="text-primary flex items-center"
            >
              <Plus size={16} className="mr-2" />
              Crear nuevo proveedor
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
