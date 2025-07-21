-- AlterTable
ALTER TABLE "Compra" ADD COLUMN     "egresoId" TEXT;

-- AddForeignKey
ALTER TABLE "Compra" ADD CONSTRAINT "Compra_egresoId_fkey" FOREIGN KEY ("egresoId") REFERENCES "Egreso"("id") ON DELETE SET NULL ON UPDATE CASCADE;
