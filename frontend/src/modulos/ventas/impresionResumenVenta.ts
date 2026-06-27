import {
  exportarHtmlRaizComoPdf,
  prepararClonDocumentoA4Pdf,
} from '../reportes/impresionReporte';
import { prepararRenderizadoReporte, renderizarPlantillaConEstilos } from '../reportes/motorEtaReportes';
import { sanitizarNombreArchivo } from '../../utilidades/nombresArchivo';
import { calcularDatosResumenVentaImpresion } from './calcularDatosResumenVentaImpresion';
import {
  claseExportacionPdfResumenVenta,
  estilosResumenVentaCss,
} from './estilosResumenVentaCss';
import { plantillasVentas } from './plantillasVentas';
import type { VentaRegistrada } from '../../tipos/venta';
import { useFormasPagoStore } from '../../stores/formasPago';

function nombreArchivoComprobanteVenta(numero: string): string {
  return sanitizarNombreArchivo(`comprobante-${numero}`, 'comprobante');
}

async function renderizarFragmentoResumenVenta(venta: VentaRegistrada): Promise<{
  fragmento: string;
  numero: string;
}> {
  const plantilla = plantillasVentas['resumen-venta'];
  if (!plantilla.trim()) {
    throw new Error('No se encontró la plantilla del comprobante de compra.');
  }

  await prepararRenderizadoReporte();
  const datos = calcularDatosResumenVentaImpresion(venta, useFormasPagoStore().formas);
  const fragmento = renderizarPlantillaConEstilos(plantilla, datos, estilosResumenVentaCss);
  if (!fragmento.trim()) {
    throw new Error('No se pudo generar el comprobante de compra.');
  }

  return { fragmento, numero: datos.numero };
}

/** Exporta el comprobante de compra como PDF (mismo flujo que los reportes). */
export async function exportarComprobanteVentaPdf(venta: VentaRegistrada): Promise<void> {
  const { fragmento, numero } = await renderizarFragmentoResumenVenta(venta);

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
