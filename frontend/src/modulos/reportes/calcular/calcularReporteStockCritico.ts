import type { Producto, Variante } from '../../../tipos/catalogo';
import { armarNombreLineaComercial } from '../../catalogo/catalogoPresentacion';
import type { FiltroFechasReporte } from '../filtroFechasReporte';
import { formatearNumeroReporte } from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

export interface FilaStockCritico {
  sku: string;
  articulo: string;
  categoria: string;
  cantidad: string;
  estado: string;
}

export interface DatosReporteStockCritico {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  generadoEl: string;
  notaCorte: string;
  cantidadAgotados: string;
  cantidadCriticos: string;
  totalAlertas: string;
  umbralLegible: string;
  filas: FilaStockCritico[];
  sinFilas: boolean;
}

export function calcularReporteStockCritico(
  productos: Producto[],
  variantes: Variante[],
  cantidadesPorVarianteId: Record<string, number>,
  nombreCategoria: (id: string) => string,
  filtro: FiltroFechasReporte,
  umbralStockMinimo: number
): DatosReporteStockCritico {
  const mapaProducto = new Map(productos.map((p) => [p.id, p]));
  const filasRaw: { cantidad: number; fila: FilaStockCritico }[] = [];

  for (const variante of variantes) {
    const producto = mapaProducto.get(variante.productoId);
    if (!producto) continue;
    const cantidad = cantidadesPorVarianteId[variante.id] ?? 0;
    if (cantidad > umbralStockMinimo) continue;

    filasRaw.push({
      cantidad,
      fila: {
        sku: variante.codigoBarras || variante.id.slice(0, 8),
        articulo: armarNombreLineaComercial(producto, variante),
        categoria: nombreCategoria(producto.categoriaId),
        cantidad: formatearNumeroReporte(cantidad),
        estado: cantidad <= 0 ? 'Agotado' : 'Crítico',
      },
    });
  }

  filasRaw.sort((a, b) => a.cantidad - b.cantidad || a.fila.articulo.localeCompare(b.fila.articulo, 'es'));

  const agotados = filasRaw.filter((f) => f.cantidad <= 0).length;
  const criticos = filasRaw.length - agotados;

  return {
    tituloReporte: 'Stock crítico',
    ...metadatosComunesReporte(filtro, 'Todos los usuarios'),
    notaCorte: `Existencias actuales del sistema. Se listan variantes agotadas o con ${formatearNumeroReporte(umbralStockMinimo)} unidades o menos.`,
    cantidadAgotados: formatearNumeroReporte(agotados),
    cantidadCriticos: formatearNumeroReporte(criticos),
    totalAlertas: formatearNumeroReporte(filasRaw.length),
    umbralLegible: formatearNumeroReporte(umbralStockMinimo),
    filas: filasRaw.map((f) => f.fila),
    sinFilas: filasRaw.length === 0,
  };
}
