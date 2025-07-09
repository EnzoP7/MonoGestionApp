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
import { Switch } from "@/components/ui/switch";
import { Producto } from "@/types/producto";
import { useActualizarProducto } from "@/lib/react-query/mutations/productos/useActualizarProducto";

interface Props {
  userId: string;
  producto: Producto;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProductoModal({
  userId,
  producto,
  isOpen,
  onClose,
}: Props) {
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    cantidad: "",
    activo: true,
  });

  useEffect(() => {
    if (producto) {
      setForm({
        nombre: producto.nombre,
        descripcion: producto.descripcion || "",
        precio: String(producto.precio),
        cantidad: String(producto.cantidad),
        activo: producto.activo,
      });
    }
  }, [producto]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mutation = useActualizarProducto({
    userId,
    productoId: producto.id,
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
          <DialogTitle>Editar Producto</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            <Label htmlFor="descripcion">Descripción</Label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              className="w-full rounded-md border border-input px-3 py-2 text-sm"
              rows={4}
            />
          </div>
          <div>
            <Label htmlFor="precio">Precio</Label>
            <Input
              name="precio"
              type="number"
              step="0.01"
              value={form.precio}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="cantidad">Cantidad</Label>
            <Input
              name="cantidad"
              type="number"
              value={form.cantidad}
              onChange={handleChange}
              required
            />
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="activo">Activo</Label>
            <Switch
              checked={form.activo}
              onCheckedChange={(v) =>
                setForm((prev) => ({ ...prev, activo: v }))
              }
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
