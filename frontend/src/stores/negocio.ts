import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { actualizarNegocioApi, obtenerNegocioApi } from '../servicios/negocio.servicio';
import type { DatosNegocioEditable, Negocio } from '../tipos/negocio';

export const useNegocioStore = defineStore('negocio', () => {
  const negocio = ref<Negocio | null>(null);
  const cargando = ref(false);
  let sincronizado = false;

  const nombreNegocio = computed(() => negocio.value?.nombre.trim() || 'ERP Tienda');

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      negocio.value = await obtenerNegocioApi();
      sincronizado = true;
    } finally {
      cargando.value = false;
    }
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  async function actualizar(datos: DatosNegocioEditable): Promise<Negocio> {
    const guardado = await actualizarNegocioApi(datos);
    negocio.value = guardado;
    sincronizado = true;
    return guardado;
  }

  return {
    negocio,
    cargando,
    nombreNegocio,
    cargar,
    asegurarCargado,
    actualizar,
  };
});
