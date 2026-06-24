-- CreateEnum
CREATE TYPE "tipo_descuento_cupon" AS ENUM ('porcentaje', 'monto_fijo');

-- AlterTable
ALTER TABLE "cupon_descuento" ADD COLUMN "tipo_descuento" "tipo_descuento_cupon" NOT NULL DEFAULT 'porcentaje';
ALTER TABLE "cupon_descuento" ADD COLUMN "monto_descuento" DECIMAL(14, 2);
ALTER TABLE "cupon_descuento" ALTER COLUMN "porcentaje_descuento" DROP NOT NULL;
