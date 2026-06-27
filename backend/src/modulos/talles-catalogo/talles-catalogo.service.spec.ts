import { ConflictException } from '@nestjs/common';
import { TallesCatalogoService } from './talles-catalogo.service';

describe('TallesCatalogoService', () => {
  const crearServicio = (tallesExistentes: { id: string; codigo: string; nombre: string }[]) => {
    const prisma = {
      talleCatalogo: {
        findMany: jest.fn(async () => tallesExistentes),
        aggregate: jest.fn(async () => ({ _max: { orden: 1 } })),
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        count: jest.fn(),
      },
    };
    const idSecuencia = {
      siguienteTalleCatalogo: jest.fn(async () => '000099'),
    };
    return {
      servicio: new TallesCatalogoService(prisma as never, idSecuencia as never),
      prisma,
    };
  };

  describe('crear', () => {
    it('rechaza un talle que solo difiere en mayúsculas', async () => {
      const { servicio } = crearServicio([
        { id: '000005', codigo: 'XL', nombre: 'XL' },
      ]);

      await expect(
        servicio.crear({ nombre: 'xL', tipo: 'LETRA', habilitado: true }),
      ).rejects.toBeInstanceOf(ConflictException);

      await expect(
        servicio.crear({ nombre: 'xL', tipo: 'LETRA', habilitado: true }),
      ).rejects.toThrow(/Ya existe el talle «XL»/);
    });

    it('permite crear un talle distinto', async () => {
      const { servicio, prisma } = crearServicio([
        { id: '000005', codigo: 'XL', nombre: 'XL' },
      ]);

      prisma.talleCatalogo.create.mockResolvedValue({
        id: '000099',
        codigo: '2XL',
        nombre: '2XL',
        tipo: 'LETRA',
        habilitado: true,
        orden: 2,
      });

      const creado = await servicio.crear({ nombre: '2XL', tipo: 'LETRA', habilitado: true });

      expect(creado.codigo).toBe('2XL');
      expect(prisma.talleCatalogo.create).toHaveBeenCalled();
    });
  });

  describe('actualizar', () => {
    it('rechaza renombrar a un talle ya existente sin importar mayúsculas', async () => {
      const prisma = {
        talleCatalogo: {
          findMany: jest.fn(async () => [
            { id: '000004', codigo: 'L', nombre: 'L' },
            { id: '000005', codigo: 'XL', nombre: 'XL' },
          ]),
          findFirst: jest.fn(async () => ({
            id: '000004',
            codigo: 'L',
            nombre: 'L',
            tipo: 'LETRA',
            habilitado: true,
            orden: 4,
          })),
          update: jest.fn(),
        },
      };
      const servicio = new TallesCatalogoService(prisma as never, {} as never);

      await expect(
        servicio.actualizar('000004', {
          nombre: 'xL',
          tipo: 'LETRA',
          habilitado: true,
          orden: 4,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });
});
