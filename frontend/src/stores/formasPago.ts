import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import { etiquetaFormaPago, opcionesFormaPagoSelector } from '../datos/formasPago';
import {
  actualizarFormaPagoApi,
  crearFormaPagoApi,
  eliminarFormaPagoApi,
  listarFormasPagoApi,
} from '../servicios/formasPago.servicio';
import type {
  DatosActualizarFormaPago,
  DatosCrearFormaPago,
  FormaPago,
} from '../tipos/formaPago';

export const useFormasPagoStore = defineStore('formasPago', () => {
  const formas = ref<FormaPago[]>([]);
  const cargando = ref(false);
  let sincronizado = false;

  const habilitadas = computed(() =>
    [...formas.value]
      .filter((f) => f.habilitado)
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es')),
  );

  const opcionesSelector = computed(() => opcionesFormaPagoSelector(formas.value));

  const mapaFacturarPorCodigo = computed(
    () => new Map(formas.value.map((f) => [f.codigo, f.facturar])),
  );

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      formas.value = await listarFormasPagoApi();
      sincronizado = true;
    } finally {
      cargando.value = false;
    }
  }

  async function asegurarCargado(): Promise<void> {
    if (!sincronizado) await cargar();
  }

  function etiqueta(codigo: string): string {
    return etiquetaFormaPago(codigo, formas.value);
  }

  function ventaIncluyeEnReporteFacturacion(codigoFormaPago: string): boolean {
    const flag = mapaFacturarPorCodigo.value.get(codigoFormaPago);
    if (flag === undefined) return true;
    return flag;
  }

  async function crear(datos: DatosCrearFormaPago): Promise<FormaPago> {
    const creada = await crearFormaPagoApi(datos);
    formas.value = [...formas.value, creada].sort(
      (a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'),
    );
    return creada;
  }

  async function actualizar(id: string, datos: DatosActualizarFormaPago): Promise<FormaPago> {
    const actualizada = await actualizarFormaPagoApi(id, datos);
    formas.value = formas.value
      .map((f) => (f.id === id ? actualizada : f))
      .sort((a, b) => a.orden - b.orden || a.nombre.localeCompare(b.nombre, 'es'));
    return actualizada;
  }

  async function eliminar(id: string): Promise<void> {
    await eliminarFormaPagoApi(id);
    formas.value = formas.value.filter((f) => f.id !== id);
  }

  return {
    formas,
    cargando,
    habilitadas,
    opcionesSelector,
    mapaFacturarPorCodigo,
    cargar,
    asegurarCargado,
    etiqueta,
    ventaIncluyeEnReporteFacturacion,
    crear,
    actualizar,
    eliminar,
  };
});
