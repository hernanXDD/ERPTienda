export interface FormaPago {
  id: string;
  codigo: string;
  nombre: string;
  facturar: boolean;
  habilitado: boolean;
  orden: number;
}

export interface DatosCrearFormaPago {
  nombre: string;
  facturar?: boolean;
  habilitado?: boolean;
}

export interface DatosActualizarFormaPago {
  nombre: string;
  facturar: boolean;
  habilitado: boolean;
  orden?: number;
}
