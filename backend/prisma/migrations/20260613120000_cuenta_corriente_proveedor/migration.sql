-- Cuenta corriente de proveedores: movimientos (cargos por compras a crédito, pagos registrados).

CREATE TABLE "movimiento_cuenta_corriente_proveedor" (
    "id" CHAR(6) NOT NULL,
    "proveedor_id" CHAR(6) NOT NULL,
    "fecha" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo_movimiento" "tipo_movimiento_cuenta_corriente" NOT NULL,
    "importe" DECIMAL(14,2) NOT NULL,
    "descripcion" VARCHAR(500) NOT NULL,
    "auditoria_pago_json" JSONB,
    "registrado_por_usuario_id" CHAR(6),
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimiento_cuenta_corriente_proveedor_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "movimiento_cuenta_corriente_proveedor_proveedor_id_fecha_idx"
    ON "movimiento_cuenta_corriente_proveedor"("proveedor_id", "fecha" DESC);

ALTER TABLE "movimiento_cuenta_corriente_proveedor"
    ADD CONSTRAINT "movimiento_cuenta_corriente_proveedor_proveedor_id_fkey"
    FOREIGN KEY ("proveedor_id") REFERENCES "proveedor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "movimiento_cuenta_corriente_proveedor"
    ADD CONSTRAINT "movimiento_cuenta_corriente_proveedor_registrado_por_usuario_id_fkey"
    FOREIGN KEY ("registrado_por_usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;
