-- Tabla de estados de facturación y relación en ventas

CREATE TABLE "estado_facturacion" (
  "id" CHAR(6) NOT NULL,
  "codigo" VARCHAR(32) NOT NULL,
  "nombre" VARCHAR(64) NOT NULL,
  "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "estado_facturacion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "estado_facturacion_codigo_key" ON "estado_facturacion"("codigo");

INSERT INTO "estado_facturacion" ("id", "codigo", "nombre") VALUES
  ('000001', 'PENDIENTE', 'Factura pendiente'),
  ('000002', 'FACTURADA', 'Facturada');

ALTER TABLE "venta" ADD COLUMN "estado_facturacion_id" CHAR(6);

UPDATE "venta"
SET "estado_facturacion_id" = CASE
  WHEN "estado_facturacion" = 'FACTURADA' THEN '000002'
  ELSE '000001'
END;

ALTER TABLE "venta"
  ALTER COLUMN "estado_facturacion_id" SET NOT NULL;

ALTER TABLE "venta"
  ADD CONSTRAINT "venta_estado_facturacion_id_fkey"
  FOREIGN KEY ("estado_facturacion_id") REFERENCES "estado_facturacion"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "venta" DROP COLUMN "estado_facturacion";

DROP TYPE "estado_facturacion_venta";

ALTER TABLE "venta" RENAME COLUMN "numero_factura" TO "facturacion";

CREATE INDEX "venta_estado_facturacion_id_idx" ON "venta"("estado_facturacion_id");
