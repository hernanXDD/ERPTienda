-- Plantilla visual configurable para cupones de descuento

ALTER TABLE "configuracion_sistema"
ADD COLUMN "plantilla_cupon" VARCHAR(16) NOT NULL DEFAULT 'clasica';

UPDATE "configuracion_sistema"
SET "plantilla_cupon" = 'clasica'
WHERE "plantilla_cupon" IS NULL OR "plantilla_cupon" = '';
