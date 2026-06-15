export function etiquetaTalle(talle: string): string {
  const t = talle.trim();
  return t || '—';
}

/** @deprecated Usar etiquetaTalle; mantiene firma por compatibilidad. */
export function etiquetaTalleColor(talle: string, _color?: string): string {
  return etiquetaTalle(talle);
}

export function armarNombreLineaComercial(
  nombreProducto: string,
  talle: string,
  _color?: string,
): string {
  const detalle = etiquetaTalle(talle);
  if (detalle === '—') return nombreProducto;
  return `${nombreProducto} — ${detalle}`;
}
