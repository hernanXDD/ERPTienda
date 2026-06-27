-- Talles configurables para el catálogo de productos.

CREATE TYPE "TipoTalleCatalogo" AS ENUM ('LETRA', 'NUMERO', 'OTRO');

CREATE TABLE "talle_catalogo" (
  "id" CHAR(6) NOT NULL,
  "codigo" VARCHAR(32) NOT NULL,
  "nombre" VARCHAR(100) NOT NULL,
  "tipo" "TipoTalleCatalogo" NOT NULL DEFAULT 'OTRO',
  "habilitado" BOOLEAN NOT NULL DEFAULT true,
  "orden" INTEGER NOT NULL DEFAULT 0,
  "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "borrado" BOOLEAN NOT NULL DEFAULT false,
  "fecha_eliminacion" TIMESTAMPTZ(3),
  CONSTRAINT "talle_catalogo_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "talle_catalogo_codigo_key" ON "talle_catalogo"("codigo");
CREATE INDEX "talle_catalogo_habilitado_orden_idx" ON "talle_catalogo"("habilitado", "orden");
CREATE INDEX "talle_catalogo_tipo_habilitado_orden_idx" ON "talle_catalogo"("tipo", "habilitado", "orden");
CREATE INDEX "talle_catalogo_borrado_idx" ON "talle_catalogo"("borrado");

INSERT INTO "talle_catalogo" ("id", "codigo", "nombre", "tipo", "habilitado", "orden", "fecha_actualizacion")
VALUES
  ('000001', 'XS', 'XS', 'LETRA', true, 1, CURRENT_TIMESTAMP),
  ('000002', 'S', 'S', 'LETRA', true, 2, CURRENT_TIMESTAMP),
  ('000003', 'M', 'M', 'LETRA', true, 3, CURRENT_TIMESTAMP),
  ('000004', 'L', 'L', 'LETRA', true, 4, CURRENT_TIMESTAMP),
  ('000005', 'XL', 'XL', 'LETRA', true, 5, CURRENT_TIMESTAMP),
  ('000006', 'XXL', 'XXL', 'LETRA', true, 6, CURRENT_TIMESTAMP),
  ('000007', '36', '36', 'NUMERO', true, 7, CURRENT_TIMESTAMP),
  ('000008', '38', '38', 'NUMERO', true, 8, CURRENT_TIMESTAMP),
  ('000009', '40', '40', 'NUMERO', true, 9, CURRENT_TIMESTAMP),
  ('000010', '42', '42', 'NUMERO', true, 10, CURRENT_TIMESTAMP),
  ('000011', '44', '44', 'NUMERO', true, 11, CURRENT_TIMESTAMP),
  ('000012', '46', '46', 'NUMERO', true, 12, CURRENT_TIMESTAMP),
  ('000013', '48', '48', 'NUMERO', true, 13, CURRENT_TIMESTAMP),
  ('000014', 'ÚNICO', 'ÚNICO', 'OTRO', true, 14, CURRENT_TIMESTAMP);
