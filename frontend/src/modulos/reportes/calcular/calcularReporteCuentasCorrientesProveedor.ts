import type { Proveedor } from '../../../tipos/proveedor';
import type { MovimientoCuentaCorrienteProveedor } from '../../../tipos/cuentaCorrienteProveedor';
import type { CompraRegistrada } from '../../../tipos/compraRegistrada';
import {
  indiceComprasPorNumero,
  resolverDetalleOperacionProveedor,
  type DetalleOperacionCcReporte,
} from '../detalleOperacionCuentaCorriente';
import { formatearFechaDiaMesAnio, obtenerDiaComparableDesdeValor } from '../../../utilidades/formatoFechaHora';
import {
  etiquetaFiltroProveedorLegible,
  type FiltrosReporteConProveedor,
  type OpcionEntidadReporte,
} from '../filtroEntidadReporte';
import { estaEnRangoFechas } from '../filtroFechasReporte';
import { formatearMonedaReporte } from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

function impactoSaldo(m: MovimientoCuentaCorrienteProveedor): number {
  return m.tipoMovimiento === 'cargo' ? m.importe : -m.importe;
}

export interface FilaMovimientoCcProveedorReporte {
  fecha: string;
  tipo: string;
  descripcion: string;
  cargo: string;
  pago: string;
  saldo: string;
  detalleOperacion: DetalleOperacionCcReporte | null;
  tieneDetalleOperacion: boolean;
}

export interface FilaProveedorCcReporte {
  nombre: string;
  documento: string;
  saldoInicial: string;
  cargosPeriodo: string;
  pagosPeriodo: string;
  saldoFinal: string;
  claseSaldo: string;
  limite: string;
  movimientos: FilaMovimientoCcProveedorReporte[];
  sinMovimientosPeriodo: boolean;
}

export interface DatosReporteCuentasCorrientesProveedor {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  filtroEntidadLegible: string;
  generadoEl: string;
  totalDeuda: string;
  proveedoresConSaldo: string;
  proveedores: FilaProveedorCcReporte[];
  sinProveedores: boolean;
  informeCuentaUnica?: boolean;
  kpisCuentaUnica?: { etiqueta: string; valor: string }[];
}

export function calcularReporteCuentasCorrientesProveedor(
  proveedores: Proveedor[],
  movimientos: MovimientoCuentaCorrienteProveedor[],
  filtro: FiltrosReporteConProveedor,
  opcionesProveedor: OpcionEntidadReporte[],
  compras: CompraRegistrada[] = [],
): DatosReporteCuentasCorrientesProveedor {
  const comprasPorNumero = indiceComprasPorNumero(compras);
  let proveedoresCc = proveedores.filter((p) => p.comprasCreditoHabilitadas);

  if (filtro.idProveedor.trim()) {
    proveedoresCc = proveedoresCc.filter((p) => p.id === filtro.idProveedor);
  }

  const buffer: { saldoFinal: number; fila: FilaProveedorCcReporte }[] = [];
  let totalDeuda = 0;
  let conSaldo = 0;

  for (const proveedor of proveedoresCc) {
    const movsProveedor = movimientos
      .filter((m) => m.proveedorId === proveedor.id)
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

    let saldoAcum = 0;
    let saldoInicial = 0;
    let cargosPeriodo = 0;
    let pagosPeriodo = 0;
    const movimientosPeriodo: FilaMovimientoCcProveedorReporte[] = [];

    for (const m of movsProveedor) {
      const enPeriodo = estaEnRangoFechas(m.fecha, filtro);
      const dia = obtenerDiaComparableDesdeValor(m.fecha);
      if (dia && dia < filtro.fechaDesde) {
        saldoInicial += impactoSaldo(m);
      }
      saldoAcum += impactoSaldo(m);
      if (enPeriodo) {
        if (m.tipoMovimiento === 'cargo') cargosPeriodo += m.importe;
        else pagosPeriodo += m.importe;
        const detalleOperacion = resolverDetalleOperacionProveedor(
          m.descripcion,
          m.tipoMovimiento,
          proveedor.id,
          comprasPorNumero,
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
        nombre: proveedor.nombre,
        documento: proveedor.documento,
        saldoInicial: formatearMonedaReporte(saldoInicial),
        cargosPeriodo: formatearMonedaReporte(cargosPeriodo),
        pagosPeriodo: formatearMonedaReporte(pagosPeriodo),
        saldoFinal: formatearMonedaReporte(saldoFinal),
        claseSaldo: saldoFinal > 0 ? 'rep-chip-deuda' : 'rep-chip-ok',
        limite:
          proveedor.limiteCreditoCompras > 0
            ? formatearMonedaReporte(proveedor.limiteCreditoCompras)
            : 'Sin límite',
        movimientos: movimientosPeriodo,
        sinMovimientosPeriodo: movimientosPeriodo.length === 0,
      },
    });
  }

  buffer.sort((a, b) => b.saldoFinal - a.saldoFinal);
  const filtroEntidadLegible = etiquetaFiltroProveedorLegible(filtro.idProveedor, opcionesProveedor);

  return {
    tituloReporte: 'Cuentas corrientes proveedores',
    ...metadatosComunesReporte(filtro, filtroEntidadLegible),
    totalDeuda: formatearMonedaReporte(totalDeuda),
    proveedoresConSaldo: String(conSaldo),
    proveedores: buffer.map((b) => b.fila),
    sinProveedores: buffer.length === 0,
  };
}
