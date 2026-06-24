export const PLANTILLAS_CUPON_VALIDAS = ['clasica', 'ticket', 'tarjeta'] as const;

export type PlantillaCupon = (typeof PLANTILLAS_CUPON_VALIDAS)[number];

export const PLANTILLA_CUPON_POR_DEFECTO: PlantillaCupon = 'clasica';

export interface DefinicionPlantillaCupon {
  id: PlantillaCupon;
  etiqueta: string;
  descripcion: string;
}

export const CATALOGO_PLANTILLAS_CUPON: DefinicionPlantillaCupon[] = [
  {
    id: 'clasica',
    etiqueta: 'Vale',
    descripcion: 'Cabecera de marca, beneficio central y franja inferior para escanear.',
  },
  {
    id: 'ticket',
    etiqueta: 'Boleto',
    descripcion: 'Cupón y talón separados, ideal para presentar en caja.',
  },
  {
    id: 'tarjeta',
    etiqueta: 'Gift card',
    descripcion: 'Panel de marca con beneficio y zona blanca para el código.',
  },
];

export function esPlantillaCuponValida(valor: unknown): valor is PlantillaCupon {
  return typeof valor === 'string' && (PLANTILLAS_CUPON_VALIDAS as readonly string[]).includes(valor);
}

export function normalizarPlantillaCupon(valor: unknown): PlantillaCupon {
  return esPlantillaCuponValida(valor) ? valor : PLANTILLA_CUPON_POR_DEFECTO;
}

export function etiquetaPlantillaCupon(id: PlantillaCupon): string {
  return CATALOGO_PLANTILLAS_CUPON.find((p) => p.id === id)?.etiqueta ?? 'Clásica';
}
