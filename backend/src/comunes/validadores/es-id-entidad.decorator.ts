import { Matches, type ValidationOptions } from 'class-validator';
import { PATRON_ID_ENTIDAD } from '../utilidades/id-entidad';

export function EsIdEntidad(opciones?: ValidationOptions) {
  return Matches(PATRON_ID_ENTIDAD, {
    message: 'El identificador debe tener 6 dígitos (ej. 000001).',
    ...opciones,
  });
}
