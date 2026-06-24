export const PLANTILLAS_CUPON_VALIDAS = ['clasica', 'ticket', 'tarjeta'] as const;

export type PlantillaCupon = (typeof PLANTILLAS_CUPON_VALIDAS)[number];

export const PLANTILLA_CUPON_POR_DEFECTO: PlantillaCupon = 'clasica';

export function esPlantillaCuponValida(valor: string): valor is PlantillaCupon {
  return (PLANTILLAS_CUPON_VALIDAS as readonly string[]).includes(valor);
}
