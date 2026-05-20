import {
  ID_VARIANTE_BUZO_M_GRIS,
  ID_VARIANTE_PANTALON_40_AZUL,
  ID_VARIANTE_PANTALON_42_AZUL,
  ID_VARIANTE_REMERA_L_NEGRO,
  ID_VARIANTE_REMERA_M_NEGRO,
  ID_VARIANTE_REMERA_M_ROJO,
  ID_VARIANTE_REMERA_S_NEGRO,
} from './semillaCatalogo';

/**
 * Existencias físicas por variante antes de reproducir ventas de semilla del catálogo.
 */
export const CANTIDAD_INICIAL_POR_VARIANTE_SEMILLA: Record<string, number> = {
  [ID_VARIANTE_REMERA_S_NEGRO]: 42,
  [ID_VARIANTE_REMERA_M_NEGRO]: 88,
  [ID_VARIANTE_REMERA_L_NEGRO]: 55,
  [ID_VARIANTE_REMERA_M_ROJO]: 35,
  [ID_VARIANTE_PANTALON_40_AZUL]: 62,
  [ID_VARIANTE_PANTALON_42_AZUL]: 48,
  [ID_VARIANTE_BUZO_M_GRIS]: 30,
};

export function cantidadInicialSemillaPorVarianteId(varianteId: string): number {
  return CANTIDAD_INICIAL_POR_VARIANTE_SEMILLA[varianteId] ?? 0;
}
