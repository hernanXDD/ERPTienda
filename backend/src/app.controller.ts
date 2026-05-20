import { Controller, Get } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  /** Comprobación de que la API y la base responden. */
  @Get('salud')
  async obtenerSalud(): Promise<{
    ok: boolean;
    mensaje: string;
    datos: { baseDeDatos: string; entorno: string };
  }> {
    await this.prisma.$queryRaw`SELECT 1`;

    return {
      ok: true,
      mensaje: 'API operativa',
      datos: {
        baseDeDatos: 'conectada',
        entorno: process.env.NODE_ENV ?? 'development',
      },
    };
  }
}
