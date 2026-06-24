-- Devoluciones de venta y motivo de stock asociado.
ALTER TYPE "tipo_auditoria_stock" ADD VALUE IF NOT EXISTS 'devolucion';

CREATE TABLE "devolucion" (
    "id" CHAR(6) NOT NULL,
    "numero" VARCHAR(32) NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "venta_id" CHAR(6) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "observaciones" VARCHAR(1000) NOT NULL DEFAULT '',
    "registrado_por_usuario_id" CHAR(6),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "devolucion_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "devolucion_numero_key" ON "devolucion"("numero");
CREATE INDEX "devolucion_venta_id_idx" ON "devolucion"("venta_id");
CREATE INDEX "devolucion_fecha_idx" ON "devolucion"("fecha" DESC);

CREATE TABLE "devolucion_linea" (
    "id" CHAR(6) NOT NULL,
    "devolucion_id" CHAR(6) NOT NULL,
    "venta_linea_id" CHAR(6) NOT NULL,
    "variante_id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "devolucion_linea_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "devolucion_linea_devolucion_id_idx" ON "devolucion_linea"("devolucion_id");
CREATE INDEX "devolucion_linea_venta_linea_id_idx" ON "devolucion_linea"("venta_linea_id");

ALTER TABLE "auditoria_stock" ADD COLUMN "devolucion_id" CHAR(6);
CREATE INDEX "auditoria_stock_devolucion_id_idx" ON "auditoria_stock"("devolucion_id");

ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_venta_id_fkey"
    FOREIGN KEY ("venta_id") REFERENCES "venta"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "devolucion" ADD CONSTRAINT "devolucion_registrado_por_usuario_id_fkey"
    FOREIGN KEY ("registrado_por_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "devolucion_linea" ADD CONSTRAINT "devolucion_linea_devolucion_id_fkey"
    FOREIGN KEY ("devolucion_id") REFERENCES "devolucion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "devolucion_linea" ADD CONSTRAINT "devolucion_linea_venta_linea_id_fkey"
    FOREIGN KEY ("venta_linea_id") REFERENCES "venta_linea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "auditoria_stock" ADD CONSTRAINT "auditoria_stock_devolucion_id_fkey"
    FOREIGN KEY ("devolucion_id") REFERENCES "devolucion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

INSERT INTO "motivo" ("id", "nombre", "descripcion", "activo", "fecha_creacion", "fecha_actualizacion")
VALUES (
    '000004',
    'Entrada por devolución',
    'Reingreso de mercadería por devolución de una venta.',
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;
