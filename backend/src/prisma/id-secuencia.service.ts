import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { obtenerSiguienteIdEntidad } from '../comunes/utilidades/id-entidad';
import { PrismaService } from './prisma.service';

type ClienteTransaccion = Prisma.TransactionClient;

@Injectable()
export class IdSecuenciaService {
  constructor(private readonly prisma: PrismaService) {}

  siguienteUsuario(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.usuario.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteCategoria(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.categoria.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteProducto(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.producto.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteVariante(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.variante.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  async siguientesMovimientoStock(cantidad: number, cliente: ClienteTransaccion = this.prisma) {
    const ultimo = await cliente.movimientoStock.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    let base = ultimo ? parseInt(ultimo.id, 10) : 0;
    const ids: string[] = [];
    for (let i = 0; i < cantidad; i += 1) {
      base += 1;
      ids.push(String(base).padStart(6, '0'));
    }
    return ids;
  }

  siguienteMovimientoStock(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.movimientoStock.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteCliente(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.cliente.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteMovimientoCuentaCorriente(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.movimientoCuentaCorriente.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteMovimientoCuentaCorrienteProveedor(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.movimientoCuentaCorrienteProveedor.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteProveedor(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.proveedor.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteCompra(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.compra.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteCompraLinea(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.compraLinea.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteVenta(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.venta.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteVentaLinea(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.ventaLinea.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteAuditoriaStock(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.auditoriaStock.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  /** Genera N IDs consecutivos (una sola consulta del último ID). */
  async siguientesCompraLinea(cantidad: number, cliente: ClienteTransaccion = this.prisma) {
    const ultimo = await cliente.compraLinea.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    let base = ultimo ? parseInt(ultimo.id, 10) : 0;
    const ids: string[] = [];
    for (let i = 0; i < cantidad; i += 1) {
      base += 1;
      ids.push(String(base).padStart(6, '0'));
    }
    return ids;
  }

  async siguientesVentaLinea(cantidad: number, cliente: ClienteTransaccion = this.prisma) {
    const ultimo = await cliente.ventaLinea.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    let base = ultimo ? parseInt(ultimo.id, 10) : 0;
    const ids: string[] = [];
    for (let i = 0; i < cantidad; i += 1) {
      base += 1;
      ids.push(String(base).padStart(6, '0'));
    }
    return ids;
  }

  siguienteDevolucion(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.devolucion.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  async siguientesDevolucionLinea(cantidad: number, cliente: ClienteTransaccion = this.prisma) {
    const ultimo = await cliente.devolucionLinea.findFirst({
      orderBy: { id: 'desc' },
      select: { id: true },
    });
    let base = ultimo ? parseInt(ultimo.id, 10) : 0;
    const ids: string[] = [];
    for (let i = 0; i < cantidad; i += 1) {
      base += 1;
      ids.push(String(base).padStart(6, '0'));
    }
    return ids;
  }

  siguienteFormaPago(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.formaPago.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteTalleCatalogo(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.talleCatalogo.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }

  siguienteCuponDescuento(cliente: ClienteTransaccion = this.prisma) {
    return obtenerSiguienteIdEntidad(async () => {
      const fila = await cliente.cuponDescuento.findFirst({
        orderBy: { id: 'desc' },
        select: { id: true },
      });
      return fila?.id ?? null;
    });
  }
}
