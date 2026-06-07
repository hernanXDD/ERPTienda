import type { Producto, Variante } from '../../../tipos/catalogo';
import { armarNombreLineaComercial } from '../../catalogo/catalogoPresentacion';
import { estaEnRangoFechas, type FiltroFechasReporte } from '../filtroFechasReporte';
import { formatearMonedaReporte, formatearNumeroReporte } from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';
import type { VentaRegistrada } from '../../../tipos/venta';

export interface FilaStockValorizado {
  sku: string;
  articulo: string;
  categoria: string;
  cantidad: string;
  precioUnitario: string;
  valorTotal: string;
}

export interface DatosReporteStockValorizado {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  generadoEl: string;
  notaCorte: string;
  totalUnidades: string;
  totalValorizado: string;
  cantidadSkus: string;
  unidadesVendidasPeriodo: string;
  filas: FilaStockValorizado[];
  sinFilas: boolean;
}

export function calcularReporteStockValorizado(
  productos: Producto[],
  variantes: Variante[],
  cantidadesPorVarianteId: Record<string, number>,
  nombreCategoria: (id: string) => string,
  ventas: VentaRegistrada[],
  filtro: FiltroFechasReporte
): DatosReporteStockValorizado {
  const mapaProducto = new Map(productos.map((p) => [p.id, p]));
  const filasRaw: { valor: number; unidades: number; fila: FilaStockValorizado }[] = [];

  for (const variante of variantes) {
    const producto = mapaProducto.get(variante.productoId);
    if (!producto) continue;
    const cantidad = cantidadesPorVarianteId[variante.id] ?? 0;
    if (cantidad <= 0) continue;
    const valor = cantidad * producto.precioVenta;
    filasRaw.push({
      valor,
      unidades: cantidad,
      fila: {
        sku: variante.codigoBarras || variante.id.slice(0, 8),
        articulo: armarNombreLineaComercial(producto, variante),
        categoria: nombreCategoria(producto.categoriaId),
        cantidad: formatearNumeroReporte(cantidad),
        precioUnitario: formatearMonedaReporte(producto.precioVenta),
        valorTotal: formatearMonedaReporte(valor),
      },
    });
  }

  filasRaw.sort((a, b) => b.valor - a.valor);

  const totalUnidades = filasRaw.reduce((a, f) => a + f.unidades, 0);
  const totalValor = filasRaw.reduce((a, f) => a + f.valor, 0);

  let unidadesVendidasPeriodo = 0;
  for (const v of ventas) {
    if (!estaEnRangoFechas(v.fecha, filtro)) continue;
    for (const ln of v.lineas) {
      unidadesVendidasPeriodo += ln.cantidad;
    }
  }

  return {
    tituloReporte: 'Stock valorizado',
    ...metadatosComunesReporte(filtro, 'Todos los usuarios'),
    notaCorte: `Existencias actuales del sistema. Unidades vendidas en el período: ${formatearNumeroReporte(unidadesVendidasPeriodo)}.`,
    totalUnidades: formatearNumeroReporte(totalUnidades),
    totalValorizado: formatearMonedaReporte(totalValor),
    cantidadSkus: formatearNumeroReporte(filasRaw.length),
    unidadesVendidasPeriodo: formatearNumeroReporte(unidadesVendidasPeriodo),
    filas: filasRaw.map((f) => f.fila),
    sinFilas: filasRaw.length === 0,
  };
}
