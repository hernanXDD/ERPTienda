import type { Producto, Variante } from '../../tipos/catalogo';
import type { TalleCatalogo } from '../../tipos/talleCatalogo';
import { etiquetaTalleCatalogo, TALLES_CATALOGO_SEMILLA } from '../../datos/tallesCatalogo';

function tallesParaEtiqueta(talles?: readonly TalleCatalogo[]): readonly TalleCatalogo[] {
  return talles && talles.length > 0 ? talles : TALLES_CATALOGO_SEMILLA;
}

/** Etiqueta del talle según el catálogo configurado (ej. «XL»). */
export function etiquetaTalle(talle: string, talles?: readonly TalleCatalogo[]): string {
  const t = talle.trim();
  if (!t) return '—';
  return etiquetaTalleCatalogo(t, [...tallesParaEtiqueta(talles)]);
}

/** @deprecated Usar etiquetaTalle; mantiene firma por compatibilidad. */
export function etiquetaTalleColor(talle: string, _color?: string): string {
  return etiquetaTalle(talle);
}

export function armarNombreLineaComercial(
  producto: Producto,
  variante: Variante,
  talles?: readonly TalleCatalogo[],
): string {
  const talle = etiquetaTalle(variante.talle, talles);
  if (talle === '—') return producto.nombre;
  return `${producto.nombre} — ${talle}`;
}

export function claveUnicaVariante(talle: string, _color?: string): string {
  return talle.trim().toLowerCase();
}
