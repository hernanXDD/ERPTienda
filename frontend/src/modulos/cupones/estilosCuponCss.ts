import type { PlantillaCupon } from '../../tipos/plantillaCupon';
import { normalizarPlantillaCupon } from '../../tipos/plantillaCupon';
import {
  TARJETA_CUPON_ALTO_MM,
  TARJETA_CUPON_ANCHO_MM,
  TARJETA_CUPON_RADIO_MM,
} from './dimensionesTarjetaCupon';
import { generarEstilosReporteNegocio } from '../reportes/estilosReporteCss';

/** Solo para captura JPG; no reutilizar estilos de exportación PDF de reportes (210 mm). */
export const claseCapturaCuponImagen = 'rep-doc--exportacion-cupon';

const estilosDimensionesTarjeta = `
.rep-doc.rep-doc--cupon-clasica,
.rep-doc.rep-doc--cupon-ticket,
.rep-doc.rep-doc--cupon-tarjeta {
  width: ${TARJETA_CUPON_ANCHO_MM}mm;
  height: ${TARJETA_CUPON_ALTO_MM}mm;
  min-width: ${TARJETA_CUPON_ANCHO_MM}mm;
  min-height: ${TARJETA_CUPON_ALTO_MM}mm;
  max-width: ${TARJETA_CUPON_ANCHO_MM}mm;
  max-height: ${TARJETA_CUPON_ALTO_MM}mm;
  margin: 0 auto;
  padding: 0;
  box-sizing: border-box;
  overflow: hidden;
  background: transparent;
}

.rep-doc.rep-doc--cupon-clasica.rep-doc--exportacion-cupon,
.rep-doc.rep-doc--cupon-ticket.rep-doc--exportacion-cupon,
.rep-doc.rep-doc--cupon-tarjeta.rep-doc--exportacion-cupon {
  width: ${TARJETA_CUPON_ANCHO_MM}mm !important;
  max-width: ${TARJETA_CUPON_ANCHO_MM}mm !important;
  min-width: ${TARJETA_CUPON_ANCHO_MM}mm !important;
  height: ${TARJETA_CUPON_ALTO_MM}mm !important;
  max-height: ${TARJETA_CUPON_ALTO_MM}mm !important;
  min-height: ${TARJETA_CUPON_ALTO_MM}mm !important;
  margin: 0 !important;
  padding: 0 !important;
  overflow: hidden !important;
}

.cup-vale-barcode svg,
.cup-gift-barcode svg,
.cup-bol-barcode svg {
  display: block;
  width: 100%;
  max-width: 100%;
  min-width: 0;
  max-height: 1.5rem;
  height: auto;
}
`;

/** Propuesta A — Vale estructurado (cabecera + cuerpo + franja de escaneo). */
const estilosVarianteClasica = `
.cup-vale {
  display: flex;
  flex-direction: column;
  width: 100%;
  height: 100%;
  border-radius: ${TARJETA_CUPON_RADIO_MM}mm;
  overflow: hidden;
  background: var(--rep-fondo);
  border: 1px solid var(--rep-borde-claro);
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.1);
}

.cup-vale-cab {
  display: flex;
  align-items: center;
  gap: 0.28rem;
  flex: 0 0 11mm;
  min-height: 0;
  padding: 0 0.36rem;
  background: var(--rep-gradiente-acento);
  color: var(--rep-texto-sobre-acento);
}

.cup-vale-logo {
  width: 1.75rem;
  height: 1.75rem;
  object-fit: contain;
  border-radius: 0.22rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.08rem;
}

.cup-vale-ini {
  width: 1.75rem;
  height: 1.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.22rem;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.2);
  font-size: 0.54rem;
  font-weight: 800;
}

.cup-vale-nom {
  margin: 0;
  font-size: 0.4rem;
  font-weight: 700;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cup-vale-cuerpo {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.14rem;
  flex: 1 1 auto;
  min-height: 0;
  padding: 0.22rem 0.36rem;
  background: var(--rep-fondo);
}

.cup-vale-benef {
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: 0.2rem;
}

.cup-vale-val {
  font-size: 1.28rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
  color: var(--rep-acento-intenso);
}

.cup-vale-tipo {
  font-size: 0.34rem;
  font-weight: 700;
  color: var(--rep-texto-apagado);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.cup-vale-meta {
  display: flex;
  align-items: center;
  gap: 0.14rem;
  margin: 0;
  font-size: 0.32rem;
  font-weight: 600;
  color: var(--rep-texto-apagado);
  white-space: nowrap;
  overflow: hidden;
}

.cup-vale-meta-txt {
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 18mm;
}

.cup-vale-sep {
  opacity: 0.45;
  flex-shrink: 0;
}

.cup-vale-scan {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.1rem;
  flex: 0 0 14.5mm;
  padding: 0.2rem 0.32rem;
  background: #fff;
  border-top: 1px solid var(--rep-borde-claro);
}

.cup-vale-barcode {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 0.1rem 0.14rem;
  border-radius: 0.16rem;
  background: #fff;
}

.cup-vale-cod {
  display: block;
  margin: 0;
  padding: 0.06rem 0.1rem;
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-size: 0.3rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.15;
  text-align: center;
  word-break: break-all;
  color: var(--rep-texto);
}
`;

