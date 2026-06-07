-- CreateEnum
CREATE TYPE "rol_usuario" AS ENUM ('ADMIN', 'DUENO', 'EMPLEADO');

-- CreateEnum
CREATE TYPE "motivo_movimiento_stock" AS ENUM ('salidaPorVenta', 'entradaPorCompra', 'ajustePorConteo');

-- CreateEnum
CREATE TYPE "forma_pago_venta" AS ENUM ('EFECTIVO', 'DEBITO', 'CREDITO', 'TRANSFERENCIA', 'CUENTA_CORRIENTE');

-- CreateEnum
CREATE TYPE "condicion_compra" AS ENUM ('CONTADO', 'CUENTA_PROVEEDOR');

-- CreateEnum
CREATE TYPE "tipo_movimiento_cuenta_corriente" AS ENUM ('cargo', 'pagoRegistrado');

-- CreateTable
CREATE TABLE "usuario" (
    "id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(64) NOT NULL,
    "apellido" VARCHAR(64) NOT NULL,
    "nombre_usuario" VARCHAR(64) NOT NULL,
    "contrasena_hash" VARCHAR(255) NOT NULL,
    "contrasena_esta_blanqueada" BOOLEAN NOT NULL DEFAULT false,
    "rol" "rol_usuario" NOT NULL,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "permisos_json" JSONB NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMPTZ(3),

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categoria" (
    "id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL DEFAULT '',
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "categoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producto" (
    "id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "marca" VARCHAR(120) NOT NULL,
    "descripcion" VARCHAR(1000) NOT NULL DEFAULT '',
    "categoria_id" CHAR(6) NOT NULL,
    "precio_venta" DECIMAL(14,2) NOT NULL,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMPTZ(3),

    CONSTRAINT "producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "variante" (
    "id" CHAR(6) NOT NULL,
    "producto_id" CHAR(6) NOT NULL,
    "talle" VARCHAR(32) NOT NULL,
    "color" VARCHAR(64) NOT NULL,
    "codigo_barras" VARCHAR(64) NOT NULL DEFAULT '',
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "variante_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_variante" (
    "variante_id" CHAR(6) NOT NULL,
    "cantidad_actual" INTEGER NOT NULL DEFAULT 0,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "stock_variante_pkey" PRIMARY KEY ("variante_id")
);

-- CreateTable
CREATE TABLE "movimiento_stock" (
    "id" CHAR(6) NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "variante_id" CHAR(6) NOT NULL,
    "nombre_variante" VARCHAR(255) NOT NULL,
    "motivo" "motivo_movimiento_stock" NOT NULL,
    "cantidad_variacion" INTEGER NOT NULL,
    "stock_resultante" INTEGER NOT NULL,
    "venta_id" CHAR(6),
    "numero_venta" VARCHAR(32),
    "nota" VARCHAR(500),
    "ejecutado_por_usuario_id" CHAR(6),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cliente" (
    "id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "documento" VARCHAR(32) NOT NULL,
    "correo_electronico" VARCHAR(255) NOT NULL DEFAULT '',
    "telefono_principal" VARCHAR(32) NOT NULL DEFAULT '',
    "telefono_alternativo" VARCHAR(32) NOT NULL DEFAULT '',
    "direccion" VARCHAR(500) NOT NULL DEFAULT '',
    "limite_compra_cuenta_corriente" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "cuenta_corriente_habilitada" BOOLEAN NOT NULL DEFAULT false,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMPTZ(3),

    CONSTRAINT "cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimiento_cuenta_corriente" (
    "id" CHAR(6) NOT NULL,
    "cliente_id" CHAR(6) NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_movimiento" "tipo_movimiento_cuenta_corriente" NOT NULL,
    "importe" DECIMAL(14,2) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "auditoria_pago_json" JSONB,
    "registrado_por_usuario_id" CHAR(6),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_cuenta_corriente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "proveedor" (
    "id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "documento" VARCHAR(32) NOT NULL,
    "correo_electronico" VARCHAR(255) NOT NULL DEFAULT '',
    "telefono_principal" VARCHAR(32) NOT NULL DEFAULT '',
    "telefono_alternativo" VARCHAR(32) NOT NULL DEFAULT '',
    "direccion" VARCHAR(500) NOT NULL DEFAULT '',
    "limite_credito_compras" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "compras_credito_habilitadas" BOOLEAN NOT NULL DEFAULT false,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,
    "fecha_eliminacion" TIMESTAMPTZ(3),

    CONSTRAINT "proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra" (
    "id" CHAR(6) NOT NULL,
    "numero" VARCHAR(32) NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor_id" CHAR(6) NOT NULL,
    "nombre_proveedor_mostrar" VARCHAR(200) NOT NULL,
    "condicion_compra" "condicion_compra" NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "observaciones" VARCHAR(1000) NOT NULL DEFAULT '',
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "compra_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "compra_linea" (
    "id" CHAR(6) NOT NULL,
    "compra_id" CHAR(6) NOT NULL,
    "variante_id" CHAR(6),
    "nombre" VARCHAR(255) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "costo_unitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "compra_linea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta" (
    "id" CHAR(6) NOT NULL,
    "numero" VARCHAR(32) NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cliente_id" CHAR(6),
    "nombre_cliente_mostrar" VARCHAR(200) NOT NULL,
    "forma_pago" "forma_pago_venta" NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "observaciones" VARCHAR(1000) NOT NULL DEFAULT '',
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "venta_linea" (
    "id" CHAR(6) NOT NULL,
    "venta_id" CHAR(6) NOT NULL,
    "variante_id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(255) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario" DECIMAL(14,2) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "venta_linea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "usuario_nombre_usuario_key" ON "usuario"("nombre_usuario");

-- CreateIndex
CREATE INDEX "usuario_habilitado_idx" ON "usuario"("habilitado");

-- CreateIndex
CREATE INDEX "usuario_rol_idx" ON "usuario"("rol");

-- CreateIndex
CREATE UNIQUE INDEX "categoria_nombre_key" ON "categoria"("nombre");

-- CreateIndex
CREATE INDEX "producto_categoria_id_idx" ON "producto"("categoria_id");

-- CreateIndex
CREATE INDEX "producto_nombre_idx" ON "producto"("nombre");

-- CreateIndex
CREATE INDEX "variante_codigo_barras_idx" ON "variante"("codigo_barras");

-- CreateIndex
CREATE INDEX "variante_activa_idx" ON "variante"("activa");

-- CreateIndex
CREATE UNIQUE INDEX "variante_producto_id_talle_color_key" ON "variante"("producto_id", "talle", "color");

-- CreateIndex
CREATE INDEX "movimiento_stock_variante_id_fecha_idx" ON "movimiento_stock"("variante_id", "fecha" DESC);

-- CreateIndex
CREATE INDEX "movimiento_stock_venta_id_idx" ON "movimiento_stock"("venta_id");

-- CreateIndex
CREATE UNIQUE INDEX "cliente_documento_key" ON "cliente"("documento");

-- CreateIndex
CREATE INDEX "cliente_habilitado_idx" ON "cliente"("habilitado");

-- CreateIndex
CREATE INDEX "cliente_nombre_idx" ON "cliente"("nombre");

-- CreateIndex
CREATE INDEX "movimiento_cuenta_corriente_cliente_id_fecha_idx" ON "movimiento_cuenta_corriente"("cliente_id", "fecha" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "proveedor_documento_key" ON "proveedor"("documento");

-- CreateIndex
CREATE INDEX "proveedor_habilitado_idx" ON "proveedor"("habilitado");

-- CreateIndex
CREATE UNIQUE INDEX "compra_numero_key" ON "compra"("numero");

-- CreateIndex
CREATE INDEX "compra_fecha_idx" ON "compra"("fecha" DESC);

-- CreateIndex
CREATE INDEX "compra_proveedor_id_idx" ON "compra"("proveedor_id");

-- CreateIndex
CREATE INDEX "compra_linea_compra_id_idx" ON "compra_linea"("compra_id");

-- CreateIndex
CREATE UNIQUE INDEX "venta_numero_key" ON "venta"("numero");

-- CreateIndex
CREATE INDEX "venta_fecha_idx" ON "venta"("fecha" DESC);

-- CreateIndex
CREATE INDEX "venta_cliente_id_idx" ON "venta"("cliente_id");

-- CreateIndex
CREATE INDEX "venta_linea_venta_id_idx" ON "venta_linea"("venta_id");

-- AddForeignKey
ALTER TABLE "producto" ADD CONSTRAINT "producto_categoria_id_fkey" FOREIGN KEY ("categoria_id") REFERENCES "categoria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "variante" ADD CONSTRAINT "variante_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "stock_variante" ADD CONSTRAINT "stock_variante_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_stock" ADD CONSTRAINT "movimiento_stock_ejecutado_por_usuario_id_fkey" FOREIGN KEY ("ejecutado_por_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_cuenta_corriente" ADD CONSTRAINT "movimiento_cuenta_corriente_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimiento_cuenta_corriente" ADD CONSTRAINT "movimiento_cuenta_corriente_registrado_por_usuario_id_fkey" FOREIGN KEY ("registrado_por_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra" ADD CONSTRAINT "compra_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_linea" ADD CONSTRAINT "compra_linea_compra_id_fkey" FOREIGN KEY ("compra_id") REFERENCES "compra"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "compra_linea" ADD CONSTRAINT "compra_linea_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta" ADD CONSTRAINT "venta_cliente_id_fkey" FOREIGN KEY ("cliente_id") REFERENCES "cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_linea" ADD CONSTRAINT "venta_linea_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "venta_linea" ADD CONSTRAINT "venta_linea_variante_id_fkey" FOREIGN KEY ("variante_id") REFERENCES "variante"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
