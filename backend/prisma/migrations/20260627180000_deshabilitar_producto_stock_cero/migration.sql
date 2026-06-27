-- Días con stock en cero antes de desactivar variantes (0 = deshabilitado).
ALTER TABLE "configuracion_sistema"
  ADD COLUMN "dias_deshabilitar_producto_stock_cero" INTEGER NOT NULL DEFAULT 0;

-- Marca desde cuándo la variante está sin existencias.
ALTER TABLE "stock_variante"
  ADD COLUMN "fecha_agotado" TIMESTAMPTZ(3);

UPDATE "stock_variante"
SET "fecha_agotado" = "fecha_actualizacion"
WHERE "cantidad_actual" = 0;
