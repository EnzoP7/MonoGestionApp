"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateProveedor } from "@/lib/react-query/mutations/proveedores/useCreateProveedor";

const schema = z.object({
  nombre: z.string().min(1),
  telefono: z.string().optional(),
  email: z.string().email().optional(),
  direccion: z.string().optional(),
  descripcion: z.string().optional(),
});

type Props = {
  userId: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function CreateProveedorModal({ userId, open, onOpenChange }: Props) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined && onOpenChange !== undefined;

  const crearProveedor = useCreateProveedor({ userId });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({ resolver: zodResolver(schema) });

  const handleClose = () => {
    if (isControlled) {
      onOpenChange(false);
    } else {
      setInternalOpen(false);
    }
    reset();
  };

  const onSubmit = (data: any) => {
    crearProveedor.mutate(
      { ...data, userId },
      {
        onSuccess: () => {
          handleClose();
        },
      }
    );
  };

  return (
    <Dialog
      open={isControlled ? open : internalOpen}
      onOpenChange={isControlled ? onOpenChange : setInternalOpen}
    >
      {!isControlled && (
        <DialogTrigger asChild>
          <Button> + Nuevo Proveedor</Button>
        </DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Crear Proveedor</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input {...register("nombre")} placeholder="Nombre" />
          <Input {...register("telefono")} placeholder="Teléfono" />
          <Input {...register("email")} placeholder="Email" />
          <Input {...register("direccion")} placeholder="Dirección" />
          <Textarea {...register("descripcion")} placeholder="Descripción" />
          <Button type="submit" className="w-full">
            Crear
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
