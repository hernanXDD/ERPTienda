import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  listarDevolucionesApi,
  mapearDevolucionApi,
  registrarDevolucionApi,
} from '../servicios/devoluciones.servicio';
import { mensajeErrorDevolucion } from '../modulos/postventa/mensajesErrorPostventa';
import type { DatosRegistrarDevolucion, DevolucionRegistrada } from '../tipos/devolucion';

export const useDevolucionesStore = defineStore('devoluciones', () => {
  const devoluciones = ref<DevolucionRegistrada[]>([]);
  const cargando = ref(false);
  const registrando = ref(false);
  const errorDevolucion = ref<string | null>(null);

  async function cargar(opciones?: { forzar?: boolean }): Promise<void> {
    if (!opciones?.forzar && devoluciones.value.length > 0) return;
    cargando.value = true;
    errorDevolucion.value = null;
    try {
      const datos = await listarDevolucionesApi();
      devoluciones.value = datos.map(mapearDevolucionApi);
    } catch (error: unknown) {
      errorDevolucion.value = mensajeErrorDevolucion(error, 'cargar');
      throw error;
    } finally {
      cargando.value = false;
    }
  }

  async function registrar(datos: DatosRegistrarDevolucion): Promise<DevolucionRegistrada> {
    registrando.value = true;
    errorDevolucion.value = null;
    try {
      const respuesta = await registrarDevolucionApi(datos);
      const registrada = mapearDevolucionApi(respuesta);
      devoluciones.value = [registrada, ...devoluciones.value];
      return registrada;
    } catch (error: unknown) {
      const mensaje = mensajeErrorDevolucion(error, 'registrar');
      errorDevolucion.value = mensaje;
      throw error;
    } finally {
      registrando.value = false;
    }
  }

  return {
    devoluciones,
    cargando,
    registrando,
    errorDevolucion,
    cargar,
    registrar,
  };
});
