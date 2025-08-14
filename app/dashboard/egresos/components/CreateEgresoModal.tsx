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
import { useCrearEgreso } from "@/lib/react-query/mutations/egresos/useCrearEgreso";
import { useCategorias } from "@/lib/react-query/queries/categorias/useCategorias";

interface Props {
  userId: string;
  open?: boolean;
  onOpenChange?: (val: boolean) => void;
}

interface FormState {
  fecha: string;
  monto: string;
  categoria: string;
  descripcion: string;
  categoriaEgresoId: string;
}

export function CreateEgresoModal({ userId, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const actualOpen = isControlled ? open : internalOpen;
  const setOpen = isControlled ? onOpenChange : setInternalOpen;

  const [form, setForm] = useState<FormState>({
    fecha: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    monto: "",
    categoria: "",
    descripcion: "",
    categoriaEgresoId: "",
  });

  const { data: categorias = [] } = useCategorias(userId);
  const categoriasEgreso = categorias.filter((cat) => cat.tipoCategoria === "Egreso");

  const createMutation = useCrearEgreso({
    userId,
    onSuccess: () => {
      setOpen(false);
      setForm({
        fecha: new Date().toISOString().split('T')[0],
        monto: "",
        categoria: "",
        descripcion: "",
        categoriaEgresoId: "",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.fecha || !form.monto || !form.categoria) {
      alert("Por favor completa todos los campos obligatorios.");
      return;
    }

    const montoNum = parseFloat(form.monto);
    if (isNaN(montoNum) || montoNum <= 0) {
      alert("El monto debe ser un número positivo.");
      return;
    }

    createMutation.mutate({
      fecha: form.fecha,
      monto: form.monto,
      categoria: form.categoria,
      descripcion: form.descripcion || undefined,
      categoriaEgresoId: form.categoriaEgresoId || undefined,
    });
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={actualOpen} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Crear Egreso</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Egreso</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="fecha">Fecha *</Label>
            <Input
              id="fecha"
              type="date"
              value={form.fecha}
              onChange={(e) => handleChange("fecha", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="monto">Monto *</Label>
            <Input
              id="monto"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={form.monto}
              onChange={(e) => handleChange("monto", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoría General *</Label>
            <Input
              id="categoria"
              type="text"
              placeholder="Ej: Alquiler, Suministros, Sueldos"
              value={form.categoria}
              onChange={(e) => handleChange("categoria", e.target.value)}
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoriaEgresoId">Categoría Específica</Label>
            <Select
              value={form.categoriaEgresoId}
              onValueChange={(value) => handleChange("categoriaEgresoId", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecciona una categoría específica" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría</SelectItem>
                {categoriasEgreso.map((categoria) => (
                  <SelectItem key={categoria.id} value={categoria.id}>
                    {categoria.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción del egreso..."
              value={form.descripcion}
              onChange={(e) => handleChange("descripcion", e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creando..." : "Crear Egreso"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}