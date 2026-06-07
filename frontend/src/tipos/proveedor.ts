/** Proveedor mayorista — maestro análogo a cliente pero para circuito compras */
export interface Proveedor {
  id: string;
  nombre: string;
  /** CUIT/DNI/documento tributario único entre proveedores. */
  documento: string;
  correoElectronico: string;
  telefonoPrincipal: string;
  telefonoAlternativo: string;
  direccion: string;
  /** Tope de compras a crédito pendientes con este proveedor (ARS). Solo si compras a crédito habilitadas. */
  limiteCreditoCompras: number;
  /** Permitir cargar órdenes/compras con facturación o pago aplazado. */
  comprasCreditoHabilitadas: boolean;
  habilitado: boolean;
}
