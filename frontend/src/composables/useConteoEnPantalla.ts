import { computed, ref } from 'vue';
import { armarNombreLineaComercial } from '../modulos/catalogo/catalogoPresentacion';
import {
  codigoProductoParaConteo,
  type CambioConteoPrevisto,
} from '../modulos/inventario/plantillaConteoFisico';
import type { useCatalogoStore } from '../stores/catalogo';
import type { useStockStore } from '../stores/stock';
import type { Producto, Variante } from '../tipos/catalogo';

type CatalogoStore = ReturnType<typeof useCatalogoStore>;
type StockStore = ReturnType<typeof useStockStore>;

export interface FilaConteoEnPantalla {
  variante: Variante;
  producto: Producto;
  existencia: number;
}

export function useConteoEnPantalla(
  catalogoStore: CatalogoStore,
  stockStore: StockStore,
) {
  const activo = ref(false);
  const cantidadesContadas = ref<Record<string, number>>({});
  const textoEscaneo = ref('');
  const mensajeEscaneo = ref('');

  const cantidadPendientes = computed(() => Object.keys(cantidadesContadas.value).length);

  const cambiosPrevistos = computed((): CambioConteoPrevisto[] => {
    const lista: CambioConteoPrevisto[] = [];
    for (const [varianteId, cantidadNueva] of Object.entries(cantidadesContadas.value)) {
      const variante = catalogoStore.variantePorId(varianteId);
      const producto = variante ? catalogoStore.productoPorId(variante.productoId) : undefined;
      if (!variante || !producto) continue;

      const cantidadAnterior = stockStore.cantidadActual(varianteId);
      if (cantidadNueva === cantidadAnterior) continue;

      lista.push({
        varianteId,
        codigoProducto: codigoProductoParaConteo(variante),
        nombreProducto: armarNombreLineaComercial(producto, variante),
        cantidadAnterior,
        cantidadNueva,
        delta: cantidadNueva - cantidadAnterior,
      });
    }
    return lista.sort((a, b) => a.nombreProducto.localeCompare(b.nombreProducto, 'es'));
  });

  function activar(): void {
    activo.value = true;
    mensajeEscaneo.value = '';
  }

  function desactivar(): void {
    activo.value = false;
    cantidadesContadas.value = {};
    textoEscaneo.value = '';
    mensajeEscaneo.value = '';
  }

  function descartarSesion(): void {
    cantidadesContadas.value = {};
    textoEscaneo.value = '';
    mensajeEscaneo.value = '';
  }

  function registrarCantidadFila(fila: FilaConteoEnPantalla, cantidadTexto: string): string | null {
    const cantidadNueva = parsearCantidadFisica(cantidadTexto);
    if (cantidadNueva === null) {
      return 'Ingresá un número entero mayor o igual a cero.';
    }
    if (cantidadNueva === fila.existencia) {
      const siguiente = { ...cantidadesContadas.value };
      delete siguiente[fila.variante.id];
      cantidadesContadas.value = siguiente;
      return null;
    }
    cantidadesContadas.value = {
      ...cantidadesContadas.value,
      [fila.variante.id]: cantidadNueva,
    };
    return null;
  }

  function cantidadEnSesion(varianteId: string): number | null {
    return cantidadesContadas.value[varianteId] ?? null;
  }

  function buscarVariantePorCodigo(codigo: string): FilaConteoEnPantalla | null {
    const variante =
      catalogoStore.variantePorCodigoBarras(codigo) ??
      catalogoStore.variantePorId(codigo);
    if (!variante?.activa) return null;
    const producto = catalogoStore.productoPorId(variante.productoId);
    if (!producto) return null;
    return {
      variante,
      producto,
      existencia: stockStore.cantidadActual(variante.id),
    };
  }

  return {
    activo,
    cantidadesContadas,
    textoEscaneo,
    mensajeEscaneo,
    cantidadPendientes,
    cambiosPrevistos,
    activar,
    desactivar,
    descartarSesion,
    registrarCantidadFila,
    cantidadEnSesion,
    buscarVariantePorCodigo,
  };
}

export function parsearCantidadFisica(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.');
  if (!normalizado) return null;
  const numero = Number(normalizado);
  if (!Number.isFinite(numero) || numero < 0) return null;
  return Math.floor(numero);
}

/** Conteos con bajas de stock o varios ítems exigen observación en auditoría. */
export function requiereObservacionConteo(cambios: CambioConteoPrevisto[]): boolean {
  if (cambios.length >= 3) return true;
  return cambios.some((c) => c.delta < 0);
}
