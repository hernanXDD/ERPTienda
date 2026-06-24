export interface LineaDevolucionRegistro {
  ventaLineaId: string;
  cantidad: number;
}

export interface DevolucionRegistrada {
  id: string;
  numero: string;
  fecha: string;
  ventaId: string;
  numeroVenta: string;
  nombreClienteMostrar: string;
  total: number;
  observaciones: string;
  lineas: LineaDevolucionLinea[];
}

export interface LineaDevolucionLinea {
  id: string;
  ventaLineaId: string;
  varianteId: string;
  nombre: string;
  cantidad: number;
  precioUnitario: number;
  subtotal: number;
}

export interface DatosRegistrarDevolucion {
  ventaId: string;
  lineas: LineaDevolucionRegistro[];
  observaciones?: string;
}
