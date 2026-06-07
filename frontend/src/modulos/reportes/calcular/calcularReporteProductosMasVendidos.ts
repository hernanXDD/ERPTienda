import type { Producto, Variante } from '../../../tipos/catalogo';
import type { VentaRegistrada } from '../../../tipos/venta';
import { armarNombreLineaComercial } from '../../catalogo/catalogoPresentacion';
import { estaEnRangoFechas, type FiltroFechasReporte } from '../filtroFechasReporte';
import {
  formatearMonedaReporte,
  formatearNumeroReporte,
  formatearPorcentajeReporte,
} from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

export interface FilaProductoMasVendido {
  posicion: string;
  articulo: string;
  categoria: string;
  unidades: string;
  importe: string;
  porcentaje: string;
}

export interface DatosReporteProductosMasVendidos {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  generadoEl: string;
  productosDistintos: string;
  unidadesVendidas: string;
  importeTotal: string;
  filas: FilaProductoMasVendido[];
  sinFilas: boolean;
}

export function calcularReporteProductosMasVendidos(
  productos: Producto[],
  variantes: Variante[],
  ventas: VentaRegistrada[],
  nombreCategoria: (id: string) => string,
  filtro: FiltroFechasReporte
): DatosReporteProductosMasVendidos {
  const mapaProducto = new Map(productos.map((p) => [p.id, p]));
  const mapaVariante = new Map(variantes.map((v) => [v.id, v]));
  const acum = new Map<string, { unidades: number; importe: number; articulo: string; categoria: string }>();

  for (const venta of ventas) {
    if (!estaEnRangoFechas(venta.fecha, filtro)) continue;
    for (const linea of venta.lineas) {
      const variante = mapaVariante.get(linea.varianteId);
      const producto = variante ? mapaProducto.get(variante.productoId) : undefined;
      const articulo =
        producto && variante
          ? armarNombreLineaComercial(producto, variante)
          : linea.nombre;
      const categoria = producto ? nombreCategoria(producto.categoriaId) : '—';

      const prev = acum.get(linea.varianteId) ?? {
        unidades: 0,
        importe: 0,
        articulo,
        categoria,
      };
      acum.set(linea.varianteId, {
        articulo: prev.articulo,
        categoria: prev.categoria,
        unidades: prev.unidades + linea.cantidad,
        importe: prev.importe + linea.subtotal,
      });
    }
  }

  const filasRaw = [...acum.values()].sort((a, b) => b.unidades - a.unidades || b.importe - a.importe);
  const importeTotal = filasRaw.reduce((a, f) => a + f.importe, 0);
  const unidadesTotal = filasRaw.reduce((a, f) => a + f.unidades, 0);

  const filas: FilaProductoMasVendido[] = filasRaw.map((f, i) => ({
    posicion: formatearNumeroReporte(i + 1),
    articulo: f.articulo,
    categoria: f.categoria,
    unidades: formatearNumeroReporte(f.unidades),
    importe: formatearMonedaReporte(f.importe),
    porcentaje: formatearPorcentajeReporte(f.importe, importeTotal),
  }));

  return {
    tituloReporte: 'Productos más vendidos',
    ...metadatosComunesReporte(filtro, 'Todos los usuarios'),
    productosDistintos: formatearNumeroReporte(filasRaw.length),
    unidadesVendidas: formatearNumeroReporte(unidadesTotal),
    importeTotal: formatearMonedaReporte(importeTotal),
    filas,
    sinFilas: filasRaw.length === 0,
  };
}
