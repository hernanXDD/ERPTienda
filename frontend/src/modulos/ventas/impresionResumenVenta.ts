import {
  exportarHtmlRaizComoPdf,
  prepararClonDocumentoA4Pdf,
} from '../reportes/impresionReporte';
import { renderizarPlantillaConEstilos } from '../reportes/motorEtaReportes';
import { calcularDatosResumenVentaImpresion } from './calcularDatosResumenVentaImpresion';
import {
  claseExportacionPdfResumenVenta,
  estilosResumenVentaCss,
} from './estilosResumenVentaCss';
import { plantillasVentas } from './plantillasVentas';
import type { VentaRegistrada } from '../../tipos/venta';

function sanitizarNombreArchivo(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'comprobante'
  );
}

function nombreArchivoComprobanteVenta(numero: string): string {
  return sanitizarNombreArchivo(`comprobante-${numero}`);
}

function renderizarFragmentoResumenVenta(venta: VentaRegistrada): {
  fragmento: string;
  numero: string;
} {
  const plantilla = plantillasVentas['resumen-venta'];
  if (!plantilla.trim()) {
    throw new Error('No se encontró la plantilla del comprobante de compra.');
  }

  const datos = calcularDatosResumenVentaImpresion(venta);
  const fragmento = renderizarPlantillaConEstilos(plantilla, datos, estilosResumenVentaCss);
  if (!fragmento.trim()) {
    throw new Error('No se pudo generar el comprobante de compra.');
  }

  return { fragmento, numero: datos.numero };
}

/** Exporta el comprobante de compra como PDF (mismo flujo que los reportes). */
export async function exportarComprobanteVentaPdf(venta: VentaRegistrada): Promise<void> {
  const { fragmento, numero } = renderizarFragmentoResumenVenta(venta);

  await exportarHtmlRaizComoPdf(fragmento, '.rv-doc', nombreArchivoComprobanteVenta(numero), {
    prepararClon: prepararClonDocumentoA4Pdf,
    antesCaptura: (clon) => {
      clon.classList.add(claseExportacionPdfResumenVenta);
      void clon.offsetHeight;
      return () => {
        clon.classList.remove(claseExportacionPdfResumenVenta);
      };
    },
  });
}
