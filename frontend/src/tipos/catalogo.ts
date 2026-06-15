/** Catálogo maestro: tipo de artículo (remera, buzo, calzado, etc.). */
export interface Categoria {
  id: string;
  nombre: string;
  descripcion: string;
}

/**
 * Artículo padre del catálogo. No incluye talle/color ni código de barras
 * (pertenecen a variante). Precio de venta de referencia del producto.
 */
export interface Producto {
  id: string;
  nombre: string;
  marca: string;
  descripcion: string;
  categoriaId: string;
  precioVenta: number;
}

/**
 * SKU vendible por talle. El detalle de color/modelo va en el nombre del producto.
 * Stock, ventas y compras operan sobre variante, no sobre producto.
 */
export interface Variante {
  id: string;
  productoId: string;
  talle: string;
  /** Legacy; nuevos registros usan cadena vacía. */
  color: string;
  codigoBarras: string;
  activa: boolean;
}
