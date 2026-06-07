import type { AuditoriaStockResumen } from '../../../tipos/stock';
import { formatearFechaYHora } from '../../../utilidades/formatoFechaHora';
import { etiquetaTipoAuditoriaStock } from '../../inventario/etiquetasAuditoriaStock';
import { type FiltroFechasReporte } from '../filtroFechasReporte';
import { formatearNumeroReporte } from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

export interface FilaMovimientoStockReporte {
  fecha: string;
  tipo: string;
  titulo: string;
  referencia: string;
  movimientos: string;
  variacionNeta: string;
  registradoPor: string;
}

export interface DatosReporteMovimientosStock {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  generadoEl: string;
  totalAuditorias: string;
  cantidadVentas: string;
  cantidadCompras: string;
  cantidadConteos: string;
  variacionNetaTotal: string;
  filas: FilaMovimientoStockReporte[];
  sinFilas: boolean;
}

function formatearVariacionReporte(valor: number): string {
  if (!Number.isFinite(valor) || valor === 0) return formatearNumeroReporte(0);
  const texto = formatearNumeroReporte(Math.abs(valor));
  return valor > 0 ? `+${texto}` : `−${texto}`;
}

export function calcularReporteMovimientosStock(
  auditorias: AuditoriaStockResumen[],
  filtro: FiltroFechasReporte
): DatosReporteMovimientosStock {
  const ordenadas = [...auditorias].sort(
    (a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime()
  );

  let ventas = 0;
  let compras = 0;
  let conteos = 0;
  let variacionNetaTotal = 0;

  const filas: FilaMovimientoStockReporte[] = ordenadas.map((a) => {
    if (a.tipo === 'venta') ventas += 1;
    else if (a.tipo === 'compra') compras += 1;
    else conteos += 1;
    variacionNetaTotal += a.variacionNeta;

    return {
      fecha: formatearFechaYHora(a.fecha),
      tipo: etiquetaTipoAuditoriaStock(a.tipo),
      titulo: a.titulo,
      referencia: a.referencia?.trim() || '—',
      movimientos: formatearNumeroReporte(a.cantidadMovimientos),
      variacionNeta: formatearVariacionReporte(a.variacionNeta),
      registradoPor: a.registradoPor?.etiquetaUsuario?.trim() || '—',
    };
  });

  return {
    tituloReporte: 'Movimientos de stock',
    ...metadatosComunesReporte(filtro, 'Todos los usuarios'),
    totalAuditorias: formatearNumeroReporte(ordenadas.length),
    cantidadVentas: formatearNumeroReporte(ventas),
    cantidadCompras: formatearNumeroReporte(compras),
    cantidadConteos: formatearNumeroReporte(conteos),
    variacionNetaTotal: formatearVariacionReporte(variacionNetaTotal),
    filas,
    sinFilas: ordenadas.length === 0,
  };
}
