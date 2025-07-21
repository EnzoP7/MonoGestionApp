"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Proveedor } from "@/types/proveedor";
import { useActualizarProveedor } from "@/lib/react-query/mutations/proveedores/useActualizarProveedor";
import { zodResolver } from "@hookform/resolvers/zod";

const schema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
  descripcion: z.string().optional(),
});

interface Props {
  proveedor: Proveedor;
  userId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EditProveedorModal({
  proveedor,
  userId,
  isOpen,
  onClose,
}: Props) {
  const actualizar = useActualizarProveedor({ userId });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: proveedor,
  });

  const onSubmit = (data: any) => {
    actualizar.mutate({ id: proveedor.id, data });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar Proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register("nombre")} placeholder="Nombre" />
          <Input {...register("telefono")} placeholder="Teléfono" />
          <Input {...register("email")} placeholder="Email" />
          <Input {...register("direccion")} placeholder="Dirección" />
          <Textarea {...register("descripcion")} placeholder="Descripción" />
          <Button type="submit" className="w-full">
            Guardar Cambios
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
