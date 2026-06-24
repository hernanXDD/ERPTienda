import type { PlantillaCupon } from '../../tipos/plantillaCupon';
import { normalizarPlantillaCupon } from '../../tipos/plantillaCupon';
import plantillaCuponClasica from './plantillas/cupon-descuento.eta?raw';
import plantillaCuponTarjeta from './plantillas/cupon-tarjeta.eta?raw';
import plantillaCuponTicket from './plantillas/cupon-ticket.eta?raw';

const PLANTILLAS_CUPON_HTML: Record<PlantillaCupon, string> = {
  clasica: plantillaCuponClasica,
  ticket: plantillaCuponTicket,
  tarjeta: plantillaCuponTarjeta,
};

export function obtenerHtmlPlantillaCupon(plantilla: PlantillaCupon | unknown): string {
  return PLANTILLAS_CUPON_HTML[normalizarPlantillaCupon(plantilla)];
}

export function claseModificadorPlantillaCupon(plantilla: PlantillaCupon | unknown): string {
  return `rep-doc--cupon-${normalizarPlantillaCupon(plantilla)}`;
}
