import type { Cliente } from '../../tipos/cliente';
import type { MovimientoCuentaCorriente } from '../../tipos/cuentaCorriente';
import type { VentaRegistrada } from '../../tipos/venta';
import { obtenerDiaComparableDesdeValor } from '../../utilidades/formatoFechaHora';
import { calcularReporteCuentasCorrientes } from '../reportes/calcular/calcularReporteCuentasCorrientes';
import { opcionesClientesParaReporte } from '../reportes/filtroEntidadReporte';
import {
  diaComparableHoy,
  esRangoFechasValido,
  type FiltroFechasReporte,
} from '../reportes/filtroFechasReporte';
import {
  exportarReporteComoPdf,
  nombreArchivoReportePdf,
  type OpcionesAperturaPdf,
} from '../reportes/impresionReporte';
import { prepararRenderizadoReporte, renderizarPlantillaReporte } from '../reportes/motorEtaReportes';
import { plantillasReportes } from '../reportes/plantillasReportes';

export interface ParametrosExportarPdfCuentaCorrienteCliente {
  cliente: Cliente;
  clientes: Cliente[];
  movimientos: MovimientoCuentaCorriente[];
  ventas?: VentaRegistrada[];
  /** Vacío = sin límite inferior (desde el primer movimiento). */
  fechaDesde?: string;
  /** Vacío = sin límite superior (hasta el último movimiento o hoy si hay «desde»). */
  fechaHasta?: string;
  ventanaPdfDestino?: Window | null;
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
  const { cliente, clientes, movimientos, ventas = [], fechaDesde, fechaHasta, ventanaPdfDestino } =
    parametros;

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
    ventas,
  );
  datos.tituloReporte = `Cuenta corriente · ${cliente.nombre}`;
  datos.filtroEntidadLegible = `${cliente.nombre} · ${cliente.documento}`;

  const filaCliente = datos.clientes[0];
  if (filaCliente) {
    datos.informeCuentaUnica = true;
    datos.kpisCuentaUnica = [
      { etiqueta: 'Saldo actual', valor: filaCliente.saldoFinal },
      { etiqueta: 'Cargos período', valor: filaCliente.cargosPeriodo },
      { etiqueta: 'Pagos período', valor: filaCliente.pagosPeriodo },
    ];
  }

  await prepararRenderizadoReporte();
  const html = renderizarPlantillaReporte(plantillasReportes['cuentas-corrientes'], datos);
  const nombreArchivo = nombreArchivoReportePdf(`Cuenta-corriente-${cliente.nombre}`, filtroFechas);
  const opcionesPdf: OpcionesAperturaPdf = { ventanaDestino: ventanaPdfDestino };
  await exportarReporteComoPdf(html, nombreArchivo, opcionesPdf);
}
