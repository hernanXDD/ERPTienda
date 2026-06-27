import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { etiquetaTalleCatalogo } from '../datos/tallesCatalogo';
import {
  actualizarTalleCatalogoApi,
  crearTalleCatalogoApi,
  eliminarTalleCatalogoApi,
  listarTallesCatalogoApi,
} from '../servicios/tallesCatalogo.servicio';
import type {
  DatosActualizarTalleCatalogo,
  DatosCrearTalleCatalogo,
  TalleCatalogo,
  TipoTalleCatalogo,
} from '../tipos/talleCatalogo';

function ordenarTalles(lista: TalleCatalogo[]): TalleCatalogo[] {
  return [...lista].sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
}

export const useTallesCatalogoStore = defineStore('tallesCatalogo', () => {
  const talles = ref<TalleCatalogo[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  const habilitados = computed(() => ordenarTalles(talles.value.filter((t) => t.habilitado)));

  const habilitadosPorTipo = computed(() => {
    const mapa = new Map<TipoTalleCatalogo, TalleCatalogo[]>();
    for (const talle of habilitados.value) {
      const lista = mapa.get(talle.tipo) ?? [];
      lista.push(talle);
      mapa.set(talle.tipo, lista);
    }
    return mapa;
  });

  function tallesHabilitadosTipo(tipo: TipoTalleCatalogo): TalleCatalogo[] {
    return habilitadosPorTipo.value.get(tipo) ?? [];
  }

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      talles.value = await listarTallesCatalogoApi();
      sincronizado = true;
    } finally {
      cargando.value = false;
    }
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  function etiqueta(codigo: string): string {
    return etiquetaTalleCatalogo(codigo, talles.value);
  }

  async function crear(datos: DatosCrearTalleCatalogo): Promise<TalleCatalogo> {
    const creado = await crearTalleCatalogoApi(datos);
    talles.value = ordenarTalles([...talles.value, creado]);
    return creado;
  }

  async function actualizar(id: string, datos: DatosActualizarTalleCatalogo): Promise<TalleCatalogo> {
    const actualizado = await actualizarTalleCatalogoApi(id, datos);
    talles.value = ordenarTalles(talles.value.map((t) => (t.id === id ? actualizado : t)));
    return actualizado;
  }

  async function eliminar(id: string): Promise<void> {
    await eliminarTalleCatalogoApi(id);
    talles.value = talles.value.filter((t) => t.id !== id);
  }

  return {
    talles,
    cargando,
    habilitados,
    habilitadosPorTipo,
    tallesHabilitadosTipo,
    cargar,
    asegurarCargado,
    etiqueta,
    crear,
    actualizar,
    eliminar,
  };
});
