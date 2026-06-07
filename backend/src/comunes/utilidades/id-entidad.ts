import { BadRequestException } from '@nestjs/common';

/** Identificador de entidad: exactamente 6 dígitos (ej. 000001). */
export const PATRON_ID_ENTIDAD = /^\d{6}$/;

export const LONGITUD_ID_ENTIDAD = 6;

export const MAXIMO_ID_ENTIDAD = 999_999;

export function formatearIdEntidad(numero: number): string {
  if (!Number.isInteger(numero) || numero < 1 || numero > MAXIMO_ID_ENTIDAD) {
    throw new BadRequestException('No se pudo generar el identificador secuencial.');
  }
  return String(numero).padStart(LONGITUD_ID_ENTIDAD, '0');
}

export function parsearIdEntidad(id: string): number {
  if (!PATRON_ID_ENTIDAD.test(id)) {
    throw new BadRequestException('Identificador inválido.');
  }
  return Number.parseInt(id, 10);
}

export async function obtenerSiguienteIdEntidad(
  obtenerUltimoId: () => Promise<string | null>,
): Promise<string> {
  const ultimoId = await obtenerUltimoId();
  const siguiente = ultimoId ? parsearIdEntidad(ultimoId) + 1 : 1;
  return formatearIdEntidad(siguiente);
}
