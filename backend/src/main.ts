import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import type { NextFunction, Request, Response } from 'express';
import { AppModule } from './app.module';
import { obtenerOrigenesCorsPermitidos } from './config/cors.config';
import { ExcepcionHttpFiltro } from './comunes/filtros/excepcion-http.filtro';
import { CambioContrasenaPendienteInterceptor } from './comunes/interceptores/cambio-contrasena-pendiente.interceptor';
import { claveIpSolicitud, limiteSolicitudes } from './comunes/seguridad/limite-solicitudes';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configuracion = app.get(ConfigService);
  const origenesPermitidos = obtenerOrigenesCorsPermitidos(configuracion);
  const confiarProxy = configuracion.get<string>('TRUST_PROXY', 'false') === 'true';
  const maximoApi = Number(configuracion.get<string>('RATE_LIMIT_API_MAX', '240'));
  const ventanaApiMs = Number(configuracion.get<string>('RATE_LIMIT_API_WINDOW_MS', '60000'));

  if (confiarProxy) {
    app.getHttpAdapter().getInstance().set('trust proxy', 1);
  }

  app.enableShutdownHooks();
  app.use(helmet());

  app.use((solicitud: Request, respuesta: Response, siguiente: NextFunction) => {
    if (
      solicitud.method === 'OPTIONS' ||
      solicitud.path === '/api/salud' ||
      solicitud.path.startsWith('/api/autenticacion/inicio-sesion')
    ) {
      siguiente();
      return;
    }

    if (!solicitud.path.startsWith('/api/')) {
      siguiente();
      return;
    }

    try {
      const ip = claveIpSolicitud(
        solicitud.headers['x-forwarded-for'],
        solicitud.ip,
        solicitud.socket.remoteAddress,
      );
      limiteSolicitudes.verificar(`api:${ip}`, maximoApi, ventanaApiMs);
      siguiente();
    } catch (error) {
      siguiente(error);
    }
  });

  app.enableCors({
    origin: (
      origen: string | undefined,
      callback: (err: Error | null, permitir?: boolean) => void,
    ) => {
      if (!origen) {
        callback(null, true);
        return;
      }
      if (origenesPermitidos.includes(origen)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.useGlobalFilters(new ExcepcionHttpFiltro());

  app.useGlobalInterceptors(new CambioContrasenaPendienteInterceptor());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const puerto = Number(configuracion.get<string>('PUERTO', '3000'));
  const host = configuracion.get<string>('HOST', '0.0.0.0');
  await app.listen(puerto, host);

  // eslint-disable-next-line no-console
  console.log(`API ERP Tienda escuchando en http://${host}:${puerto}/api`);
  if (configuracion.get<string>('NODE_ENV') !== 'production') {
    // eslint-disable-next-line no-console
    console.log(`CORS permitido para: ${origenesPermitidos.join(', ')}`);
  }
}

void bootstrap();
