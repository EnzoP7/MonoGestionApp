"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";
import { useCrearCategoria } from "@/lib/react-query/queries/categorias/useCrearCategoria";

interface Props {
  userId: string;
  open?: boolean;
  onOpenChange?: (val: boolean) => void;
}

// Formulario interno que permite string vacío
interface FormState {
  nombre: string;
  tipo: string;
  tipoCategoria: "" | "Ingreso" | "Egreso";
}

export function CreateCategoriaModal({ userId, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const actualOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [form, setForm] = useState<FormState>({
    nombre: "",
    tipo: "",
    tipoCategoria: "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mutation = useCrearCategoria({
    userId,
    form: {
      nombre: form.nombre,
      tipo: form.tipo,
      tipoCategoria: form.tipoCategoria as "Ingreso" | "Egreso", // Type assertion aquí
    },
    onSuccess: () => {
      setOpen(false);
      setForm({
        nombre: "",
        tipo: "",
        tipoCategoria: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tipoCategoria) {
      alert("Debe seleccionar si es categoría de Ingreso o Egreso");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">+ Crear categoría</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva Categoría</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="tipoCategoria">Tipo de Categoría</Label>
            <Select
              onValueChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  tipoCategoria: val as "Ingreso" | "Egreso",
                }))
              }
              value={form.tipoCategoria}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ingreso">Categoría de Ingreso</SelectItem>
                <SelectItem value="Egreso">Categoría de Egreso</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="nombre">Nombre</Label>
            <Input
              name="nombre"
              value={form.nombre}
              onChange={handleChange}
              placeholder="Ej: Ventas, Servicios, Gastos operativos..."
              required
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo/Descripción</Label>
            <Input
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              placeholder="Ej: Venta de productos, Consultoría, Alquiler..."
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
