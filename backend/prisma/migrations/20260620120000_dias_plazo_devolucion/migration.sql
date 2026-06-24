-- Plazo máximo (en días desde la venta) para permitir devoluciones.
ALTER TABLE "configuracion_sistema"
ADD COLUMN "dias_plazo_devolucion" INTEGER NOT NULL DEFAULT 30;
