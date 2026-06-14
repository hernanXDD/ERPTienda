import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppController } from '../src/app.controller';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Salud (e2e)', () => {
  let app: INestApplication<App>;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: {
            $queryRaw: jest.fn().mockResolvedValue([{ '?column?': 1 }]),
          },
        },
      ],
    }).compile();

    app = modulo.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('GET /api/salud responde operativo', async () => {
    const respuesta = await request(app.getHttpServer()).get('/api/salud').expect(200);

    expect(respuesta.body).toMatchObject({
      ok: true,
      mensaje: 'API operativa',
      datos: {
        baseDeDatos: 'conectada',
      },
    });
  });
});
