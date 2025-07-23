"use client";

import { useState } from "react";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { cn } from "@/lib/utils";
import {
  Select,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectContent,
} from "@/components/ui/select";

import { useProductos } from "@/lib/react-query/queries/useProductos";
import { useCrearCompra } from "@/lib/react-query/mutations/compras/useCrearCompra";
import { useProveedores } from "@/lib/react-query/queries/proveedores/useProveedores";
import { CompraProducto } from "@/types/compraProducto";
import { ProductoParaCompra } from "@/types/compra";
import { toast } from "sonner";
import { ProveedorCombobox } from "@/app/api/proveedores/components/ProveedorCombobox";
import { CreateProveedorModal } from "../../proveedores/components/CreateProveedorModal";
import { CreateProductoModal } from "../../productos/components/CreateProductoModal";
import { ProductoCombobox } from "../../productos/components/ProductoCombobox";

export function CreateCompraModal({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [proveedorId, setProveedorId] = useState<string>("");
  const [fecha, setFecha] = useState<Date>(new Date());
  const [descripcion, setDescripcion] = useState("");
  const [productos, setProductos] = useState<ProductoParaCompra[]>([]);

  const { data: proveedores = [] } = useProveedores(userId);
  const { data: productosDisponibles = [] } = useProductos(userId);

  const [showCreateProveedorModal, setShowCreateProveedorModal] =
    useState(false);
  const [showCreateProductoModal, setShowCreateProductoModal] = useState(false);

  const crearCompraMutation = useCrearCompra({ userId });

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
    if (!proveedorId || productos.length === 0) {
      return toast(
        "Por favor selecciona un proveedor y agrega al menos un producto."
      );
    }

    crearCompraMutation.mutate(
      {
        proveedorId,
        fecha: fecha.toISOString(),
        descripcion,
        productos,
      },
      {
        onSuccess: () => {
          toast.success("Compra registrada correctamente.");
          setOpen(false);
          setProveedorId("");
          setDescripcion("");
          setProductos([]);
          setFecha(new Date());
        },
        onError: () => {
          toast.error("Ocurrió un error al guardar la compra.");
        },
      }
    );
  };
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>+ Nueva Compra</Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Registrar nueva compra</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>Proveedor</Label>
            <ProveedorCombobox
              value={proveedorId}
              onChange={setProveedorId}
              proveedores={proveedores}
              onCrearNuevo={() => setShowCreateProveedorModal(true)}
            />
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
          <div className="space-y-1 col-span-full">
            <Label>Productos</Label>
            {productos.map((p, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-5 gap-y-4 gap-1 items-end"
              >
                <div className="space-y-1 md:col-span-2 col-span-full">
                  <Label>Producto</Label>
                  <ProductoCombobox
                    value={p.productoId}
                    onChange={(val) =>
                      actualizarProducto(index, "productoId", val)
                    }
                    productos={productosDisponibles}
                    onCrearNuevo={() => setShowCreateProductoModal(true)}
                  />
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

                <div className="flex items-center justify-end">
                  <Button
                    variant="destructive"
                    size="icon"
                    onClick={() => eliminarProducto(index)}
                    className=""
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
        {showCreateProveedorModal && (
          <CreateProveedorModal
            userId={userId}
            open={showCreateProveedorModal}
            onOpenChange={setShowCreateProveedorModal}
          />
        )}

        {showCreateProductoModal && (
          <CreateProductoModal
            userId={userId}
            open={showCreateProductoModal}
            onOpenChange={setShowCreateProductoModal}
          />
        )}
        <DialogFooter>
          <Button onClick={handleSubmit}>Guardar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
