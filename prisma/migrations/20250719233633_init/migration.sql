/*
  Warnings:

  - You are about to drop the column `proveedor` on the `Compra` table. All the data in the column will be lost.
  - You are about to drop the column `servicioId` on the `Venta` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Venta" DROP CONSTRAINT "Venta_servicioId_fkey";

-- AlterTable
ALTER TABLE "Compra" DROP COLUMN "proveedor",
ADD COLUMN     "proveedorId" TEXT;

-- AlterTable
ALTER TABLE "Egreso" ADD COLUMN     "categoriaEgresoId" TEXT;

-- AlterTable
ALTER TABLE "Ingreso" ADD COLUMN     "categoriaIngresoId" TEXT;

-- AlterTable
ALTER TABLE "Venta" DROP COLUMN "servicioId";

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "descripcion" TEXT,
    "precio" DOUBLE PRECISION NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "telefono" TEXT,
    "email" TEXT,
    "direccion" TEXT,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VentaServicio" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "servicioId" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "precio" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "VentaServicio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Movimiento" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "monto" DOUBLE PRECISION NOT NULL,
    "descripcion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movimiento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reporte" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "desde" TIMESTAMP(3) NOT NULL,
    "hasta" TIMESTAMP(3) NOT NULL,
    "url" TEXT,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reporte_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaIngreso" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoriaIngreso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CategoriaEgreso" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CategoriaEgreso_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Ingreso" ADD CONSTRAINT "Ingreso_categoriaIngresoId_fkey" FOREIGN KEY ("categoriaIngresoId") REFERENCES "CategoriaIngreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Egreso" ADD CONSTRAINT "Egreso_categoriaEgresoId_fkey" FOREIGN KEY ("categoriaEgresoId") REFERENCES "CategoriaEgreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_proveedorId_fkey" FOREIGN KEY ("proveedorId") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaServicio" ADD CONSTRAINT "VentaServicio_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VentaServicio" ADD CONSTRAINT "VentaServicio_servicioId_fkey" FOREIGN KEY ("servicioId") REFERENCES "Servicio"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Movimiento" ADD CONSTRAINT "Movimiento_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reporte" ADD CONSTRAINT "Reporte_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaIngreso" ADD CONSTRAINT "CategoriaIngreso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CategoriaEgreso" ADD CONSTRAINT "CategoriaEgreso_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
