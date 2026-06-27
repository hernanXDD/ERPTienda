import type { TalleCatalogo, TipoTalleCatalogo } from '../tipos/talleCatalogo';

/** Código reservado para artículos sin variante de talle. */
export const CODIGO_TALLE_UNICO = 'ÚNICO';

export function esTalleUnicoSistema(codigo: string): boolean {
  return codigo.trim().toUpperCase() === CODIGO_TALLE_UNICO.toUpperCase();
}

/** Valores por defecto si la API aún no cargó (misma semilla que la migración). */
export const TALLES_CATALOGO_SEMILLA: TalleCatalogo[] = [
  { id: '000001', codigo: 'XS', nombre: 'XS', tipo: 'LETRA', habilitado: true, orden: 1 },
  { id: '000002', codigo: 'S', nombre: 'S', tipo: 'LETRA', habilitado: true, orden: 2 },
  { id: '000003', codigo: 'M', nombre: 'M', tipo: 'LETRA', habilitado: true, orden: 3 },
  { id: '000004', codigo: 'L', nombre: 'L', tipo: 'LETRA', habilitado: true, orden: 4 },
  { id: '000005', codigo: 'XL', nombre: 'XL', tipo: 'LETRA', habilitado: true, orden: 5 },
  { id: '000006', codigo: 'XXL', nombre: 'XXL', tipo: 'LETRA', habilitado: true, orden: 6 },
  { id: '000007', codigo: '36', nombre: '36', tipo: 'NUMERO', habilitado: true, orden: 7 },
  { id: '000008', codigo: '38', nombre: '38', tipo: 'NUMERO', habilitado: true, orden: 8 },
  { id: '000009', codigo: '40', nombre: '40', tipo: 'NUMERO', habilitado: true, orden: 9 },
  { id: '000010', codigo: '42', nombre: '42', tipo: 'NUMERO', habilitado: true, orden: 10 },
  { id: '000011', codigo: '44', nombre: '44', tipo: 'NUMERO', habilitado: true, orden: 11 },
  { id: '000012', codigo: '46', nombre: '46', tipo: 'NUMERO', habilitado: true, orden: 12 },
  { id: '000013', codigo: '48', nombre: '48', tipo: 'NUMERO', habilitado: true, orden: 13 },
  {
    id: '000014',
    codigo: CODIGO_TALLE_UNICO,
    nombre: CODIGO_TALLE_UNICO,
    tipo: 'OTRO',
    habilitado: true,
    orden: 14,
  },
];

export function etiquetaTipoTalleCatalogo(tipo: TipoTalleCatalogo): string {
  switch (tipo) {
    case 'LETRA':
      return 'Letra';
    case 'NUMERO':
      return 'Número';
    default:
      return 'Otro';
  }
}

export function etiquetaTalleCatalogo(
  codigo: string,
  talles: TalleCatalogo[] = TALLES_CATALOGO_SEMILLA,
): string {
  const clave = codigo.trim().toLowerCase();
  return (
    talles.find((t) => t.codigo.trim().toLowerCase() === clave)?.nombre ?? codigo
  );
}

export function claveComparacionTalleCatalogo(texto: string): string {
  return texto.trim().toLowerCase();
}

export function buscarTalleCatalogoDuplicado(
  talles: readonly TalleCatalogo[],
  texto: string,
  excluirId?: string,
): TalleCatalogo | undefined {
  const clave = claveComparacionTalleCatalogo(texto);
  if (!clave) return undefined;
  return talles.find(
    (talle) =>
      talle.id !== excluirId && claveComparacionTalleCatalogo(talle.codigo) === clave,
  );
}
