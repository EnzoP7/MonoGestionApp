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
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Check, Plus, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Producto {
  id: string;
  nombre: string;
}

interface Props {
  value: string;
  onChange: (val: string) => void;
  productos: Producto[];
  onCrearNuevo: () => void;
}

export function ProductoCombobox({
  value,
  onChange,
  productos,
  onCrearNuevo,
}: Props) {
  const [open, setOpen] = useState(false);
  const selected = productos.find((p) => p.id === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {selected?.nombre ?? "Seleccionar producto"}
          <ChevronsUpDown size={16} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 max-h-64 overflow-auto">
        <Command>
          <CommandInput placeholder="Buscar producto..." />
          <CommandEmpty>No se encontró producto.</CommandEmpty>
          <CommandGroup>
            {productos.map((producto) => (
              <CommandItem
                key={producto.id}
                onSelect={() => {
                  onChange(producto.id);
                  setOpen(false);
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    producto.id === value ? "opacity-100" : "opacity-0"
                  )}
                />
                {producto.nombre}
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
              Crear nuevo producto
            </CommandItem>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
