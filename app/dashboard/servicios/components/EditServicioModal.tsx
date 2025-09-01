"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useActualizarServicio } from "@/lib/react-query/mutations/servicios/useActualizarServicio";
import { Servicio } from "@/types/servicio";

const updateServicioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  precioBase: z.number().positive("El precio base debe ser positivo").optional(),
  tienePrecioFijo: z.boolean(),
});

type UpdateServicioForm = z.infer<typeof updateServicioSchema>;

interface EditServicioModalProps {
  userId: string;
  servicio: Servicio;
  isOpen: boolean;
  onClose: () => void;
}

export function EditServicioModal({
  userId,
  servicio,
  isOpen,
  onClose,
}: EditServicioModalProps) {
  const updateMutation = useActualizarServicio({ userId });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<UpdateServicioForm>({
    resolver: zodResolver(updateServicioSchema),
  });

  const tienePrecioFijo = watch("tienePrecioFijo");

  useEffect(() => {
    if (servicio && isOpen) {
      reset({
        nombre: servicio.nombre,
        descripcion: servicio.descripcion || "",
        precioBase: servicio.precioBase || undefined,
        tienePrecioFijo: servicio.precioBase !== null && servicio.precioBase !== undefined,
      });
    }
  }, [servicio, isOpen, reset]);

  const onSubmit = async (data: UpdateServicioForm) => {
    try {
      const servicioData = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioBase: data.tienePrecioFijo ? data.precioBase : undefined,
      };

      await updateMutation.mutateAsync({
        id: servicio.id,
        data: servicioData,
      });
      onClose();
    } catch (error) {
      console.error("Error al actualizar servicio:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Servicio</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre del Servicio</Label>
            <Input
              id="nombre"
              placeholder="Ej: Consultoría, Mantenimiento, etc."
              {...register("nombre")}
            />
            {errors.nombre && (
              <p className="text-sm text-red-500">{errors.nombre.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="descripcion">Descripción (opcional)</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe brevemente el servicio que ofreces..."
              rows={3}
              {...register("descripcion")}
            />
            {errors.descripcion && (
              <p className="text-sm text-red-500">{errors.descripcion.message}</p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="tienePrecioFijo"
              checked={tienePrecioFijo}
              onCheckedChange={(checked) => {
                setValue("tienePrecioFijo", checked);
                if (!checked) {
                  setValue("precioBase", undefined);
                }
              }}
            />
            <Label htmlFor="tienePrecioFijo">Tiene precio base fijo</Label>
          </div>

          {tienePrecioFijo && (
            <div className="space-y-2">
              <Label htmlFor="precioBase">Precio Base</Label>
              <Input
                id="precioBase"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                {...register("precioBase", {
                  setValueAs: (value) => value === "" ? undefined : Number(value),
                })}
              />
              {errors.precioBase && (
                <p className="text-sm text-red-500">{errors.precioBase.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Este será el precio sugerido, pero podrás modificarlo en cada venta
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={updateMutation.isPending}>
              {updateMutation.isPending ? "Actualizando..." : "Actualizar Servicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}