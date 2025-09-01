import { ClientesTable } from "./components/clientes-table";

export default function ClientesPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground">
            Gestiona tu base de clientes y sus datos de contacto.
          </p>
        </div>
        <ClientesTable />
      </div>
    </div>
  );
}