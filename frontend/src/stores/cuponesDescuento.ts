import { defineStore } from 'pinia';
import { ref } from 'vue';
import {
  anularCuponDescuentoApi,
  crearCuponDescuentoApi,
  listarCuponesDescuentoApi,
  mapearCuponDescuentoApi,
  mapearCuponDescuentoCreadoApi,
  obtenerCodigoBarrasCuponApi,
} from '../servicios/cuponesDescuento.servicio';
import { mensajeErrorCupon } from '../modulos/postventa/mensajesErrorPostventa';
import type { CuponDescuentoCreado, CuponDescuentoRegistrado, DatosCrearCuponDescuento } from '../tipos/cuponDescuento';

export const useCuponesDescuentoStore = defineStore('cuponesDescuento', () => {
  const cupones = ref<CuponDescuentoRegistrado[]>([]);
  const cargando = ref(false);
  const creando = ref(false);
  const anulando = ref(false);
  const errorCupon = ref<string | null>(null);
  let ultimaCarga = 0;

  async function cargar(opciones?: { forzar?: boolean }): Promise<void> {
    if (cargando.value) return;
    if (!opciones?.forzar && cupones.value.length > 0 && Date.now() - ultimaCarga < 30_000) {
      return;
    }

    cargando.value = true;
    errorCupon.value = null;
    try {
      const datos = await listarCuponesDescuentoApi();
      cupones.value = datos.map(mapearCuponDescuentoApi);
      ultimaCarga = Date.now();
    } catch (error: unknown) {
      errorCupon.value = mensajeErrorCupon(error, 'cargar');
    } finally {
      cargando.value = false;
    }
  }

  async function crear(datos: DatosCrearCuponDescuento): Promise<CuponDescuentoCreado> {
    creando.value = true;
    errorCupon.value = null;
    try {
      const respuesta = await crearCuponDescuentoApi(datos);
      const cupon = mapearCuponDescuentoCreadoApi(respuesta);
      cupones.value = [cupon, ...cupones.value.filter((c) => c.id !== cupon.id)];
      return cupon;
    } catch (error: unknown) {
      errorCupon.value = mensajeErrorCupon(error, 'crear');
      throw error;
    } finally {
      creando.value = false;
    }
  }

  async function obtenerCodigoBarras(id: string): Promise<string> {
    try {
      return await obtenerCodigoBarrasCuponApi(id);
    } catch (error: unknown) {
      errorCupon.value = mensajeErrorCupon(error, 'codigo');
      throw error;
    }
  }

  async function anular(id: string, motivo?: string): Promise<CuponDescuentoRegistrado> {
    anulando.value = true;
    errorCupon.value = null;
    try {
      const respuesta = await anularCuponDescuentoApi(id, motivo);
      const cupon = mapearCuponDescuentoApi(respuesta);
      cupones.value = cupones.value.map((c) => (c.id === cupon.id ? cupon : c));
      return cupon;
    } catch (error: unknown) {
      errorCupon.value = mensajeErrorCupon(error, 'anular');
      throw error;
    } finally {
      anulando.value = false;
    }
  }

  return {
    cupones,
    cargando,
    creando,
    anulando,
    errorCupon,
    cargar,
    crear,
    anular,
    obtenerCodigoBarras,
  };
});
