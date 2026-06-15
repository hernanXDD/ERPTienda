import type { Producto, Variante } from '../../tipos/catalogo';

/** Etiqueta del talle (ej. «M»). El color/descripción va en el nombre del producto. */
export function etiquetaTalle(talle: string): string {
  const t = talle.trim();
  return t || '—';
}

/** @deprecated Usar etiquetaTalle; mantiene firma por compatibilidad. */
export function etiquetaTalleColor(talle: string, _color?: string): string {
  return etiquetaTalle(talle);
}

export function armarNombreLineaComercial(producto: Producto, variante: Variante): string {
  const talle = etiquetaTalle(variante.talle);
  if (talle === '—') return producto.nombre;
  return `${producto.nombre} — ${talle}`;
}

export function claveUnicaVariante(talle: string, _color?: string): string {
  return talle.trim().toLowerCase();
}
