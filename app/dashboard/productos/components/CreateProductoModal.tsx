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
import { Switch } from "@/components/ui/switch";
import { useCrearProducto } from "@/lib/react-query/mutations/productos/useCrearProducto";

export function CreateProductoModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    nombre: "",
    descripcion: "",
    precio: "",
    cantidad: "",
    activo: true,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const mutation = useCrearProducto({
    userId,
    form,
    onSuccess: () => {
      setOpen(false);
      setForm({
        nombre: "",
        descripcion: "",
        precio: "",
        cantidad: "",
        activo: true,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">+ Crear producto</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
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
            {mutation.isPending ? "Guardando..." : "Guardar"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
