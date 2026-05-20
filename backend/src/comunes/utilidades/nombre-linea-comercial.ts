export function etiquetaTalleColor(talle: string, color: string): string {
  const t = talle.trim();
  const c = color.trim();
  if (t && c) return `${t} / ${c}`;
  return t || c || '—';
}

export function armarNombreLineaComercial(
  nombreProducto: string,
  talle: string,
  color: string,
): string {
  const detalle = etiquetaTalleColor(talle, color);
  if (detalle === '—') return nombreProducto;
  return `${nombreProducto} — ${detalle}`;
}
