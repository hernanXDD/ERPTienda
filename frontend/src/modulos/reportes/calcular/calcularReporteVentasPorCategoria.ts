import type { Producto, Variante } from '../../../tipos/catalogo';
import type { VentaRegistrada } from '../../../tipos/venta';
import { estaEnRangoFechas, type FiltroFechasReporte } from '../filtroFechasReporte';
import {
  formatearMonedaReporte,
  formatearNumeroReporte,
  formatearPorcentajeReporte,
} from '../formatoMonedaReporte';
import { metadatosComunesReporte } from '../metadatosReporte';

export interface FilaVentasPorCategoria {
  categoria: string;
  unidades: string;
  importe: string;
  porcentaje: string;
}

export interface DatosReporteVentasPorCategoria {
  tituloReporte: string;
  negocioNombre: string;
  rangoLegible: string;
  generadoEl: string;
  categoriasConVentas: string;
  unidadesVendidas: string;
  importeTotal: string;
  filas: FilaVentasPorCategoria[];
  sinFilas: boolean;
}

export function calcularReporteVentasPorCategoria(
  productos: Producto[],
  variantes: Variante[],
  ventas: VentaRegistrada[],
  nombreCategoria: (id: string) => string,
  filtro: FiltroFechasReporte
): DatosReporteVentasPorCategoria {
  const mapaProducto = new Map(productos.map((p) => [p.id, p]));
  const mapaVariante = new Map(variantes.map((v) => [v.id, v]));
  const acum = new Map<string, { unidades: number; importe: number; etiqueta: string }>();

  for (const venta of ventas) {
    if (!estaEnRangoFechas(venta.fecha, filtro)) continue;
    for (const linea of venta.lineas) {
      const variante = mapaVariante.get(linea.varianteId);
      const producto = variante ? mapaProducto.get(variante.productoId) : undefined;
      const categoriaId = producto?.categoriaId ?? '__sin_categoria__';
      const etiqueta = producto ? nombreCategoria(producto.categoriaId) : 'Sin categoría';

      const prev = acum.get(categoriaId) ?? { unidades: 0, importe: 0, etiqueta };
      acum.set(categoriaId, {
        etiqueta: prev.etiqueta,
        unidades: prev.unidades + linea.cantidad,
        importe: prev.importe + linea.subtotal,
      });
    }
  }

  const filasRaw = [...acum.values()].sort((a, b) => b.importe - a.importe || b.unidades - a.unidades);
  const importeTotal = filasRaw.reduce((a, f) => a + f.importe, 0);
  const unidadesTotal = filasRaw.reduce((a, f) => a + f.unidades, 0);

  const filas: FilaVentasPorCategoria[] = filasRaw.map((f) => ({
    categoria: f.etiqueta,
    unidades: formatearNumeroReporte(f.unidades),
    importe: formatearMonedaReporte(f.importe),
    porcentaje: formatearPorcentajeReporte(f.importe, importeTotal),
  }));

  return {
    tituloReporte: 'Ventas por categoría',
    ...metadatosComunesReporte(filtro, 'Todos los usuarios'),
    categoriasConVentas: formatearNumeroReporte(filasRaw.length),
    unidadesVendidas: formatearNumeroReporte(unidadesTotal),
    importeTotal: formatearMonedaReporte(importeTotal),
    filas,
    sinFilas: filasRaw.length === 0,
  };
}
