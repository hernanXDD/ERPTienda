export type IdCondicionCompra = 'CONTADO' | 'CUENTA_PROVEEDOR';

export interface LineaCompraRegistro {
  productoId: string | null;
  nombre: string;
  cantidad: number;
  costoUnitario: number;
  subtotal: number;
}

export interface CompraRegistrada {
  id: string;
  /** Número visible (ej. C-00001). */
  numero: string;
  fecha: string;
  proveedorId: string;
  nombreProveedorMostrar: string;
  condicionCompra: IdCondicionCompra;
  total: number;
  lineas: LineaCompraRegistro[];
  observaciones: string;
}
