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
 * SKU vendible: combinación talle + color de un producto.
 * Stock, ventas y compras operan sobre variante, no sobre producto.
 */
export interface Variante {
  id: string;
  productoId: string;
  talle: string;
  color: string;
  codigoBarras: string;
  activa: boolean;
}
