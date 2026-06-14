-- AlterTable
ALTER TABLE "usuario"
ADD COLUMN "modo_oscuro_habilitado" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "negocio"
ADD COLUMN "tema_claro_color_acento" VARCHAR(7) NOT NULL DEFAULT '#5b6ee6',
ADD COLUMN "tema_claro_color_fondo" VARCHAR(7) NOT NULL DEFAULT '#eef2f7',
ADD COLUMN "tema_claro_color_superficie" VARCHAR(7) NOT NULL DEFAULT '#ffffff';
