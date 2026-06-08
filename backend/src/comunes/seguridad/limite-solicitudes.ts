import { HttpException, HttpStatus } from '@nestjs/common';

interface RegistroLimite {
  cantidad: number;
  reiniciaEn: number;
}

/**
 * Registro en memoria de intentos por clave (IP + prefijo).
 * Adecuado para una instancia en VPS; usar Redis si hay varias réplicas.
 */
class LimiteSolicitudesRegistro {
  private readonly registros = new Map<string, RegistroLimite>();

  verificar(clave: string, maximo: number, ventanaMs: number): void {
    const ahora = Date.now();
    const registro = this.registros.get(clave);

    if (!registro || ahora >= registro.reiniciaEn) {
      this.registros.set(clave, { cantidad: 1, reiniciaEn: ahora + ventanaMs });
      return;
    }

    if (registro.cantidad >= maximo) {
      const segundosRestantes = Math.ceil((registro.reiniciaEn - ahora) / 1000);
      throw new HttpException(
        `Demasiadas solicitudes. Probá de nuevo en ${segundosRestantes} segundos.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    registro.cantidad += 1;
  }
}

export const limiteSolicitudes = new LimiteSolicitudesRegistro();

export function claveIpSolicitud(
  ipEncabezado: string | string[] | undefined,
  ipExpress: string | undefined,
  ipSocket: string | undefined,
): string {
  const desdeProxy =
    typeof ipEncabezado === 'string'
      ? ipEncabezado.split(',')[0]?.trim()
      : Array.isArray(ipEncabezado)
        ? ipEncabezado[0]?.trim()
        : undefined;

  return desdeProxy ?? ipExpress ?? ipSocket ?? 'desconocido';
}
