/** Código reservado para artículos sin variante de talle (alta rápida desde compras). */
export const CODIGO_TALLE_UNICO = 'ÚNICO';

export type TipoTalleCatalogoApi = 'LETRA' | 'NUMERO' | 'OTRO';

export function normalizarCodigoTalleCatalogo(texto: string): string {
  return texto.trim().slice(0, 32);
}

export function claveComparacionTalleCatalogo(codigo: string): string {
  return codigo.trim().toLowerCase();
}

export function inferirTipoTalleCatalogo(nombre: string): TipoTalleCatalogoApi {
  const talle = nombre.trim();
  if (/^\d+([.,]\d+)?$/.test(talle)) return 'NUMERO';
  if (/^[a-zA-Z]{1,6}$/.test(talle)) return 'LETRA';
  return 'OTRO';
}
