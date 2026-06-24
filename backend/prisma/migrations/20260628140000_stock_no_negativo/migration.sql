-- Evita stock negativo aunque falle alguna validación en aplicación.
ALTER TABLE "stock_variante"
  ADD CONSTRAINT "stock_variante_cantidad_no_negativa" CHECK ("cantidad_actual" >= 0);
