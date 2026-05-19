export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
}

export interface Producto {
  id: string;
  nombre: string;
  tipoPrenda: string;
  marca: string;
  descripcion: string;
  categoriaId: string;
  /** Código de barras (EAN/UPC interno). Vacío si el artículo no tiene código. */
  codigoBarras: string;
  /** Precio de venta vigente en moneda local (sin impuestos desglosados por ahora). */
  precioVenta: number;
}
