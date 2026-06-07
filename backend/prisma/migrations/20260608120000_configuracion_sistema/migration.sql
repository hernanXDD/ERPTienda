-- Parámetros operativos de la tienda (registro único por instalación)

CREATE TABLE "configuracion_sistema" (
    "id" CHAR(6) NOT NULL,
    "maximo_cuenta_corriente" DECIMAL(14,2) NOT NULL DEFAULT 500000,
    "porcentaje_ganancia_sugerida" DECIMAL(6,2) NOT NULL DEFAULT 35,
    "dias_deuda_cuenta_corriente" INTEGER NOT NULL DEFAULT 30,
    "stock_minimo_alerta" INTEGER NOT NULL DEFAULT 5,
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "configuracion_sistema_pkey" PRIMARY KEY ("id")
);

INSERT INTO "configuracion_sistema" (
    "id",
    "maximo_cuenta_corriente",
    "porcentaje_ganancia_sugerida",
    "dias_deuda_cuenta_corriente",
    "stock_minimo_alerta",
    "fecha_creacion",
    "fecha_actualizacion"
) VALUES (
    '000001',
    500000,
    35,
    30,
    5,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
