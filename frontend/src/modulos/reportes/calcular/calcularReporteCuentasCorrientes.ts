import type { Cliente } from '../../../tipos/cliente';
import type { MovimientoCuentaCorriente } from '../../../tipos/cuentaCorriente';
import type { VentaRegistrada } from '../../../tipos/venta';
import {
  indiceVentasPorNumero,
  resolverDetalleOperacionCliente,
  type DetalleOperacionCcReporte,
} from '../detalleOperacionCuentaCorriente';
import { formatearFechaDiaMesAnio } from '../../../utilidades/formatoFechaHora';
import { obtenerDiaComparableDesdeValor } from '../../../utilidades/formatoFechaHora';
import {
  etiquetaFiltroClienteLegible,
  type FiltrosReporteConCliente,
  type OpcionEntidadReporte,
} from '../filtroEntidadReporte';
import { estaEnRangoFechas } from '../filtroFechasReporte';
import { formatearMonedaReporte } from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

function impactoSaldo(m: MovimientoCuentaCorriente): number {
  return m.tipoMovimiento === 'cargo' ? m.importe : -m.importe;
}

export interface FilaMovimientoCcReporte {
  fecha: string;
  tipo: string;
  descripcion: string;
  cargo: string;
  pago: string;
  saldo: string;
  detalleOperacion: DetalleOperacionCcReporte | null;
  tieneDetalleOperacion: boolean;
}

export interface FilaClienteCcReporte {
  nombre: string;
  documento: string;
  saldoInicial: string;
  cargosPeriodo: string;
  pagosPeriodo: string;
  saldoFinal: string;
  claseSaldo: string;
  limite: string;
  movimientos: FilaMovimientoCcReporte[];
  sinMovimientosPeriodo: boolean;
}

export interface DatosReporteCuentasCorrientes {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  filtroEntidadLegible: string;
  generadoEl: string;
  totalDeuda: string;
  clientesConSaldo: string;
  clientes: FilaClienteCcReporte[];
  sinClientes: boolean;
  /** PDF desde ficha de un cliente: KPIs y maquetación compacta. */
  informeCuentaUnica?: boolean;
  kpisCuentaUnica?: { etiqueta: string; valor: string }[];
}

export function calcularReporteCuentasCorrientes(
  clientes: Cliente[],
  movimientos: MovimientoCuentaCorriente[],
  filtro: FiltrosReporteConCliente,
  opcionesCliente: OpcionEntidadReporte[],
  ventas: VentaRegistrada[] = [],
): DatosReporteCuentasCorrientes {
  const ventasPorNumero = indiceVentasPorNumero(ventas);
  let clientesCc = clientes.filter((c) => c.cuentaCorrienteHabilitada);

  if (filtro.idCliente.trim()) {
    if (filtro.idCliente === '__consumidor_final__') {
      clientesCc = [];
    } else {
      clientesCc = clientesCc.filter((c) => c.id === filtro.idCliente);
    }
  }

  const buffer: { saldoFinal: number; fila: FilaClienteCcReporte }[] = [];
  let totalDeuda = 0;
  let conSaldo = 0;

  for (const cliente of clientesCc) {
    const movsCliente = movimientos
      .filter((m) => m.clienteId === cliente.id)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let saldoAcum = 0;
    let saldoInicial = 0;
    let cargosPeriodo = 0;
    let pagosPeriodo = 0;
    const movimientosPeriodo: FilaMovimientoCcReporte[] = [];

    for (const m of movsCliente) {
      const enPeriodo = estaEnRangoFechas(m.fecha, filtro);
      const dia = obtenerDiaComparableDesdeValor(m.fecha);
      if (dia && dia < filtro.fechaDesde) {
        saldoInicial += impactoSaldo(m);
      }
      saldoAcum += impactoSaldo(m);
      if (enPeriodo) {
        if (m.tipoMovimiento === 'cargo') cargosPeriodo += m.importe;
        else pagosPeriodo += m.importe;
        const detalleOperacion = resolverDetalleOperacionCliente(
          m.descripcion,
          m.tipoMovimiento,
          cliente.id,
          ventasPorNumero,
        );
        const esCargo = m.tipoMovimiento === 'cargo';
        const importeFormateado = formatearMonedaReporte(m.importe);
        movimientosPeriodo.push({
          fecha: formatearFechaDiaMesAnio(m.fecha),
          tipo: esCargo ? 'Cargo' : 'Pago',
          descripcion: m.descripcion,
          cargo: esCargo ? importeFormateado : '—',
          pago: esCargo ? '—' : importeFormateado,
          saldo: formatearMonedaReporte(saldoAcum),
          detalleOperacion,
          tieneDetalleOperacion: detalleOperacion !== null,
        });
      }
    }

    const saldoFinal = saldoAcum;
    if (Math.abs(saldoFinal) > 0.001) conSaldo += 1;
    if (saldoFinal > 0) totalDeuda += saldoFinal;

    const tieneActividad =
      movimientosPeriodo.length > 0 || Math.abs(saldoFinal) > 0.001 || Math.abs(saldoInicial) > 0.001;
    if (!tieneActividad) continue;

    buffer.push({
      saldoFinal,
      fila: {
        nombre: cliente.nombre,
        documento: cliente.documento,
        saldoInicial: formatearMonedaReporte(saldoInicial),
        cargosPeriodo: formatearMonedaReporte(cargosPeriodo),
        pagosPeriodo: formatearMonedaReporte(pagosPeriodo),
        saldoFinal: formatearMonedaReporte(saldoFinal),
        claseSaldo: saldoFinal > 0 ? 'rep-chip-deuda' : 'rep-chip-ok',
        limite:
          cliente.limiteCompraCuentaCorriente > 0
            ? formatearMonedaReporte(cliente.limiteCompraCuentaCorriente)
            : 'Sin límite',
        movimientos: movimientosPeriodo,
        sinMovimientosPeriodo: movimientosPeriodo.length === 0,
      },
    });
  }

  buffer.sort((a, b) => b.saldoFinal - a.saldoFinal);
  const filasCliente = buffer.map((b) => b.fila);

  const filtroEntidadLegible = etiquetaFiltroClienteLegible(filtro.idCliente, opcionesCliente);

  return {
    tituloReporte: 'Cuentas corrientes',
    ...metadatosComunesReporte(filtro, filtroEntidadLegible),
    totalDeuda: formatearMonedaReporte(totalDeuda),
    clientesConSaldo: String(conSaldo),
    clientes: filasCliente,
    sinClientes: filasCliente.length === 0,
  };
}
