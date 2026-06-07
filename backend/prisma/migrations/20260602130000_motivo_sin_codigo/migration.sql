-- Elimina columna codigo de motivo (relación solo por id)

DROP INDEX IF EXISTS "motivo_codigo_key";

ALTER TABLE "motivo" DROP COLUMN "codigo";
