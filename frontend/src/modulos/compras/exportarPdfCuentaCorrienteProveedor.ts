import type { Proveedor } from '../../tipos/proveedor';
import type { MovimientoCuentaCorrienteProveedor } from '../../tipos/cuentaCorrienteProveedor';
import { obtenerDiaComparableDesdeValor } from '../../utilidades/formatoFechaHora';
import { calcularReporteCuentasCorrientesProveedor } from '../reportes/calcular/calcularReporteCuentasCorrientesProveedor';
import { opcionesProveedoresParaReporte } from '../reportes/filtroEntidadReporte';
import {
  diaComparableHoy,
  esRangoFechasValido,
  type FiltroFechasReporte,
} from '../reportes/filtroFechasReporte';
import { exportarReporteComoPdf, nombreArchivoReportePdf } from '../reportes/impresionReporte';
import { prepararRenderizadoReporte, renderizarPlantillaReporte } from '../reportes/motorEtaReportes';
import { plantillasReportes } from '../reportes/plantillasReportes';

export interface ParametrosExportarPdfCuentaCorrienteProveedor {
  proveedor: Proveedor;
  proveedores: Proveedor[];
  movimientos: MovimientoCuentaCorrienteProveedor[];
  fechaDesde?: string;
  fechaHasta?: string;
}

function armarFiltroFechasReporte(
  fechaDesde: string | undefined,
  fechaHasta: string | undefined,
  movimientosProveedor: MovimientoCuentaCorrienteProveedor[],
): FiltroFechasReporte {
  const diasMovs = movimientosProveedor
    .map((m) => obtenerDiaComparableDesdeValor(m.fecha))
    .filter((d): d is string => Boolean(d))
    .sort();

  const hoy = diaComparableHoy();
  const minMov = diasMovs[0] ?? hoy;
  const maxMov = diasMovs[diasMovs.length - 1] ?? hoy;

  const desdeTrim = fechaDesde?.trim() ?? '';
  const hastaTrim = fechaHasta?.trim() ?? '';

  return {
    fechaDesde: desdeTrim || minMov,
    fechaHasta: hastaTrim || (desdeTrim ? hoy : maxMov),
  };
}

export async function exportarPdfCuentaCorrienteProveedor(
  parametros: ParametrosExportarPdfCuentaCorrienteProveedor,
): Promise<void> {
  const { proveedor, proveedores, movimientos, fechaDesde, fechaHasta } = parametros;

  const movimientosProveedor = movimientos.filter((m) => m.proveedorId === proveedor.id);
  const filtroFechas = armarFiltroFechasReporte(fechaDesde, fechaHasta, movimientosProveedor);

  if (!esRangoFechasValido(filtroFechas)) {
    throw new Error('El rango de fechas no es válido. Revise «Desde» y «Hasta».');
  }

  const opcionesProveedor = opcionesProveedoresParaReporte(proveedores);
  const datos = calcularReporteCuentasCorrientesProveedor(
    proveedores,
    movimientos,
    { ...filtroFechas, idProveedor: proveedor.id },
    opcionesProveedor,
  );
  datos.tituloReporte = `Cuenta corriente · ${proveedor.nombre}`;
  datos.filtroEntidadLegible = '';

  await prepararRenderizadoReporte();
  const html = renderizarPlantillaReporte(plantillasReportes['cuentas-corrientes-proveedor'], datos);
  const nombreArchivo = nombreArchivoReportePdf(`Cuenta-proveedor-${proveedor.nombre}`, filtroFechas);
  await exportarReporteComoPdf(html, nombreArchivo);
}
