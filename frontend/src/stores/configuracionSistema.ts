import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { parametrosSistemaResueltos } from '../modulos/configuracion/normalizarConfiguracionSistema';
import {
  actualizarConfiguracionSistemaApi,
  obtenerConfiguracionSistemaApi,
} from '../servicios/configuracionSistema.servicio';
import type {
  ConfiguracionSistemaEditable,
  ConfiguracionSistemaRegistro,
  DatosConfiguracionSistemaEditable,
} from '../tipos/configuracionSistema';

export const useConfiguracionSistemaStore = defineStore('configuracionSistema', () => {
  const configuracion = ref<ConfiguracionSistemaRegistro | null>(null);
  const cargando = ref(false);
  let sincronizado = false;

  const parametros = computed(() => parametrosSistemaResueltos(configuracion.value));

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      configuracion.value = await obtenerConfiguracionSistemaApi();
      sincronizado = true;
    } finally {
      cargando.value = false;
    }
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  async function actualizar(
    datos: DatosConfiguracionSistemaEditable,
  ): Promise<ConfiguracionSistemaRegistro> {
    const guardado = await actualizarConfiguracionSistemaApi(datos);
    configuracion.value = guardado;
    sincronizado = true;
    return guardado;
  }

  function aplicarAlBorrador(): ConfiguracionSistemaEditable {
    return { ...parametros.value };
  }

  return {
    configuracion,
    cargando,
    parametros,
    cargar,
    asegurarCargado,
    actualizar,
    aplicarAlBorrador,
  };
});
