"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus } from "lucide-react";
import { useCrearServicio } from "@/lib/react-query/mutations/servicios/useCrearServicio";

const createServicioSchema = z.object({
  nombre: z.string().min(1, "El nombre es requerido"),
  descripcion: z.string().optional(),
  precioBase: z.number().positive("El precio base debe ser positivo").optional(),
  tienePrecioFijo: z.boolean(),
});

type CreateServicioForm = z.infer<typeof createServicioSchema>;

export function CreateServicioModal({ userId }: { userId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const createMutation = useCrearServicio({ userId });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<CreateServicioForm>({
    resolver: zodResolver(createServicioSchema),
    defaultValues: {
      nombre: "",
      descripcion: "",
      tienePrecioFijo: false,
    },
  });

  const tienePrecioFijo = watch("tienePrecioFijo");

  const onSubmit = async (data: CreateServicioForm) => {
    try {
      const servicioData = {
        nombre: data.nombre,
        descripcion: data.descripcion,
        precioBase: data.tienePrecioFijo ? data.precioBase : undefined,
      };

      await createMutation.mutateAsync(servicioData);
      setIsOpen(false);
      reset();
    } catch (error) {
      console.error("Error al crear servicio:", error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nuevo Servicio
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Servicio</DialogTitle>
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
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsOpen(false);
                reset();
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={createMutation.isPending}>
              {createMutation.isPending ? "Creando..." : "Crear Servicio"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}