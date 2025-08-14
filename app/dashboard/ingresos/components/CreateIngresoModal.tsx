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
import { Textarea } from "@/components/ui/textarea";
import { useCrearIngreso } from "@/lib/react-query/mutations/ingresos/useCrearIngreso";
import { useCategorias } from "@/lib/react-query/queries/categorias/useCategorias";

interface Props {
  userId: string;
  open?: boolean;
  onOpenChange?: (val: boolean) => void;
}

interface FormState {
  fecha: string;
  monto: string;
  descripcion: string;
  categoriaIngresoId: string;
}

export function CreateIngresoModal({ userId, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const actualOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [form, setForm] = useState<FormState>({
    fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    monto: "",
    descripcion: "",
    categoriaIngresoId: "",
  });

  const { data: categorias = [] } = useCategorias(userId);
  const categoriasIngreso = categorias.filter(cat => cat.tipoCategoria === "Ingreso");

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mutation = useCrearIngreso({
    userId,
    form: {
      fecha: form.fecha,
      monto: form.monto,
      descripcion: form.descripcion || undefined,
      categoriaIngresoId: form.categoriaIngresoId || undefined,
    },
    onSuccess: () => {
      setOpen(false);
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        monto: "",
        descripcion: "",
        categoriaIngresoId: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fecha || !form.monto) {
      alert("Fecha y monto son obligatorios");
      return;
    }
    mutation.mutate();
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button className="flex items-center gap-2">+ Crear ingreso</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Ingreso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="fecha">Fecha</Label>
            <Input
              name="fecha"
              type="date"
              value={form.fecha}
              onChange={handleChange}
              required
            />
          </div>

          <div>
            <Label htmlFor="monto">Monto</Label>
            <Input
              name="monto"
              type="number"
              step="0.01"
              min="0"
              value={form.monto}
              onChange={handleChange}
              placeholder="0.00"
              required
            />
          </div>

          <div>
            <Label htmlFor="categoriaIngresoId">Categoría (Opcional)</Label>
            <Select
              onValueChange={(val) =>
                setForm((prev) => ({
                  ...prev,
                  categoriaIngresoId: val,
                }))
              }
              value={form.categoriaIngresoId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar categoría" />
              </SelectTrigger>
              <SelectContent>
                {categoriasIngreso.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre} - {categoria.tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="descripcion">Descripción (Opcional)</Label>
            <Textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              placeholder="Descripción del ingreso..."
              rows={3}
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