import { defineStore } from 'pinia';
import { ref } from 'vue';
import { crearSemillaCatalogo } from '../datos/semillaCatalogo';
import { cantidadInicialSemillaPorProductoId } from '../datos/semillaStock';
import { crearSemillaVentas } from '../datos/semillaVentas';
import type { FaltaStockLinea, MovimientoStock } from '../tipos/stock';
import type { LineaVentaRegistro } from '../tipos/venta';

const MAXIMO_MOVIMIENTOS_ENMEMORIA = 400;

function armarCantidadesBaseDesdeSemilla(): Record<string, number> {
  const { productos } = crearSemillaCatalogo();
  const mapa: Record<string, number> = {};
  for (const p of productos) mapa[p.id] = cantidadInicialSemillaPorProductoId(p.id);

  const ventasAsc = [...crearSemillaVentas()].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  for (const v of ventasAsc) {
    for (const ln of v.lineas) {
      if (mapa[ln.productoId] === undefined) continue;
      mapa[ln.productoId] -= ln.cantidad;
    }
  }
  return mapa;
}

function nuevoUuid(): string {
  return crypto.randomUUID();
}

export const useStockStore = defineStore('stock', () => {
  /** Existencias físicas disponibles por id de producto (no incluye borradores ni reserva). */
  const cantidadesPorProductoId = ref<Record<string, number>>(armarCantidadesBaseDesdeSemilla());
  const movimientos = ref<MovimientoStock[]>([]);

  function cantidadActual(productoId: string): number {
    const c = cantidadesPorProductoId.value[productoId];
    if (c === undefined) return 0;
    return c;
  }

  function registrarMovimiento(ent: Omit<MovimientoStock, 'id' | 'fecha'>): void {
    const fila: MovimientoStock = {
      ...ent,
      id: nuevoUuid(),
      fecha: new Date().toISOString(),
    };
    movimientos.value = [fila, ...movimientos.value].slice(0, MAXIMO_MOVIMIENTOS_ENMEMORIA);
  }

  function validacionAntesDeVenta(lineas: LineaVentaRegistro[]): FaltaStockLinea[] | null {
    const faltas: FaltaStockLinea[] = [];
    for (const ln of lineas) {
      const disponible = cantidadActual(ln.productoId);
      if (disponible < ln.cantidad) {
        faltas.push({
          productoId: ln.productoId,
          nombre: ln.nombre,
          solicitado: ln.cantidad,
          disponible,
        });
      }
    }
    return faltas.length > 0 ? faltas : null;
  }

  /**
   * Se llama después de persistir la venta; descuenta existencias por cada línea.
   */
  function aplicarSalidaPorVentaRegistrada(
    lineas: LineaVentaRegistro[],
    idVenta: string,
    numeroVenta: string
  ): void {
    const siguiente = { ...cantidadesPorProductoId.value };
    for (const ln of lineas) {
      const anterior = siguiente[ln.productoId] ?? 0;
      siguiente[ln.productoId] = anterior - ln.cantidad;
      registrarMovimiento({
        productoId: ln.productoId,
        nombreProducto: ln.nombre,
        motivo: 'salidaPorVenta',
        cantidadVariacion: -ln.cantidad,
        stockResultante: siguiente[ln.productoId],
        idVenta,
        numeroVenta,
        nota: null,
        ejecutadoPorUsuario: null,
      });
    }
    cantidadesPorProductoId.value = siguiente;
  }

  /**
   * Entrada cuando exista el módulo de compras; también usable para alta manual controlada por permisos.
   */
  function aplicarEntradaPorCompra(
    productoId: string,
    nombreProducto: string,
    unidadesAgregadas: number,
    notaOpcional: string | undefined,
    ejecutadoPorUsuario: string
  ): void {
    const u = Math.floor(unidadesAgregadas);
    if (!Number.isFinite(u) || u <= 0) return;
    const anterior = cantidadesPorProductoId.value[productoId] ?? 0;
    const nuevo = anterior + u;
    const siguiente = { ...cantidadesPorProductoId.value, [productoId]: nuevo };
    cantidadesPorProductoId.value = siguiente;
    registrarMovimiento({
      productoId,
      nombreProducto,
      motivo: 'entradaPorCompra',
      cantidadVariacion: u,
      stockResultante: nuevo,
      nota: notaOpcional ?? null,
      ejecutadoPorUsuario,
    });
  }

  /** Concierto físico: fija cantidad observada en depósito o local. */
  function aplicarAjustePorConteo(
    productoId: string,
    nombreProducto: string,
    cantidadFisicaContada: number,
    ejecutadoPorUsuario: string,
    observacionOpcional?: string | null
  ): { anterior: number; nuevo: number; delta: number } {
    let destino = Math.floor(Number(cantidadFisicaContada));
    if (!Number.isFinite(destino) || destino < 0) destino = 0;
    const anterior = cantidadesPorProductoId.value[productoId] ?? 0;
    const delta = destino - anterior;
    cantidadesPorProductoId.value = {
      ...cantidadesPorProductoId.value,
      [productoId]: destino,
    };
    registrarMovimiento({
      productoId,
      nombreProducto,
      motivo: 'ajustePorConteo',
      cantidadVariacion: delta,
      stockResultante: destino,
      nota: observacionOpcional?.trim() || null,
      ejecutadoPorUsuario,
    });
    return { anterior, nuevo: destino, delta };
  }

  /** Nuevo ítem del catálogo empieza con existencia cero (se actualiza por compras o conteo). */
  function inicializarExistenciaParaProducto(productoId: string): void {
    if (cantidadesPorProductoId.value[productoId] !== undefined) return;
    cantidadesPorProductoId.value = { ...cantidadesPorProductoId.value, [productoId]: 0 };
  }

  function quitarProducto(productoId: string): void {
    const siguiente = { ...cantidadesPorProductoId.value };
    delete siguiente[productoId];
    cantidadesPorProductoId.value = siguiente;
  }

  return {
    cantidadesPorProductoId,
    movimientos,
    cantidadActual,
    validacionAntesDeVenta,
    aplicarSalidaPorVentaRegistrada,
    aplicarEntradaPorCompra,
    aplicarAjustePorConteo,
    inicializarExistenciaParaProducto,
    quitarProducto,
  };
});
