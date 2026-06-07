import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import type { UsuarioSesion } from '../tipos/usuario-sesion';

export const UsuarioSesionActual = createParamDecorator(
  (_datos: unknown, contexto: ExecutionContext): UsuarioSesion => {
    const solicitud = contexto.switchToHttp().getRequest<Request & { user: UsuarioSesion }>();
    return solicitud.user;
  },
);
