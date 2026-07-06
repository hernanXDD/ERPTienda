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

  canActivate(contexto: ExecutionContext): boolean {
    const solicitud = contexto.switchToHttp().getRequest<Request>();
    const ip = claveIpSolicitud(
      solicitud.headers['x-forwarded-for'],
      solicitud.ip,
      solicitud.socket.remoteAddress,
    );
    const maximoPorUsuario = Number(
      this.configuracion.get<string>('RATE_LIMIT_LOGIN_MAX', '10'),
    );
    const maximoPorIp = Number(
      this.configuracion.get<string>('RATE_LIMIT_LOGIN_IP_MAX', '40'),
    );

    const nombreUsuario = extraerNombreUsuarioLogin(solicitud.body);
    if (nombreUsuario) {
      limiteSolicitudes.verificar(
        `login:usuario:${nombreUsuario}`,
        maximoPorUsuario,
        this.ventanaMs,
      );
    }

    limiteSolicitudes.verificar(`login:ip:${ip}`, maximoPorIp, this.ventanaMs);
    return true;
  }
}

function extraerNombreUsuarioLogin(body: unknown): string | null {
  if (!body || typeof body !== 'object' || !('nombreUsuario' in body)) {
    return null;
  }
  const valor = (body as { nombreUsuario?: unknown }).nombreUsuario;
  if (typeof valor !== 'string') return null;
  const normalizado = valor.trim().toLowerCase();
  return normalizado.length > 0 ? normalizado : null;
}
