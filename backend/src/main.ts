import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExcepcionHttpFiltro } from './comunes/filtros/excepcion-http.filtro';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  app.enableCors({ origin: true });

  app.useGlobalFilters(new ExcepcionHttpFiltro());

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  app.setGlobalPrefix('api');

  const puerto = Number(process.env.PUERTO ?? 3000);
  await app.listen(puerto);

  // eslint-disable-next-line no-console
  console.log(`API ERP Tienda escuchando en http://localhost:${puerto}/api`);
}

void bootstrap();