/** Propuesta B — Gift card (panel marca + panel escaneo). */
const estilosVarianteTarjeta = `
.cup-gift {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  height: 100%;
  border-radius: ${TARJETA_CUPON_RADIO_MM}mm;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.14);
}

.cup-gift-marca {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.12rem;
  flex: 0 0 44%;
  padding: 0.28rem 0.3rem;
  background: var(--rep-gradiente-acento);
  color: var(--rep-texto-sobre-acento);
  text-align: center;
}

.cup-gift-logo-wrap {
  display: flex;
  justify-content: center;
  align-items: center;
}

.cup-gift-logo {
  width: 2rem;
  height: 2rem;
  object-fit: contain;
  border-radius: 0.26rem;
  background: rgba(255, 255, 255, 0.95);
  padding: 0.1rem;
}

.cup-gift-ini {
  width: 2rem;
  height: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.26rem;
  background: rgba(255, 255, 255, 0.2);
  font-size: 0.62rem;
  font-weight: 800;
}

.cup-gift-nom {
  margin: 0;
  font-size: 0.36rem;
  font-weight: 700;
  line-height: 1.15;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0.95;
}

.cup-gift-benef {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.06rem;
  margin-top: 0.08rem;
}

.cup-gift-val {
  font-size: 1.3rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.03em;
}

.cup-gift-tipo {
  font-size: 0.32rem;
  font-weight: 600;
  opacity: 0.88;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.cup-gift-scan {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.1rem;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.28rem 0.32rem;
  background: var(--rep-fondo);
}

.cup-gift-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.2rem;
  font-size: 0.3rem;
  font-weight: 700;
  color: var(--rep-texto-apagado);
}

.cup-gift-cli {
  margin: 0;
  font-size: 0.32rem;
  font-weight: 600;
  color: var(--rep-texto);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cup-gift-barcode {
  display: flex;
  flex: 1 1 auto;
  justify-content: center;
  align-items: center;
  min-height: 0;
  padding: 0.12rem 0.14rem;
  border-radius: 0.18rem;
  background: var(--rep-fondo-alt);
  border: 1px solid var(--rep-borde-claro);
}

.cup-gift-cod {
  display: block;
  flex-shrink: 0;
  margin: 0;
  padding: 0.08rem 0.1rem;
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-size: 0.3rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.15;
  text-align: center;
  word-break: break-all;
  color: var(--rep-texto);
}
`;

/** Propuesta C — Boleto de canje (cupón + talón con línea punteada). */
const estilosVarianteTicket = `
.cup-bol {
  display: flex;
  flex-direction: row;
  align-items: stretch;
  width: 100%;
  height: 100%;
  border-radius: ${TARJETA_CUPON_RADIO_MM}mm;
  overflow: hidden;
  background: var(--rep-fondo);
  border: 1px solid var(--rep-borde-claro);
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.08);
}

.cup-bol-izq {
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 0.12rem;
  flex: 1 1 auto;
  min-width: 0;
  padding: 0.26rem 0.3rem;
  border-right: 2px dashed color-mix(in srgb, var(--rep-acento) 45%, var(--rep-borde));
}

.cup-bol-etiq {
  font-size: 0.28rem;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--rep-acento-intenso);
}

.cup-bol-marca {
  display: flex;
  align-items: center;
  gap: 0.22rem;
  min-width: 0;
}

.cup-bol-logo {
  width: 1.65rem;
  height: 1.65rem;
  object-fit: contain;
  border-radius: 0.22rem;
  flex-shrink: 0;
}

.cup-bol-ini {
  width: 1.65rem;
  height: 1.65rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.22rem;
  flex-shrink: 0;
  background: var(--rep-gradiente-logo);
  color: var(--rep-texto-sobre-acento);
  font-size: 0.5rem;
  font-weight: 800;
}

.cup-bol-nom {
  margin: 0;
  font-size: 0.36rem;
  font-weight: 700;
  line-height: 1.15;
  color: var(--rep-texto);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.cup-bol-val {
  font-size: 1.22rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
  color: var(--rep-acento-intenso);
}

.cup-bol-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 0.1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

.cup-bol-chips li {
  padding: 0.07rem 0.16rem;
  border-radius: 0.14rem;
  background: var(--rep-fondo-alt);
  border: 1px solid var(--rep-borde-claro);
  font-size: 0.28rem;
  font-weight: 650;
  color: var(--rep-texto-apagado);
  line-height: 1.2;
}

.cup-bol-der {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 0.1rem;
  flex: 0 0 30mm;
  padding: 0.24rem 0.26rem;
  background: color-mix(in srgb, var(--rep-acento) 6%, var(--rep-fondo-alt));
  text-align: center;
}

.cup-bol-canje {
  font-size: 0.28rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--rep-acento-intenso);
}

.cup-bol-barcode {
  display: flex;
  flex: 1 1 auto;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: 0;
  padding: 0.1rem 0.12rem;
  border-radius: 0.16rem;
  background: #fff;
  border: 1px solid var(--rep-borde-claro);
}

.cup-bol-cod {
  display: block;
  width: 100%;
  margin: 0;
  padding: 0.06rem 0.08rem;
  font-family: ui-monospace, 'Cascadia Code', 'Segoe UI Mono', monospace;
  font-size: 0.28rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  line-height: 1.15;
  word-break: break-all;
  color: var(--rep-texto);
}

.cup-bol-num {
  font-size: 0.3rem;
  font-weight: 800;
  color: var(--rep-texto-apagado);
  letter-spacing: 0.04em;
}
`;

function estilosAddonPorPlantilla(plantilla: PlantillaCupon): string {
  switch (plantilla) {
    case 'ticket':
      return estilosVarianteTicket;
    case 'tarjeta':
      return estilosVarianteTarjeta;
    default:
      return estilosVarianteClasica;
  }
}

export function generarEstilosCuponNegocio(
  negocio: Parameters<typeof generarEstilosReporteNegocio>[0],
  plantilla: PlantillaCupon | unknown = 'clasica',
): string {
  const plantillaNormalizada = normalizarPlantillaCupon(plantilla);
  return `${generarEstilosReporteNegocio(negocio)}\n${estilosDimensionesTarjeta}\n${estilosAddonPorPlantilla(plantillaNormalizada)}`;
}
