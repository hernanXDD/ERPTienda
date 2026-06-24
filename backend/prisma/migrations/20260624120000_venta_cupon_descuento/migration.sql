-- AlterTable
ALTER TABLE "venta" ADD COLUMN "cupon_descuento_id" CHAR(6);

-- CreateIndex
CREATE UNIQUE INDEX "venta_cupon_descuento_id_key" ON "venta"("cupon_descuento_id");

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_cupon_descuento_id_fkey" FOREIGN KEY ("cupon_descuento_id") REFERENCES "cupon_descuento"("id") ON DELETE SET NULL ON UPDATE CASCADE;
