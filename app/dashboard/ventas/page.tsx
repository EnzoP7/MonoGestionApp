import { VentasTable } from "./components/ventas-table";

export default function VentasPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Ventas</h1>
          <p className="text-muted-foreground">
            Gestiona tus ventas de productos y servicios con control automático de stock.
          </p>
        </div>
        <VentasTable />
      </div>
    </div>
  );
}