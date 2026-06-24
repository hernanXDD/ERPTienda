import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { permisosPorDefectoSegunRol } from '../../comunes/tipos/permisos-usuario';
import { CondicionIvaCliente, FormaPagoVenta, RolUsuario } from '@prisma/client';
import { CuponesDescuentoService } from '../cupones-descuento/cupones-descuento.service';
import { CuentaCorrienteService } from '../cuenta-corriente/cuenta-corriente.service';
import { StockService } from '../stock/stock.service';
import { IdSecuenciaService } from '../../prisma/id-secuencia.service';
import { PrismaService } from '../../prisma/prisma.service';
import { VentasService } from './ventas.service';

const operador: UsuarioSesion = {
  id: '000001',
  nombreUsuario: 'admin',
  rol: 'ADMIN',
  permisos: permisosPorDefectoSegunRol(RolUsuario.ADMIN),
  debeCambiarContrasena: false,
  modoOscuroHabilitado: false,
};

describe('VentasService', () => {
  let servicio: VentasService;

  const prisma = {
    cliente: { findFirst: jest.fn() },
    venta: { findMany: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), create: jest.fn() },
    $transaction: jest.fn(),
  };

  const stockService = {
    validarStockBloqueadoParaVenta: jest.fn(),
    aplicarSalidaPorVenta: jest.fn(),
  };

  const cuentaCorrienteService = {
    validarCreditoDisponibleParaCargo: jest.fn(),
    registrarCargo: jest.fn(),
  };

  const cuponesDescuentoService = {
    validarYAplicarCuponEnVenta: jest.fn(),
  };

  const idSecuencia = {
    siguienteVenta: jest.fn(),
    siguientesVentaLinea: jest.fn(),
  };

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        { provide: PrismaService, useValue: prisma },
        { provide: IdSecuenciaService, useValue: idSecuencia },
        { provide: StockService, useValue: stockService },
        { provide: CuentaCorrienteService, useValue: cuentaCorrienteService },
        { provide: CuponesDescuentoService, useValue: cuponesDescuentoService },
      ],
    }).compile();

    servicio = modulo.get(VentasService);
    jest.clearAllMocks();
  });

  describe('registrar', () => {
    const lineaValida = {
      varianteId: '000101',
      nombre: 'Remera M',
      cantidad: 1,
      precioUnitario: 1000,
      subtotal: 1000,
    };

    it('rechaza totales incoherentes antes de consultar la base', async () => {
      await expect(
        servicio.registrar(
          {
            clienteId: null,
            nombreClienteMostrar: 'Consumidor final',
            formaPago: FormaPagoVenta.EFECTIVO,
            total: 1500,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(prisma.cliente.findFirst).not.toHaveBeenCalled();
    });

    it('exige cliente en ventas a cuenta corriente', async () => {
      await expect(
        servicio.registrar(
          {
            clienteId: null,
            nombreClienteMostrar: 'Sin cliente',
            formaPago: FormaPagoVenta.CUENTA_CORRIENTE,
            total: 1000,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(/requiere un cliente/);
    });

    it('rechaza cliente inexistente en cuenta corriente', async () => {
      prisma.cliente.findFirst.mockResolvedValue(null);

      await expect(
        servicio.registrar(
          {
            clienteId: '000010',
            nombreClienteMostrar: 'Cliente X',
            formaPago: FormaPagoVenta.CUENTA_CORRIENTE,
            total: 1000,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('rechaza cliente sin cuenta corriente habilitada', async () => {
      prisma.cliente.findFirst.mockResolvedValue({
        id: '000010',
        documento: '20123456789',
        condicionIva: CondicionIvaCliente.RESPONSABLE_INSCRIPTO,
        cuentaCorrienteHabilitada: false,
        habilitado: true,
        limiteCompraCuentaCorriente: 0,
      });

      await expect(
        servicio.registrar(
          {
            clienteId: '000010',
            nombreClienteMostrar: 'Cliente X',
            formaPago: FormaPagoVenta.CUENTA_CORRIENTE,
            total: 1000,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('rechaza venta cuando no hay stock suficiente', async () => {
      prisma.$transaction.mockImplementation(async (callback: (tx: unknown) => Promise<unknown>) =>
        callback(prisma),
      );
      stockService.validarStockBloqueadoParaVenta.mockResolvedValue([
        { varianteId: '000101', nombre: 'Remera M', solicitado: 1, disponible: 0 },
      ]);

      await expect(
        servicio.registrar(
          {
            clienteId: null,
            nombreClienteMostrar: 'Consumidor final',
            formaPago: FormaPagoVenta.EFECTIVO,
            total: 1000,
            lineas: [lineaValida],
            observaciones: '',
          },
          operador,
        ),
      ).rejects.toThrow(/Stock insuficiente/);
    });
  });
});
