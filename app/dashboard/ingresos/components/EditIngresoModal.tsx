"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import { useActualizarIngreso } from "@/lib/react-query/mutations/ingresos/useActualizarIngreso";
import { useCategorias } from "@/lib/react-query/queries/categorias/useCategorias";
import { Ingreso } from "@/types/ingreso";

interface Props {
  userId: string;
  ingreso: Ingreso;
  isOpen: boolean;
  onClose: () => void;
}

interface FormState {
  fecha: string;
  monto: string;
  descripcion: string;
  categoriaIngresoId: string;
}

export function EditIngresoModal({ userId, ingreso, isOpen, onClose }: Props) {
  const [form, setForm] = useState<FormState>({
    fecha: "",
    monto: "",
    descripcion: "",
    categoriaIngresoId: "",
  });

  const { data: categorias = [] } = useCategorias(userId);
  const categoriasIngreso = categorias.filter(cat => cat.tipoCategoria === "Ingreso");

  useEffect(() => {
    if (ingreso) {
      setForm({
        fecha: new Date(ingreso.fecha).toISOString().split('T')[0],
        monto: ingreso.monto.toString(),
        descripcion: ingreso.descripcion || "",
        categoriaIngresoId: ingreso.categoriaIngresoId || "",
      });
    }
  }, [ingreso]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mutation = useActualizarIngreso({
    userId,
    ingresoId: ingreso.id,
    form: {
      fecha: form.fecha,
      monto: form.monto,
      descripcion: form.descripcion || undefined,
      categoriaIngresoId: form.categoriaIngresoId || undefined,
    },
    onSuccess: () => {
      onClose();
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Ingreso</DialogTitle>
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
                <SelectItem value="">Sin categoría</SelectItem>
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

          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Guardando..." : "Guardar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}