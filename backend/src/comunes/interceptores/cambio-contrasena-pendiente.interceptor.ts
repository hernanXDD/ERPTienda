import {
  CallHandler,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import type { UsuarioSesion } from '../tipos/usuario-sesion';

const RUTAS_PERMITIDAS_CON_CAMBIO_PENDIENTE = [
  '/api/autenticacion/cambio-contrasena-inicial',
  '/api/autenticacion/sesion-actual',
  '/api/autenticacion/cierre-sesion',
  '/api/salud',
];

/** Bloquea el resto de la API hasta que el usuario defina su contraseña en el primer ingreso. */
@Injectable()
export class CambioContrasenaPendienteInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const solicitud = context.switchToHttp().getRequest<Request & { user?: UsuarioSesion }>();
    const usuario = solicitud.user;

    if (!usuario?.debeCambiarContrasena) {
      return next.handle();
    }

    const ruta = solicitud.path;
    const permitida = RUTAS_PERMITIDAS_CON_CAMBIO_PENDIENTE.some(
      (patron) => ruta === patron || ruta.startsWith(`${patron}/`),
    );

    if (!permitida) {
      throw new ForbiddenException(
        'Debe establecer una contraseña nueva antes de utilizar el sistema.',
      );
    }

    return next.handle();
  }
}
