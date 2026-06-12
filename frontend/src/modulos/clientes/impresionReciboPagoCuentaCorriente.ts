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
import { calcularDatosReciboPagoCcImpresion } from './calcularDatosReciboPagoCcImpresion';
import { plantillasCuentaCorriente } from './plantillasCuentaCorriente';

export interface DatosImpresionReciboPago {
  cliente: Pick<Cliente, 'nombre' | 'documento'>;
  movimiento: MovimientoCuentaCorriente;
}

function sanitizarNombreArchivo(nombre: string): string {
  return (
    nombre
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-zA-Z0-9._-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || 'recibo-pago'
  );
}

function nombreArchivoReciboPago(codigoRecibo: string): string {
  return sanitizarNombreArchivo(`recibo-pago-${codigoRecibo}`);
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
