import type { Cliente } from '../../tipos/cliente';
import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';
import { obtenerDiaComparableDesdeValor } from '../../utilidades/formatoFechaHora';
import { calcularReporteCuentasCorrientes } from '../reportes/calcular/calcularReporteCuentasCorrientes';
import { opcionesClientesParaReporte } from '../reportes/filtroEntidadReporte';
import {
  diaComparableHoy,
  esRangoFechasValido,
  type FiltroFechasReporte,
} from '../reportes/filtroFechasReporte';
import { exportarReporteComoPdf, nombreArchivoReportePdf } from '../reportes/impresionReporte';
import { renderizarPlantillaReporte } from '../reportes/motorEtaReportes';
import { plantillasReportes } from '../reportes/plantillasReportes';

export interface ParametrosExportarPdfCuentaCorrienteCliente {
  cliente: Cliente;
  clientes: Cliente[];
  movimientos: MovimientoCuentaCorriente[];
  /** Vacío = sin límite inferior (desde el primer movimiento). */
  fechaDesde?: string;
  /** Vacío = sin límite superior (hasta el último movimiento o hoy si hay «desde»). */
  fechaHasta?: string;
}

function armarFiltroFechasReporte(
  fechaDesde: string | undefined,
  fechaHasta: string | undefined,
  movimientosCliente: MovimientoCuentaCorriente[],
): FiltroFechasReporte {
  const diasMovs = movimientosCliente
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

/**
 * Genera y abre en una nueva pestaña el PDF de cuenta corriente del cliente,
 * usando la plantilla ETA estándar de reportes.
 */
export async function exportarPdfCuentaCorrienteCliente(
  parametros: ParametrosExportarPdfCuentaCorrienteCliente,
): Promise<void> {
  const { cliente, clientes, movimientos, fechaDesde, fechaHasta } = parametros;

  const movimientosCliente = movimientos.filter((m) => m.clienteId === cliente.id);
  const filtroFechas = armarFiltroFechasReporte(fechaDesde, fechaHasta, movimientosCliente);

  if (!esRangoFechasValido(filtroFechas)) {
    throw new Error('El rango de fechas no es válido. Revise «Desde» y «Hasta».');
  }

  const opcionesCliente = opcionesClientesParaReporte(clientes);
  const datos = calcularReporteCuentasCorrientes(
    clientes,
    movimientos,
    { ...filtroFechas, idCliente: cliente.id },
    opcionesCliente,
  );
  datos.tituloReporte = `Cuenta corriente · ${cliente.nombre}`;
  datos.filtroEntidadLegible = '';

  const html = renderizarPlantillaReporte(plantillasReportes['cuentas-corrientes'], datos);
  const nombreArchivo = nombreArchivoReportePdf(`Cuenta-corriente-${cliente.nombre}`, filtroFechas);
  await exportarReporteComoPdf(html, nombreArchivo);
}
