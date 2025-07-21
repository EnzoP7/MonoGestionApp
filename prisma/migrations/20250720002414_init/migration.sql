-- CreateTable
CREATE TABLE "CompraProducto" (
    "id" TEXT NOT NULL,
    "compraId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precioUnitario" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompraProducto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CompraProducto" ADD CONSTRAINT "CompraProducto_compraId_fkey" FOREIGN KEY ("compraId") REFERENCES "Compra"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompraProducto" ADD CONSTRAINT "CompraProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
