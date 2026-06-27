-- Documento normalizado (unicidad real) y FK venta/compra en movimientos CC.

-- Cliente
ALTER TABLE "cliente" ADD COLUMN "documento_normalizado" VARCHAR(32);

UPDATE "cliente"
SET "documento_normalizado" = lower(regexp_replace(trim("documento"), '[^a-zA-Z0-9]', '', 'g'));

ALTER TABLE "cliente" ALTER COLUMN "documento_normalizado" SET NOT NULL;

DROP INDEX IF EXISTS "cliente_documento_activo_key";
CREATE UNIQUE INDEX "cliente_documento_normalizado_activo_key"
  ON "cliente"("documento_normalizado") WHERE "borrado" = false;
CREATE INDEX "cliente_documento_normalizado_idx" ON "cliente"("documento_normalizado");

-- Proveedor
ALTER TABLE "proveedor" ADD COLUMN "documento_normalizado" VARCHAR(32);

UPDATE "proveedor"
SET "documento_normalizado" = lower(regexp_replace(trim("documento"), '[^a-zA-Z0-9]', '', 'g'));

ALTER TABLE "proveedor" ALTER COLUMN "documento_normalizado" SET NOT NULL;

DROP INDEX IF EXISTS "proveedor_documento_activo_key";
CREATE UNIQUE INDEX "proveedor_documento_normalizado_activo_key"
  ON "proveedor"("documento_normalizado") WHERE "borrado" = false;
CREATE INDEX "proveedor_documento_normalizado_idx" ON "proveedor"("documento_normalizado");

-- Movimiento CC cliente → venta
ALTER TABLE "movimiento_cuenta_corriente" ADD COLUMN "venta_id" CHAR(6);

ALTER TABLE "movimiento_cuenta_corriente"
  ADD CONSTRAINT "movimiento_cuenta_corriente_venta_id_fkey"
  FOREIGN KEY ("venta_id") REFERENCES "venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "movimiento_cuenta_corriente" AS m
SET "venta_id" = v."id"
FROM "venta" AS v
WHERE m."tipo_movimiento" = 'cargo'
  AND m."descripcion" = 'Venta ' || v."numero";

CREATE INDEX "movimiento_cuenta_corriente_venta_id_idx" ON "movimiento_cuenta_corriente"("venta_id");

-- Movimiento CC proveedor → compra
ALTER TABLE "movimiento_cuenta_corriente_proveedor" ADD COLUMN "compra_id" CHAR(6);

ALTER TABLE "movimiento_cuenta_corriente_proveedor"
  ADD CONSTRAINT "movimiento_cuenta_corriente_proveedor_compra_id_fkey"
  FOREIGN KEY ("compra_id") REFERENCES "compra"("id") ON DELETE SET NULL ON UPDATE CASCADE;

UPDATE "movimiento_cuenta_corriente_proveedor" AS m
SET "compra_id" = c."id"
FROM "compra" AS c
WHERE m."tipo_movimiento" = 'cargo'
  AND m."descripcion" = 'Compra ' || c."numero";

CREATE INDEX "movimiento_cuenta_corriente_proveedor_compra_id_idx"
  ON "movimiento_cuenta_corriente_proveedor"("compra_id");
