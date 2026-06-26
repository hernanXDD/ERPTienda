import { Eta } from 'eta/core';
import { useNegocioStore } from '../../stores/negocio';
import { obtenerEmisorNegocioReporte } from './emisorNegocioReporte';
import { generarEstilosReporteNegocio } from './estilosReporteCss';
import { armarDatosPiePaginaReporte, codificarJsonAtributoHtml } from './piePaginaReporte';
import plantillaEmisorReporte from './plantillas/emisor-reporte.eta?raw';
import plantillaPieReporte from './plantillas/pie-reporte.eta?raw';

const eta = new Eta({
  autoEscape: true,
  tags: ['<%', '%>'],
});

const MARCADOR_EMISOR = '<!-- EMISOR_REPORTE -->';
const MARCADOR_PIE = '<!-- PIE_REPORTE -->';

/** Asegura que el logo del negocio esté en caché (base64) antes de renderizar reportes o PDF. */
export async function prepararRenderizadoReporte(): Promise<void> {
  await useNegocioStore().asegurarLogoDataUrl();
}

function datosReporteCompletos(datos: object, estilosCss: string): Record<string, unknown> {
  const emisor = obtenerEmisorNegocioReporte();
  const merged: Record<string, unknown> = {
    ...emisor,
    notaPieReporte: 'Documento generado automáticamente · Uso interno',
    ...datos,
    estilos: estilosCss,
  };
  const repPieDatosJson = JSON.stringify(armarDatosPiePaginaReporte(merged));
  merged.repPieDatosJson = repPieDatosJson;
  merged.repPieDatosJsonHtml = codificarJsonAtributoHtml(repPieDatosJson);
  return merged;
}

function insertarEmisorEnPlantilla(plantilla: string, datosCompletos: Record<string, unknown>): string {
  if (!plantilla.includes(MARCADOR_EMISOR)) return plantilla;
  const emisorHtml = eta.renderString(plantillaEmisorReporte, datosCompletos);
  return plantilla.replace(MARCADOR_EMISOR, emisorHtml);
}

function insertarPieEnPlantilla(plantilla: string, datosCompletos: Record<string, unknown>): string {
  if (!plantilla.includes(MARCADOR_PIE)) return plantilla;
  const pieHtml = eta.renderString(plantillaPieReporte, datosCompletos);
  return plantilla.replace(MARCADOR_PIE, pieHtml);
}

/** Renderiza plantilla en memoria (no usar `render`: interpreta el string como nombre de archivo). */
export function renderizarPlantillaReporte(plantilla: string, datos: object): string {
  const negocio = useNegocioStore().negocio;
  return renderizarPlantillaConEstilos(plantilla, datos, generarEstilosReporteNegocio(negocio));
}

export function renderizarPlantillaConEstilos(
  plantilla: string,
  datos: object,
  estilosCss: string,
): string {
  const datosCompletos = datosReporteCompletos(datos, estilosCss);
  const plantillaConEmisor = insertarEmisorEnPlantilla(plantilla, datosCompletos);
  const plantillaCompleta = insertarPieEnPlantilla(plantillaConEmisor, datosCompletos);
  return eta.renderString(plantillaCompleta, datosCompletos);
}
