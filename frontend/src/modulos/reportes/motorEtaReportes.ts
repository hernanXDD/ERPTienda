import { Eta } from 'eta/core';
import { obtenerEmisorNegocioReporte } from './emisorNegocioReporte';
import { estilosBaseReporteCss } from './estilosReporteCss';
import { armarDatosPiePaginaReporte } from './piePaginaReporte';
import plantillaEmisorReporte from './plantillas/emisor-reporte.eta?raw';
import plantillaPieReporte from './plantillas/pie-reporte.eta?raw';

const eta = new Eta({
  autoEscape: true,
  tags: ['<%', '%>'],
});

const MARCADOR_EMISOR = '<!-- EMISOR_REPORTE -->';
const MARCADOR_PIE = '<!-- PIE_REPORTE -->';

function datosReporteCompletos(datos: object, estilosCss: string): Record<string, unknown> {
  const emisor = obtenerEmisorNegocioReporte();
  const merged: Record<string, unknown> = {
    ...emisor,
    notaPieReporte: 'Documento generado automáticamente · Uso interno',
    ...datos,
    estilos: estilosCss,
  };
  merged.repPieDatosJson = JSON.stringify(armarDatosPiePaginaReporte(merged));
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
  return renderizarPlantillaConEstilos(plantilla, datos, estilosBaseReporteCss);
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
