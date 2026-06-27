import type { MovimientoCuentaCorrienteProveedor } from '../../tipos/cuentaCorrienteProveedor';
import type { Proveedor } from '../../tipos/proveedor';
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
import { calcularDatosReciboPagoCcProveedorImpresion } from './calcularDatosReciboPagoCcProveedorImpresion';
import { plantillasCuentaCorrienteProveedor } from './plantillasCuentaCorrienteProveedor';

export interface DatosImpresionReciboPagoProveedor {
  proveedor: Pick<Proveedor, 'nombre' | 'documento'>;
  movimiento: MovimientoCuentaCorrienteProveedor;
}

function nombreArchivoReciboPago(codigoRecibo: string): string {
  return sanitizarNombreArchivo(`pago-proveedor-${codigoRecibo}`, 'comprobante-pago');
}

export async function exportarReciboPagoCuentaCorrienteProveedorPdf(
  datos: DatosImpresionReciboPagoProveedor,
): Promise<void> {
  const plantilla = plantillasCuentaCorrienteProveedor['recibo-pago-cc-proveedor'];
  await prepararRenderizadoReporte();
  const calculados = calcularDatosReciboPagoCcProveedorImpresion(datos.proveedor, datos.movimiento);
  const fragmento = renderizarPlantillaConEstilos(plantilla, calculados, estilosResumenVentaCss);

  if (!fragmento.trim()) {
    throw new Error('No se pudo generar el comprobante de pago.');
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
