-- CreateEnum
CREATE TYPE "estado_cupon_descuento" AS ENUM ('activo', 'usado', 'anulado');

-- CreateTable
CREATE TABLE "cupon_descuento" (
    "id" CHAR(6) NOT NULL,
    "numero" VARCHAR(32) NOT NULL,
    "codigo" VARCHAR(16) NOT NULL,
    "cliente_id" CHAR(6),
    "nombre_cliente_mostrar" VARCHAR(200) NOT NULL,
    "documento_cliente_mostrar" VARCHAR(32) NOT NULL DEFAULT '',
    "monto" DECIMAL(14,2) NOT NULL,
    "monto_utilizado" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "estado" "estado_cupon_descuento" NOT NULL DEFAULT 'activo',
    "devolucion_id" CHAR(6),
    "observaciones" VARCHAR(1000) NOT NULL DEFAULT '',
    "registrado_por_usuario_id" CHAR(6),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_vencimiento" TIMESTAMPTZ(3),

    CONSTRAINT "cupon_descuento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cupon_descuento_numero_key" ON "cupon_descuento"("numero");
CREATE UNIQUE INDEX "cupon_descuento_codigo_key" ON "cupon_descuento"("codigo");
CREATE INDEX "cupon_descuento_cliente_id_idx" ON "cupon_descuento"("cliente_id");
CREATE INDEX "cupon_descuento_devolucion_id_idx" ON "cupon_descuento"("devolucion_id");
CREATE INDEX "cupon_descuento_estado_idx" ON "cupon_descuento"("estado");
CREATE INDEX "cupon_descuento_fecha_creacion_idx" ON "cupon_descuento"("fecha_creacion" DESC);

-- AddForeignKey
ALTER TABLE "cupon_descuento" ADD CONSTRAINT "cupon_descuento_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cupon_descuento" ADD CONSTRAINT "cupon_descuento_devolucion_id_fkey" FOREIGN KEY ("devolucion_id") REFERENCES "devolucion"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cupon_descuento" ADD CONSTRAINT "cupon_descuento_registrado_por_usuario_id_fkey" FOREIGN KEY ("registrado_por_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
