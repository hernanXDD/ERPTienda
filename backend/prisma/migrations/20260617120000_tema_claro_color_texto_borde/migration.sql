-- Colores opcionales de texto y bordes para el modo claro del negocio.
ALTER TABLE "negocio"
  ADD COLUMN "tema_claro_color_texto" VARCHAR(7) NOT NULL DEFAULT '#0f172a',
  ADD COLUMN "tema_claro_color_borde" VARCHAR(7) NOT NULL DEFAULT '#cbd5e1';
