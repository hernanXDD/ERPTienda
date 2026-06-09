import type { Negocio } from '../../tipos/negocio';

const NOMBRES_NEGOCIO_POR_DEFECTO = new Set(['erp tienda', 'mi negocio']);

export interface CamposNegocioPendientes {
  faltaCuit: boolean;
  faltaNombrePersonalizado: boolean;
  faltaContacto: boolean;
}

export function evaluarConfiguracionNegocio(negocio: Negocio | null | undefined): CamposNegocioPendientes {
  const nombre = negocio?.nombre.trim().toLowerCase() ?? '';
  return {
    faltaCuit: !negocio?.cuit.trim(),
    faltaNombrePersonalizado: !nombre || NOMBRES_NEGOCIO_POR_DEFECTO.has(nombre),
    faltaContacto: !negocio?.telefono.trim() && !negocio?.correoElectronico.trim(),
  };
}

export function negocioRequiereConfiguracion(negocio: Negocio | null | undefined): boolean {
  const campos = evaluarConfiguracionNegocio(negocio);
  return campos.faltaCuit || campos.faltaNombrePersonalizado;
}

export function mensajeNegocioIncompleto(negocio: Negocio | null | undefined): string {
  const campos = evaluarConfiguracionNegocio(negocio);
  const pendientes: string[] = [];
  if (campos.faltaNombrePersonalizado) pendientes.push('nombre comercial');
  if (campos.faltaCuit) pendientes.push('CUIT');
  if (campos.faltaContacto) pendientes.push('teléfono o correo');
  if (pendientes.length === 0) {
    return 'Completá los datos del negocio para que reportes y comprobantes salgan correctamente.';
  }
  return `Faltan datos del negocio: ${pendientes.join(', ')}. Completalos en Configuración.`;
}
