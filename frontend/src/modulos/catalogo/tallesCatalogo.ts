import type { TalleCatalogo } from '../../tipos/talleCatalogo';
import {
  CODIGO_TALLE_UNICO,
  TALLES_CATALOGO_SEMILLA,
  esTalleUnicoSistema,
} from '../../datos/tallesCatalogo';

/** @deprecated Usar `useTallesCatalogoStore().tallesHabilitadosTipo('LETRA')` */
export const TALLES_LETRA = TALLES_CATALOGO_SEMILLA.filter((t) => t.tipo === 'LETRA').map(
  (t) => t.codigo,
);

/** @deprecated Usar store de talles configurables */
export const TALLES_NUMERO = TALLES_CATALOGO_SEMILLA.filter((t) => t.tipo === 'NUMERO').map(
  (t) => t.codigo,
);

/** @deprecated Usar store de talles configurables */
export const TALLES_PREDEFINIDOS = TALLES_CATALOGO_SEMILLA.map((t) => t.codigo);

/** Color vacío: el detalle de color va en el nombre del producto (ej. «remera negra»). */
export const COLOR_VARIANTE_VACIO = '';

/** Talle por defecto al dar de alta un producto desde una compra. */
export const TALLE_UNICO_ALTA_COMPRA = CODIGO_TALLE_UNICO;

export function resolverCodigoTalleUnicoAltaCompra(
  tallesCatalogo: TalleCatalogo[] = TALLES_CATALOGO_SEMILLA,
): string {
  const habilitados = tallesCatalogo.filter((t) => t.habilitado);
  const listado = habilitados.length > 0 ? habilitados : tallesCatalogo;
  const delCatalogo = listado.find((t) => esTalleUnicoSistema(t.codigo));
  return delCatalogo?.codigo ?? CODIGO_TALLE_UNICO;
}

export function crearTallesBorradorAltaRapidaCompra(
  tallesCatalogo?: TalleCatalogo[],
): BorradorTalle[] {
  const habilitados =
    tallesCatalogo && tallesCatalogo.length > 0
      ? tallesCatalogo.filter((t) => t.habilitado)
      : TALLES_CATALOGO_SEMILLA.filter((t) => t.habilitado);
  const listaBase = habilitados.length > 0 ? habilitados : TALLES_CATALOGO_SEMILLA;

  const borrador = crearTallesBorradorDesdeCatalogo(listaBase);
  const codigoUnico = resolverCodigoTalleUnicoAltaCompra(listaBase);

  let habilitoUnico = false;
  for (const fila of borrador) {
    if (tallesIguales(fila.talle, codigoUnico)) {
      fila.habilitado = true;
      habilitoUnico = true;
    }
  }

  if (!habilitoUnico) {
    borrador.push({
      talle: codigoUnico,
      habilitado: true,
      codigoBarras: '',
      esPersonalizado: true,
    });
  }

  return borrador;
}

export function normalizarTalle(talle: string): string {
  return talle.trim();
}

export function tallesIguales(a: string, b: string): boolean {
  return normalizarTalle(a).toLowerCase() === normalizarTalle(b).toLowerCase();
}

export interface BorradorTalle {
  talle: string;
  habilitado: boolean;
  id?: string;
  codigoBarras: string;
  esPersonalizado: boolean;
}

function indicePredefinidosDesdeCatalogo(tallesCatalogo: TalleCatalogo[]): Map<string, number> {
  const borrador = crearTallesBorradorDesdeCatalogo(tallesCatalogo);
  return new Map(borrador.map((fila, indice) => [fila.talle.toLowerCase(), indice]));
}

export function crearTallesBorradorDesdeCatalogo(
  tallesCatalogo: TalleCatalogo[] = TALLES_CATALOGO_SEMILLA,
): BorradorTalle[] {
  return [...tallesCatalogo]
    .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'))
    .map((talle) => ({
      talle: talle.codigo,
      habilitado: false,
      codigoBarras: '',
      esPersonalizado: false,
    }));
}

/** @deprecated Usar `crearTallesBorradorDesdeCatalogo` */
export function crearTallesBorradorVacios(
  tallesCatalogo: TalleCatalogo[] = TALLES_CATALOGO_SEMILLA,
): BorradorTalle[] {
  return crearTallesBorradorDesdeCatalogo(tallesCatalogo);
}

export function tallesBorradorDesdeVariantes(
  existentes: readonly {
    id: string;
    talle: string;
    color: string;
    codigoBarras: string;
    activa: boolean;
  }[],
  tallesCatalogo: TalleCatalogo[] = TALLES_CATALOGO_SEMILLA,
): BorradorTalle[] {
  const borrador = crearTallesBorradorDesdeCatalogo(tallesCatalogo);
  const indicePredefinido = indicePredefinidosDesdeCatalogo(tallesCatalogo);
  const personalizados: BorradorTalle[] = [];

  for (const variante of existentes) {
    const talle = normalizarTalle(variante.talle);
    if (!talle) continue;

    const idxPredef = indicePredefinido.get(talle.toLowerCase());
    if (idxPredef !== undefined) {
      const fila = borrador[idxPredef]!;
      if (!fila.id || variante.activa) {
        fila.habilitado = variante.activa;
        fila.id = variante.id;
        fila.codigoBarras = variante.codigoBarras;
      }
      continue;
    }

    const existentePersonalizado = personalizados.find((f) => tallesIguales(f.talle, talle));
    if (existentePersonalizado) {
      if (variante.activa && !existentePersonalizado.habilitado) {
        existentePersonalizado.habilitado = true;
        existentePersonalizado.id = variante.id;
        existentePersonalizado.codigoBarras = variante.codigoBarras;
      }
      continue;
    }

    personalizados.push({
      talle,
      habilitado: variante.activa,
      id: variante.id,
      codigoBarras: variante.codigoBarras,
      esPersonalizado: true,
    });
  }

  return [...borrador, ...personalizados];
}
