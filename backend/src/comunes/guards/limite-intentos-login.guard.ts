import {
  CanActivate,
  ExecutionContext,
  Injectable,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { claveIpSolicitud, limiteSolicitudes } from '../seguridad/limite-solicitudes';

@Injectable()
export class LimiteIntentosLoginGuard implements CanActivate {
  private readonly ventanaMs = 15 * 60 * 1000;

  constructor(private readonly configuracion: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const solicitud = context.switchToHttp().getRequest<Request>();
    const ip = claveIpSolicitud(
      solicitud.headers['x-forwarded-for'],
      solicitud.ip,
      solicitud.socket.remoteAddress,
    );
    const maximo = Number(this.configuracion.get<string>('RATE_LIMIT_LOGIN_MAX', '8'));
    limiteSolicitudes.verificar(`login:${ip}`, maximo, this.ventanaMs);
    return true;
  }
}
