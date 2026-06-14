import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { CondicionCompra, RolUsuario } from '@prisma/client';
import { Test, TestingModule } from '@nestjs/testing';
import { permisosPorDefectoSegunRol } from '../../comunes/tipos/permisos-usuario';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { CatalogoService } from '../catalogo/catalogo.service';
import { CuentaCorrienteProveedorService } from '../cuenta-corriente-proveedor/cuenta-corriente-proveedor.service';
import { StockService } from '../stock/stock.service';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ComprasService } from './compras.service';

const operador: UsuarioSesion = {
  id: '000001',
  nombreUsuario: 'admin',
  rol: 'ADMIN',
  permisos: permisosPorDefectoSegunRol(RolUsuario.ADMIN),
  debeCambiarContrasena: false,
  modoOscuroHabilitado: false,
};

describe('ComprasService', () => {
  let servicio: ComprasService;

  const prisma = {
    proveedor: { findFirst: jest.fn() },
    compra: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  };

  const stockService = { registrarEntradaPorCompra: jest.fn() };
  const catalogoService = { actualizarCostosPorCompra: jest.fn() };
  const cuentaCorrienteProveedorService = { validarCreditoDisponibleParaCargo: jest.fn(), registrarCargo: jest.fn() };
  const idSecuencia = { siguienteCompra: jest.fn(), siguientesCompraLinea: jest.fn() };

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        ComprasService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdSecuenciaService, useValue: idSecuencia },
        { provide: StockService, useValue: stockService },
        { provide: CatalogoService, useValue: catalogoService },
        { provide: CuentaCorrienteProveedorService, useValue: cuentaCorrienteProveedorService },
      ],
    }).compile();

    servicio = modulo.get(ComprasService);
    jest.clearAllMocks();
  });

  describe('registrar', () => {
    const lineaValida = {
      varianteId: '000101',
      nombre: 'Remera M',
      cantidad: 2,
      costoUnitario: 500,
      subtotal: 1000,
    };

    it('rechaza totales incoherentes', async () => {
      await expect(
        servicio.registrar(
          {
            proveedorId: '000020',
            nombreProveedorMostrar: 'Proveedor SA',
            condicionCompra: CondicionCompra.CONTADO,
            total: 1200,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.proveedor.findFirst).not.toHaveBeenCalled();
    });

    it('rechaza proveedor inexistente', async () => {
      prisma.proveedor.findFirst.mockResolvedValue(null);

      await expect(
        servicio.registrar(
          {
            proveedorId: '000020',
            nombreProveedorMostrar: 'Proveedor SA',
            condicionCompra: CondicionCompra.CONTADO,
            total: 1000,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza compra a cuenta si el proveedor no tiene crédito habilitado', async () => {
      prisma.proveedor.findFirst.mockResolvedValue({
        id: '000020',
        comprasCreditoHabilitadas: false,
        habilitado: true,
        limiteCreditoCompras: 0,
      });

      await expect(
        servicio.registrar(
          {
            proveedorId: '000020',
            nombreProveedorMostrar: 'Proveedor SA',
            condicionCompra: CondicionCompra.CUENTA_PROVEEDOR,
            total: 1000,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(ConflictException);
    });
  });
});
