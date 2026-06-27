-- Formas de pago configurables (reemplaza enum forma_pago_venta).

CREATE TABLE "forma_pago" (
  "id" CHAR(6) NOT NULL,
  "codigo" VARCHAR(32) NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "facturar" BOOLEAN NOT NULL DEFAULT true,
  "habilitado" BOOLEAN NOT NULL DEFAULT true,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "borrado" BOOLEAN NOT NULL DEFAULT false,
  "fecha_eliminacion" TIMESTAMPTZ(3),
  CONSTRAINT "forma_pago_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "forma_pago_codigo_key" ON "forma_pago"("codigo");
CREATE INDEX "forma_pago_habilitado_orden_idx" ON "forma_pago"("habilitado", "orden");
CREATE INDEX "forma_pago_borrado_idx" ON "forma_pago"("borrado");

INSERT INTO "forma_pago" ("id", "codigo", "nombre", "facturar", "habilitado", "orden", "fecha_actualizacion")
VALUES
  ('000001', 'EFECTIVO', 'Efectivo', true, true, 1, CURRENT_TIMESTAMP),
  ('000002', 'DEBITO', 'Tarjeta débito', true, true, 2, CURRENT_TIMESTAMP),
  ('000003', 'CREDITO', 'Tarjeta crédito', true, true, 3, CURRENT_TIMESTAMP),
  ('000004', 'TRANSFERENCIA', 'Transferencia', true, true, 4, CURRENT_TIMESTAMP),
  ('000005', 'CUENTA_CORRIENTE', 'Cuenta corriente', false, true, 5, CURRENT_TIMESTAMP);

ALTER TABLE "venta" ALTER COLUMN "forma_pago" TYPE VARCHAR(32) USING "forma_pago"::text;

DROP TYPE "forma_pago_venta";
