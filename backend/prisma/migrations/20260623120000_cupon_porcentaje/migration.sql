-- Cupones por porcentaje: código secreto único y vencimiento obligatorio
ALTER TABLE "cupon_descuento" ADD COLUMN "porcentaje_descuento" DECIMAL(5, 2);

UPDATE "cupon_descuento"
SET "porcentaje_descuento" = 10
WHERE "porcentaje_descuento" IS NULL;

ALTER TABLE "cupon_descuento" ALTER COLUMN "porcentaje_descuento" SET NOT NULL;

UPDATE "cupon_descuento"
SET "fecha_vencimiento" = "fecha_creacion" + INTERVAL '90 days'
WHERE "fecha_vencimiento" IS NULL;

ALTER TABLE "cupon_descuento" ALTER COLUMN "fecha_vencimiento" SET NOT NULL;

ALTER TABLE "cupon_descuento" ALTER COLUMN "codigo" TYPE VARCHAR(32);

ALTER TABLE "cupon_descuento" DROP COLUMN "monto";
ALTER TABLE "cupon_descuento" DROP COLUMN "monto_utilizado";
