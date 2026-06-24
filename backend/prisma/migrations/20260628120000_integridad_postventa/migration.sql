-- Integridad postventa: cupones por devolución, líneas de devolución y coherencia de datos.

-- Un cupón activo o usado por devolución (evita duplicados por concurrencia).
CREATE UNIQUE INDEX "cupon_descuento_devolucion_activo_key"
  ON "cupon_descuento" ("devolucion_id")
  WHERE "devolucion_id" IS NOT NULL
    AND "estado" IN ('activo', 'usado');

-- Una sola fila por línea de venta dentro de cada devolución.
CREATE UNIQUE INDEX "devolucion_linea_devolucion_venta_linea_key"
  ON "devolucion_linea" ("devolucion_id", "venta_linea_id");

-- Cantidades siempre positivas.
ALTER TABLE "devolucion_linea"
  ADD CONSTRAINT "devolucion_linea_cantidad_positiva" CHECK ("cantidad" > 0);

ALTER TABLE "venta_linea"
  ADD CONSTRAINT "venta_linea_cantidad_positiva" CHECK ("cantidad" > 0);

-- Coherencia tipo de descuento del cupón.
ALTER TABLE "cupon_descuento"
  ADD CONSTRAINT "cupon_descuento_tipo_coherente" CHECK (
    (
      "tipo_descuento" = 'porcentaje'
      AND "porcentaje_descuento" IS NOT NULL
      AND "porcentaje_descuento" > 0
      AND "porcentaje_descuento" <= 100
      AND "monto_descuento" IS NULL
    )
    OR (
      "tipo_descuento" = 'monto_fijo'
      AND "monto_descuento" IS NOT NULL
      AND "monto_descuento" > 0
      AND "porcentaje_descuento" IS NULL
    )
  );
