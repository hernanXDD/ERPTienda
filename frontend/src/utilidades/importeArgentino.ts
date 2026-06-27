/**
 * Convierte texto con formato argentino (1.234,56) a número.
 * Acepta espacios, puntos de miles y coma decimal.
 */
export function normalizarImporteArgentino(texto: string): number {
  const limpio = texto.replace(/\s/g, '').replace(/\./g, '').replace(',', '.');
  const n = Number.parseFloat(limpio);
  return Number.isFinite(n) ? n : Number.NaN;
}
