/*
  Warnings:

  - Added the required column `tipo` to the `Venta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "tipo" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "VentaProducto" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "productoId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VentaProducto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "VentaProducto" ADD CONSTRAINT "VentaProducto_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaProducto" ADD CONSTRAINT "VentaProducto_productoId_fkey" FOREIGN KEY ("productoId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
