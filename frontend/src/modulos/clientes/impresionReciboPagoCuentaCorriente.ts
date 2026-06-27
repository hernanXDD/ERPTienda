import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';
import type { Cliente } from '../../tipos/cliente';
import {
  exportarHtmlRaizComoPdf,
  prepararClonDocumentoA4Pdf,
} from '../reportes/impresionReporte';
import { prepararRenderizadoReporte, renderizarPlantillaConEstilos } from '../reportes/motorEtaReportes';
import {
  claseExportacionPdfResumenVenta,
  estilosResumenVentaCss,
} from '../ventas/estilosResumenVentaCss';
import { sanitizarNombreArchivo } from '../../utilidades/nombresArchivo';
import { calcularDatosReciboPagoCcImpresion } from './calcularDatosReciboPagoCcImpresion';
import { plantillasCuentaCorriente } from './plantillasCuentaCorriente';

export interface DatosImpresionReciboPago {
  cliente: Pick<Cliente, 'nombre' | 'documento'>;
  movimiento: MovimientoCuentaCorriente;
}

function nombreArchivoReciboPago(codigoRecibo: string): string {
  return sanitizarNombreArchivo(`recibo-pago-${codigoRecibo}`, 'recibo-pago');
}

/** Exporta el recibo de cobro en cuenta corriente como PDF (plantilla ETA). */
export async function exportarReciboPagoCuentaCorrientePdf(
  datos: DatosImpresionReciboPago,
): Promise<void> {
  const plantilla = plantillasCuentaCorriente['recibo-pago-cc'];
  await prepararRenderizadoReporte();
  const calculados = calcularDatosReciboPagoCcImpresion(datos.cliente, datos.movimiento);
  const fragmento = renderizarPlantillaConEstilos(plantilla, calculados, estilosResumenVentaCss);

  if (!fragmento.trim()) {
    throw new Error('No se pudo generar el recibo de cobro.');
  }

  await exportarHtmlRaizComoPdf(fragmento, '.rv-doc', nombreArchivoReciboPago(calculados.codigoRecibo), {
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
