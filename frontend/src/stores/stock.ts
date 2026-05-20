import { defineStore } from 'pinia';
import { ref } from 'vue';
import { crearSemillaCatalogo } from '../datos/semillaCatalogo';
import { cantidadInicialSemillaPorVarianteId } from '../datos/semillaStock';
import { crearSemillaVentas } from '../datos/semillaVentas';
import type { FaltaStockLinea, MovimientoStock } from '../tipos/stock';
import type { LineaVentaRegistro } from '../tipos/venta';

const MAXIMO_MOVIMIENTOS_ENMEMORIA = 400;

function armarCantidadesBaseDesdeSemilla(): Record<string, number> {
  const { variantes } = crearSemillaCatalogo();
  const mapa: Record<string, number> = {};
  for (const v of variantes) {
    mapa[v.id] = cantidadInicialSemillaPorVarianteId(v.id);
  }

  const ventasAsc = [...crearSemillaVentas()].sort(
    (a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime()
  );
  for (const v of ventasAsc) {
    for (const ln of v.lineas) {
      if (mapa[ln.varianteId] === undefined) continue;
      mapa[ln.varianteId] -= ln.cantidad;
    }
  }
  return mapa;
}

function nuevoUuid(): string {
  return crypto.randomUUID();
}

export const useStockStore = defineStore('stock', () => {
  /** Existencias físicas disponibles por id de variante. */
  const cantidadesPorVarianteId = ref<Record<string, number>>(armarCantidadesBaseDesdeSemilla());
  const movimientos = ref<MovimientoStock[]>([]);

  function cantidadActual(varianteId: string): number {
    const c = cantidadesPorVarianteId.value[varianteId];
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
      const disponible = cantidadActual(ln.varianteId);
      if (disponible < ln.cantidad) {
        faltas.push({
          varianteId: ln.varianteId,
          nombre: ln.nombre,
          solicitado: ln.cantidad,
          disponible,
        });
      }
    }
    return faltas.length > 0 ? faltas : null;
  }

  function aplicarSalidaPorVentaRegistrada(
    lineas: LineaVentaRegistro[],
    idVenta: string,
    numeroVenta: string
  ): void {
    const siguiente = { ...cantidadesPorVarianteId.value };
    for (const ln of lineas) {
      const anterior = siguiente[ln.varianteId] ?? 0;
      siguiente[ln.varianteId] = anterior - ln.cantidad;
      registrarMovimiento({
        varianteId: ln.varianteId,
        nombreVariante: ln.nombre,
        motivo: 'salidaPorVenta',
        cantidadVariacion: -ln.cantidad,
        stockResultante: siguiente[ln.varianteId],
        idVenta,
        numeroVenta,
        nota: null,
        ejecutadoPorUsuario: null,
      });
    }
    cantidadesPorVarianteId.value = siguiente;
  }

  function aplicarEntradaPorCompra(
    varianteId: string,
    nombreVariante: string,
    unidadesAgregadas: number,
    notaOpcional: string | undefined,
    ejecutadoPorUsuario: string
  ): void {
    const u = Math.floor(unidadesAgregadas);
    if (!Number.isFinite(u) || u <= 0) return;
    const anterior = cantidadesPorVarianteId.value[varianteId] ?? 0;
    const nuevo = anterior + u;
    cantidadesPorVarianteId.value = {
      ...cantidadesPorVarianteId.value,
      [varianteId]: nuevo,
    };
    registrarMovimiento({
      varianteId,
      nombreVariante,
      motivo: 'entradaPorCompra',
      cantidadVariacion: u,
      stockResultante: nuevo,
      nota: notaOpcional ?? null,
      ejecutadoPorUsuario,
    });
  }

  function aplicarAjustePorConteo(
    varianteId: string,
    nombreVariante: string,
    cantidadFisicaContada: number,
    ejecutadoPorUsuario: string,
    observacionOpcional?: string | null
  ): { anterior: number; nuevo: number; delta: number } {
    let destino = Math.floor(Number(cantidadFisicaContada));
    if (!Number.isFinite(destino) || destino < 0) destino = 0;
    const anterior = cantidadesPorVarianteId.value[varianteId] ?? 0;
    const delta = destino - anterior;
    cantidadesPorVarianteId.value = {
      ...cantidadesPorVarianteId.value,
      [varianteId]: destino,
    };
    registrarMovimiento({
      varianteId,
      nombreVariante,
      motivo: 'ajustePorConteo',
      cantidadVariacion: delta,
      stockResultante: destino,
      nota: observacionOpcional?.trim() || null,
      ejecutadoPorUsuario,
    });
    return { anterior, nuevo: destino, delta };
  }

  function inicializarExistenciaParaVariante(varianteId: string): void {
    if (cantidadesPorVarianteId.value[varianteId] !== undefined) return;
    cantidadesPorVarianteId.value = {
      ...cantidadesPorVarianteId.value,
      [varianteId]: 0,
    };
  }

  function quitarVariante(varianteId: string): void {
    const siguiente = { ...cantidadesPorVarianteId.value };
    delete siguiente[varianteId];
    cantidadesPorVarianteId.value = siguiente;
  }

  function quitarVariantes(idsVariantes: string[]): void {
    if (idsVariantes.length === 0) return;
    const siguiente = { ...cantidadesPorVarianteId.value };
    for (const id of idsVariantes) delete siguiente[id];
    cantidadesPorVarianteId.value = siguiente;
  }

  return {
    cantidadesPorVarianteId,
    movimientos,
    cantidadActual,
    validacionAntesDeVenta,
    aplicarSalidaPorVentaRegistrada,
    aplicarEntradaPorCompra,
    aplicarAjustePorConteo,
    inicializarExistenciaParaVariante,
    quitarVariante,
    quitarVariantes,
  };
});
