import type { Producto, Variante } from '../../tipos/catalogo';

/** Etiqueta corta de talle y color (ej. «M / Negro»). */
export function etiquetaTalleColor(talle: string, color: string): string {
  const t = talle.trim();
  const c = color.trim();
  if (t && c) return `${t} / ${c}`;
  return t || c || '—';
}

export function armarNombreLineaComercial(producto: Producto, variante: Variante): string {
  const detalle = etiquetaTalleColor(variante.talle, variante.color);
  if (detalle === '—') return producto.nombre;
  return `${producto.nombre} — ${detalle}`;
}

export function claveUnicaVariante(talle: string, color: string): string {
  return `${talle.trim().toLowerCase()}|${color.trim().toLowerCase()}`;
}
