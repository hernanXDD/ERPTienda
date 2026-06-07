-- Catálogo motivo + FK en movimiento_stock (reemplaza enum motivo_movimiento_stock)

CREATE TABLE "motivo" (
    "id" CHAR(6) NOT NULL,
    "codigo" VARCHAR(32) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL DEFAULT '',
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "motivo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "motivo_codigo_key" ON "motivo"("codigo");
CREATE INDEX "motivo_activo_idx" ON "motivo"("activo");

INSERT INTO "motivo" ("id", "codigo", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion")
VALUES
    ('000001', 'salidaPorVenta', 'Salida por venta', 'Descuento de inventario al registrar una venta.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('000002', 'entradaPorCompra', 'Entrada por compra', 'Ingreso de mercadería por compra a proveedor o entrada manual.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('000003', 'ajustePorConteo', 'Ajuste por conteo', 'Corrección de stock tras conteo físico o importación masiva.', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

ALTER TABLE "movimiento_stock" ADD COLUMN "motivo_id" CHAR(6);

UPDATE "movimiento_stock" SET "motivo_id" = '000001' WHERE "motivo" = 'salidaPorVenta';
UPDATE "movimiento_stock" SET "motivo_id" = '000002' WHERE "motivo" = 'entradaPorCompra';
UPDATE "movimiento_stock" SET "motivo_id" = '000003' WHERE "motivo" = 'ajustePorConteo';

ALTER TABLE "movimiento_stock" ALTER COLUMN "motivo_id" SET NOT NULL;

ALTER TABLE "movimiento_stock" DROP COLUMN "motivo";

DROP TYPE "motivo_movimiento_stock";

CREATE INDEX "movimiento_stock_motivo_id_idx" ON "movimiento_stock"("motivo_id");

ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_motivo_id_fkey"
    FOREIGN KEY ("motivo_id") REFERENCES "motivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
