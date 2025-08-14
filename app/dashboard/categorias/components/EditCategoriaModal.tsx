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
import { useActualizarCategoria } from "@/lib/react-query/queries/categorias/useActualizarCategoria";

interface Categoria {
  id: string;
  nombre: string;
  tipo: string;
  tipoCategoria: "Ingreso" | "Egreso";
}

interface Props {
  userId: string;
  categoria: Categoria;
  isOpen: boolean;
  onClose: () => void;
}

export function EditCategoriaModal({
  userId,
  categoria,
  isOpen,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    nombre: "",
    tipo: "",
    tipoCategoria: "" as "Ingreso" | "Egreso",
  });

  useEffect(() => {
    if (categoria) {
      setForm({
        nombre: categoria.nombre,
        tipo: categoria.tipo,
        tipoCategoria: categoria.tipoCategoria,
      });
    }
  }, [categoria]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mutation = useActualizarCategoria({
    userId,
    categoriaId: categoria.id,
    tipoCategoria: categoria.tipoCategoria,
    form,
    onSuccess: () => {
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Categoría</DialogTitle>
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
                <SelectValue />
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
              required
            />
          </div>

          <div>
            <Label htmlFor="tipo">Tipo/Descripción</Label>
            <Input
              name="tipo"
              value={form.tipo}
              onChange={handleChange}
              required
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Guardando cambios..." : "Guardar cambios"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
