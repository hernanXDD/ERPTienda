-- Borrado lógico: columna borrado + índices únicos parciales (solo registros activos)

ALTER TABLE "usuario" ADD COLUMN "borrado" BOOLEAN NOT NULL DEFAULT false;
UPDATE "usuario" SET "borrado" = true WHERE "fecha_eliminacion" IS NOT NULL;

ALTER TABLE "producto" ADD COLUMN "borrado" BOOLEAN NOT NULL DEFAULT false;
UPDATE "producto" SET "borrado" = true WHERE "fecha_eliminacion" IS NOT NULL;

ALTER TABLE "cliente" ADD COLUMN "borrado" BOOLEAN NOT NULL DEFAULT false;
UPDATE "cliente" SET "borrado" = true WHERE "fecha_eliminacion" IS NOT NULL;

ALTER TABLE "proveedor" ADD COLUMN "borrado" BOOLEAN NOT NULL DEFAULT false;
UPDATE "proveedor" SET "borrado" = true WHERE "fecha_eliminacion" IS NOT NULL;

ALTER TABLE "categoria" ADD COLUMN "borrado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "categoria" ADD COLUMN "fecha_eliminacion" TIMESTAMPTZ(3);

ALTER TABLE "variante" ADD COLUMN "borrado" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "variante" ADD COLUMN "fecha_eliminacion" TIMESTAMPTZ(3);

DROP INDEX IF EXISTS "usuario_nombre_usuario_key";
CREATE UNIQUE INDEX "usuario_nombre_usuario_activo_key" ON "usuario"("nombre_usuario") WHERE "borrado" = false;

DROP INDEX IF EXISTS "categoria_nombre_key";
CREATE UNIQUE INDEX "categoria_nombre_activo_key" ON "categoria"("nombre") WHERE "borrado" = false;

DROP INDEX IF EXISTS "variante_producto_id_talle_color_key";
CREATE UNIQUE INDEX "variante_producto_id_talle_color_activo_key" ON "variante"("producto_id", "talle", "color") WHERE "borrado" = false;

DROP INDEX IF EXISTS "cliente_documento_key";
CREATE UNIQUE INDEX "cliente_documento_activo_key" ON "cliente"("documento") WHERE "borrado" = false;

DROP INDEX IF EXISTS "proveedor_documento_key";
CREATE UNIQUE INDEX "proveedor_documento_activo_key" ON "proveedor"("documento") WHERE "borrado" = false;

CREATE INDEX "usuario_nombre_usuario_idx" ON "usuario"("nombre_usuario");
CREATE INDEX "usuario_borrado_idx" ON "usuario"("borrado");

CREATE INDEX "categoria_nombre_idx" ON "categoria"("nombre");
CREATE INDEX "categoria_borrado_idx" ON "categoria"("borrado");

CREATE INDEX "producto_borrado_idx" ON "producto"("borrado");

CREATE INDEX "variante_producto_id_talle_color_idx" ON "variante"("producto_id", "talle", "color");
CREATE INDEX "variante_borrado_idx" ON "variante"("borrado");

CREATE INDEX "cliente_documento_idx" ON "cliente"("documento");
CREATE INDEX "cliente_borrado_idx" ON "cliente"("borrado");

CREATE INDEX "proveedor_documento_idx" ON "proveedor"("documento");
CREATE INDEX "proveedor_borrado_idx" ON "proveedor"("borrado");
