import { Matches, type ValidationOptions } from 'class-validator';
import {
  MENSAJE_POLITICA_CONTRASENA,
  PATRON_POLITICA_CONTRASENA,
} from '../utilidades/politica-contrasena';

export function EsContrasenaSegura(opciones?: ValidationOptions) {
  return Matches(PATRON_POLITICA_CONTRASENA, {
    message: MENSAJE_POLITICA_CONTRASENA,
    ...opciones,
  });
}
