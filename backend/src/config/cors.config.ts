import type { ConfigService } from '@nestjs/config';

const ORIGENES_DESARROLLO = ['http://localhost:5173', 'http://127.0.0.1:5173'];

/** Quita barra final para comparar orígenes de forma consistente. */
export function normalizarOrigenCors(origen: string): string {
  return origen.trim().replace(/\/+$/, '');
}

/** Orígenes permitidos para CORS según CORS_ORIGENES o defaults de desarrollo. */
export function obtenerOrigenesCorsPermitidos(configuracion: ConfigService): string[] {
  const raw = configuracion.get<string>('CORS_ORIGENES', '');
  const explicitos = raw
    .split(',')
    .map((origen) => normalizarOrigenCors(origen))
    .filter(Boolean);

  if (explicitos.length > 0) {
    return explicitos;
  }

  if (configuracion.get<string>('NODE_ENV') !== 'production') {
    return [...ORIGENES_DESARROLLO];
  }

  return [];
}
