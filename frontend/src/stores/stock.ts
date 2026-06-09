import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  ajusteConteoStockApi,
  entradaManualStockApi,
  importarConteoMasivoStockApi,
  listarAuditoriasStockApi,
  listarMovimientosStockApi,
  obtenerAuditoriaStockApi,
  obtenerResumenStockApi,
} from '../servicios/stock.servicio';
import type {
  AuditoriaStockDetalle,
  AuditoriaStockResumen,
  FaltaStockLinea,
  FiltrosAuditoriasStock,
  MovimientoStock,
} from '../tipos/stock';
import type { LineaVentaRegistro } from '../tipos/venta';
import {
  crearSincronizadorListaRemota,
  type OpcionesCargaLista,
} from '../utilidades/sincronizacionListaRemota';

const MAXIMO_MOVIMIENTOS_ENMEMORIA = 400;
const sincronizador = crearSincronizadorListaRemota();
const sincronizadorAuditorias = crearSincronizadorListaRemota();

export const useStockStore = defineStore('stock', () => {
  const cantidadesPorVarianteId = ref<Record<string, number>>({});
  const movimientos = ref<MovimientoStock[]>([]);
  const auditorias = ref<AuditoriaStockResumen[]>([]);
  const cargando = ref(false);
  const cargandoAuditorias = ref(false);
  let sincronizado = false;

  async function cargar(opciones?: OpcionesCargaLista): Promise<void> {
    if (sincronizado && !opciones?.forzar) return;

    await sincronizador.serializarCarga(async () => {
      if (sincronizado && !opciones?.forzar) return;

      const generacion = sincronizador.generacionAlIniciarCarga();
      cargando.value = true;
      try {
        const [resumen, movs] = await Promise.all([
          obtenerResumenStockApi(),
          listarMovimientosStockApi(),
        ]);
        if (sincronizador.esRespuestaObsoleta(generacion)) return;
        const mapa: Record<string, number> = {};
        for (const fila of resumen) {
          mapa[fila.varianteId] = fila.cantidadActual;
        }
        cantidadesPorVarianteId.value = mapa;
        movimientos.value = movs.slice(0, MAXIMO_MOVIMIENTOS_ENMEMORIA);
        sincronizado = true;
      } finally {
        if (!sincronizador.esRespuestaObsoleta(generacion)) {
          cargando.value = false;
        }
      }
    });
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  function cantidadActual(varianteId: string): number {
    const c = cantidadesPorVarianteId.value[varianteId];
    if (c === undefined) return 0;
    return c;
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

  async function aplicarAjustePorConteo(
    varianteId: string,
    _nombreVariante: string,
    cantidadFisicaContada: number,
    _ejecutadoPorUsuario: string,
    observacionOpcional?: string | null,
  ): Promise<{ anterior: number; nuevo: number; delta: number }> {
    let destino = Math.floor(Number(cantidadFisicaContada));
    if (!Number.isFinite(destino) || destino < 0) destino = 0;
    sincronizador.marcarMutacionLocal();
    const resultado = await ajusteConteoStockApi({
      varianteId,
      cantidadFisicaContada: destino,
      observacion: observacionOpcional?.trim() || undefined,
    });
    cantidadesPorVarianteId.value = {
      ...cantidadesPorVarianteId.value,
      [varianteId]: resultado.nuevo,
    };
    await recargarMovimientos();
    await cargarAuditorias();
    return resultado;
  }

  async function aplicarImportacionConteoMasivo(
    lineas: { varianteId: string; cantidadFisicaContada: number }[],
    observacion?: string,
  ): Promise<{
    lineasProcesadas: number;
    lineasSinCambio: number;
  }> {
    sincronizador.marcarMutacionLocal();
    const resultado = await importarConteoMasivoStockApi({ lineas, observacion });
    const siguiente = { ...cantidadesPorVarianteId.value };
    for (const fila of resultado.detalle) {
      siguiente[fila.varianteId] = fila.nuevo;
    }
    cantidadesPorVarianteId.value = siguiente;
    await recargarMovimientos();
    await cargarAuditorias();
    return {
      lineasProcesadas: resultado.lineasProcesadas,
      lineasSinCambio: resultado.lineasSinCambio,
    };
  }

  async function aplicarEntradaManual(
    varianteId: string,
    _nombreVariante: string,
    unidadesAgregadas: number,
    notaOpcional?: string,
  ): Promise<void> {
    const u = Math.floor(unidadesAgregadas);
    if (!Number.isFinite(u) || u <= 0) return;
    sincronizador.marcarMutacionLocal();
    const resultado = await entradaManualStockApi({
      varianteId,
      cantidad: u,
      nota: notaOpcional,
    });
    cantidadesPorVarianteId.value = {
      ...cantidadesPorVarianteId.value,
      [varianteId]: resultado.cantidadNueva,
    };
    await recargarMovimientos();
    await cargarAuditorias();
  }

  async function recargarMovimientos(): Promise<void> {
    const movs = await listarMovimientosStockApi();
    movimientos.value = movs.slice(0, MAXIMO_MOVIMIENTOS_ENMEMORIA);
  }

  async function cargarAuditorias(
    filtros?: FiltrosAuditoriasStock,
    opciones?: OpcionesCargaLista,
  ): Promise<void> {
    await sincronizadorAuditorias.serializarCarga(async () => {
      const generacion = sincronizadorAuditorias.generacionAlIniciarCarga();
      if (cargandoAuditorias.value && !opciones?.forzar) return;
      cargandoAuditorias.value = true;
      try {
        const lista = await listarAuditoriasStockApi(filtros);
        if (sincronizadorAuditorias.esRespuestaObsoleta(generacion)) return;
        auditorias.value = lista;
      } finally {
        if (!sincronizadorAuditorias.esRespuestaObsoleta(generacion)) {
          cargandoAuditorias.value = false;
        }
      }
    });
  }

  async function obtenerDetalleAuditoria(id: string): Promise<AuditoriaStockDetalle> {
    return obtenerAuditoriaStockApi(id);
  }

  function quitarVariante(varianteId: string): void {
    sincronizador.marcarMutacionLocal();
    const siguiente = { ...cantidadesPorVarianteId.value };
    delete siguiente[varianteId];
    cantidadesPorVarianteId.value = siguiente;
  }

  function quitarVariantes(idsVariantes: string[]): void {
    if (idsVariantes.length === 0) return;
    sincronizador.marcarMutacionLocal();
    const siguiente = { ...cantidadesPorVarianteId.value };
    for (const id of idsVariantes) delete siguiente[id];
    cantidadesPorVarianteId.value = siguiente;
  }

  return {
    cantidadesPorVarianteId,
    movimientos,
    auditorias,
    cargando,
    cargandoAuditorias,
    cargar,
    asegurarCargado,
    cantidadActual,
    validacionAntesDeVenta,
    aplicarAjustePorConteo,
    aplicarImportacionConteoMasivo,
    aplicarEntradaManual,
    recargarMovimientos,
    cargarAuditorias,
    obtenerDetalleAuditoria,
    quitarVariante,
    quitarVariantes,
  };
});
