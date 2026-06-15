-- Subtotal de líneas y ajuste firmado (negativo = descuento, positivo = recargo).
ALTER TABLE "venta" ADD COLUMN "subtotal" DECIMAL(14,2);
ALTER TABLE "venta" ADD COLUMN "ajuste_monto" DECIMAL(14,2) NOT NULL DEFAULT 0;

UPDATE "venta" SET "subtotal" = "total";

ALTER TABLE "venta" ALTER COLUMN "subtotal" SET NOT NULL;
