-- CreateEnum
CREATE TYPE "tipo_auditoria_stock" AS ENUM ('venta', 'compra', 'conteo');

-- AlterTable
ALTER TABLE "movimiento_stock" ADD COLUMN     "auditoria_stock_id" CHAR(6),
ADD COLUMN     "compra_id" CHAR(6);

-- CreateTable
CREATE TABLE "auditoria_stock" (
    "id" CHAR(6) NOT NULL,
    "tipo" "tipo_auditoria_stock" NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "titulo" VARCHAR(255) NOT NULL,
    "referencia" VARCHAR(32),
    "nota" VARCHAR(500),
    "variacion_neta" INTEGER NOT NULL DEFAULT 0,
    "cantidad_movimientos" INTEGER NOT NULL DEFAULT 0,
    "venta_id" CHAR(6),
    "compra_id" CHAR(6),
    "ejecutado_por_usuario_id" CHAR(6),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_stock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "auditoria_stock_fecha_idx" ON "auditoria_stock"("fecha" DESC);

-- CreateIndex
CREATE INDEX "auditoria_stock_tipo_idx" ON "auditoria_stock"("tipo");

-- CreateIndex
CREATE INDEX "auditoria_stock_venta_id_idx" ON "auditoria_stock"("venta_id");

-- CreateIndex
CREATE INDEX "auditoria_stock_compra_id_idx" ON "auditoria_stock"("compra_id");

-- CreateIndex
CREATE INDEX "movimiento_stock_compra_id_idx" ON "movimiento_stock"("compra_id");

-- CreateIndex
CREATE INDEX "movimiento_stock_auditoria_stock_id_idx" ON "movimiento_stock"("auditoria_stock_id");

-- AddForeignKey
ALTER TABLE "auditoria_stock" ADD CONSTRAINT "auditoria_stock_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_stock" ADD CONSTRAINT "auditoria_stock_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria_stock" ADD CONSTRAINT "auditoria_stock_ejecutado_por_usuario_id_fkey" FOREIGN KEY ("ejecutado_por_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_auditoria_stock_id_fkey" FOREIGN KEY ("auditoria_stock_id") REFERENCES "auditoria_stock"("id") ON DELETE SET NULL ON UPDATE CASCADE;
