-- Redes sociales del negocio (usuario/enlace + visibilidad por red)

ALTER TABLE "negocio"
ADD COLUMN "instagram" VARCHAR(120) NOT NULL DEFAULT '',
ADD COLUMN "mostrar_instagram" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "twitter" VARCHAR(120) NOT NULL DEFAULT '',
ADD COLUMN "mostrar_twitter" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "tiktok" VARCHAR(120) NOT NULL DEFAULT '',
ADD COLUMN "mostrar_tiktok" BOOLEAN NOT NULL DEFAULT false;
