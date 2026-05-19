export interface Cliente {
  id: string;
  nombre: string;
  /** DNI/CUIT/CUIL, etc.; debe ser único entre clientes (comparación normalizada). */
  documento: string;
  /** Correo de contacto; opcional. */
  correoElectronico: string;
  telefonoPrincipal: string;
  /** Teléfono alternativo u oficina; opcional */
  telefonoAlternativo: string;
  /** Dirección de entrega o fiscal; texto libre (calle, ciudad, CP). */
  direccion: string;
  /**
   * Tope máximo para compras en cuenta corriente (moneda local, ej. ARS).
   * Solo aplica con movimientos de CC; ventas contado no quedan limitadas aquí.
   * Si `cuentaCorrienteHabilitada` es false, no se usa; puede ser 0.
   */
  limiteCompraCuentaCorriente: number;
  /** Política comercial: si puede operar con cuenta corriente. */
  cuentaCorrienteHabilitada: boolean;
  /** Si puede operar en ventas (false = bloqueado / suspendido). */
  habilitado: boolean;
}
