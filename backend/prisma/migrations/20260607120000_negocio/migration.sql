-- Configuración del negocio (registro único por instalación)

CREATE TABLE "negocio" (
    "id" CHAR(6) NOT NULL,
    "nombre" VARCHAR(200) NOT NULL,
    "cuit" VARCHAR(20) NOT NULL DEFAULT '',
    "correo_electronico" VARCHAR(255) NOT NULL DEFAULT '',
    "telefono" VARCHAR(32) NOT NULL DEFAULT '',
    "direccion" VARCHAR(500) NOT NULL DEFAULT '',
    "ciudad" VARCHAR(120) NOT NULL DEFAULT '',
    "provincia" VARCHAR(120) NOT NULL DEFAULT '',
    "codigo_postal" VARCHAR(16) NOT NULL DEFAULT '',
    "fecha_creacion" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_actualizacion" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "negocio_pkey" PRIMARY KEY ("id")
);

INSERT INTO "negocio" (
    "id",
    "nombre",
    "cuit",
    "correo_electronico",
    "telefono",
    "direccion",
    "ciudad",
    "provincia",
    "codigo_postal",
    "fecha_creacion",
    "fecha_actualizacion"
) VALUES (
    '000001',
    'ERP Tienda',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
);
