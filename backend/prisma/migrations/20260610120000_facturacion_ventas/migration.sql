-- Condición IVA del cliente y datos de facturación en ventas

CREATE TYPE "condicion_iva_cliente" AS ENUM (
  'CONSUMIDOR_FINAL',
  'RESPONSABLE_INSCRIPTO',
  'MONOTRIBUTO',
  'EXENTO',
  'NO_RESPONSABLE'
);

CREATE TYPE "estado_facturacion_venta" AS ENUM ('PENDIENTE', 'FACTURADA');

ALTER TABLE "cliente"
  ADD COLUMN "condicion_iva" "condicion_iva_cliente" NOT NULL DEFAULT 'CONSUMIDOR_FINAL';

ALTER TABLE "venta"
  ADD COLUMN "documento_cliente_mostrar" VARCHAR(32) NOT NULL DEFAULT '',
  ADD COLUMN "condicion_iva_cliente" "condicion_iva_cliente" NOT NULL DEFAULT 'CONSUMIDOR_FINAL',
  ADD COLUMN "estado_facturacion" "estado_facturacion_venta" NOT NULL DEFAULT 'PENDIENTE',
  ADD COLUMN "numero_factura" VARCHAR(32) NOT NULL DEFAULT '';

UPDATE "venta" AS v
SET
  "documento_cliente_mostrar" = c."documento",
  "condicion_iva_cliente" = c."condicion_iva"
FROM "cliente" AS c
WHERE v."cliente_id" = c."id"
  AND v."documento_cliente_mostrar" = '';
