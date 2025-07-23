"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CompraConProveedor, ProductoParaCompra } from "@/types/compra";
import { useProductos } from "@/lib/react-query/queries/useProductos";
import { useProveedores } from "@/lib/react-query/queries/proveedores/useProveedores";
import { useEditarCompra } from "@/lib/react-query/mutations/compras/useEditarCompra";
import { toast } from "sonner";

interface Props {
  userId: string;
  compra: CompraConProveedor;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCompraModal({ userId, compra, open, onOpenChange }: Props) {
  const [proveedorId, setProveedorId] = useState<string>(
    compra.proveedorId ?? ""
  );
  const [fecha, setFecha] = useState<Date>(new Date(compra.fecha));
  const [descripcion, setDescripcion] = useState(compra.descripcion ?? "");
  const [productos, setProductos] = useState<ProductoParaCompra[]>(
    (compra.productos || []).map((p) => ({
      productoId: p.productoId,
      cantidad: p.cantidad,
      precioUnitario: p.precioUnitario,
    }))
  );

  const { data: proveedores = [] } = useProveedores(userId);
  const { data: productosDisponibles = [] } = useProductos(userId);
  const editarCompraMutation = useEditarCompra();

  const agregarProducto = () => {
    setProductos([
      ...productos,
      { productoId: "", cantidad: 1, precioUnitario: 0 },
    ]);
  };

  const actualizarProducto = (index: number, campo: string, valor: any) => {
    const actualizados = [...productos];
    (actualizados[index] as any)[campo] = valor;
    setProductos(actualizados);
  };

  const eliminarProducto = (index: number) => {
    setProductos(productos.filter((_, i) => i !== index));
  };

  const montoTotal = productos.reduce(
    (total, p) => total + p.cantidad * p.precioUnitario,
    0
  );

  const handleSubmit = () => {
    editarCompraMutation.mutate(
      {
        id: compra.id,
        userId,
        proveedorId,
        fecha: fecha.toISOString(),
        descripcion,
        monto: montoTotal,
        productos,
      },
      {
        onSuccess: () => {
          toast.success("Compra actualizada correctamente.");
          onOpenChange(false);
        },
        onError: () => {
          toast.error("Error al actualizar la compra.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Editar compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Proveedor</Label>
            <Select value={proveedorId} onValueChange={setProveedorId}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Seleccionar proveedor" />
              </SelectTrigger>
              <SelectContent>
                {proveedores.map((prov) => (
                  <SelectItem key={prov.id} value={prov.id}>
                    {prov.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Fecha</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left"
                >
                  {format(fecha, "dd 'de' MMMM yyyy", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent>
                <Calendar
                  mode="single"
                  selected={fecha}
                  onSelect={(date) => date && setFecha(date)}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div>
            <Label>Descripción</Label>
            <Textarea
              placeholder="Detalle de la compra"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
            />
          </div>

          <div className="space-y-4">
            <Label>Productos</Label>
            {productos.map((p, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end"
              >
                <div className="space-y-1">
                  <Label>Producto</Label>
                  <Select
                    value={p.productoId}
                    onValueChange={(val) =>
                      actualizarProducto(index, "productoId", val)
                    }
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Seleccionar producto" />
                    </SelectTrigger>
                    <SelectContent>
                      {productosDisponibles.map((prod) => (
                        <SelectItem key={prod.id} value={prod.id}>
                          {prod.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label>Cantidad</Label>
                  <Input
                    type="number"
                    min={0}
                    value={p.cantidad}
                    onChange={(e) => {
                      const val = parseInt(e.target.value);
                      actualizarProducto(
                        index,
                        "cantidad",
                        Number.isNaN(val) ? 0 : val
                      );
                    }}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Precio Unitario</Label>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={p.precioUnitario}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value);
                      actualizarProducto(
                        index,
                        "precioUnitario",
                        Number.isNaN(val) ? 0 : val
                      );
                    }}
                  />
                </div>

                <div>
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => eliminarProducto(index)}
                    className="mt-5"
                  >
                    ×
                  </Button>
                </div>
              </div>
            ))}

            <Button variant="outline" onClick={agregarProducto}>
              + Agregar producto
            </Button>
          </div>

          <div className="text-right font-medium">
            Total: ${montoTotal.toFixed(2)}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
