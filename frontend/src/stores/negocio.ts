import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  actualizarNegocioApi,
  eliminarLogoNegocioApi,
  obtenerLogoNegocioApi,
  obtenerNegocioApi,
  subirLogoNegocioApi,
} from '../servicios/negocio.servicio';
import type { DatosNegocioEditable, Negocio } from '../tipos/negocio';

export const useNegocioStore = defineStore('negocio', () => {
  const negocio = ref<Negocio | null>(null);
  const logoDataUrl = ref<string | null>(null);
  const cargando = ref(false);
  let sincronizado = false;
  let logoVersionEnCache: number | null = null;
  let promesaLogoDataUrl: Promise<void> | null = null;

  function invalidarLogoDataUrl(): void {
    logoDataUrl.value = null;
    logoVersionEnCache = null;
  }

  async function cargarLogoDataUrl(): Promise<void> {
    const actual = negocio.value;
    if (!actual?.tieneLogo) {
      logoDataUrl.value = null;
      logoVersionEnCache = actual?.logoVersion ?? null;
      return;
    }
    if (logoDataUrl.value && logoVersionEnCache === actual.logoVersion) return;

    try {
      const blob = await obtenerLogoNegocioApi();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(String(lector.result ?? ''));
        lector.onerror = () => reject(lector.error ?? new Error('No se pudo leer el logo'));
        lector.readAsDataURL(blob);
      });
      logoDataUrl.value = dataUrl.startsWith('data:') ? dataUrl : null;
      logoVersionEnCache = actual.logoVersion;
    } catch {
      logoDataUrl.value = null;
      logoVersionEnCache = actual.logoVersion;
    }
  }

  async function asegurarLogoDataUrl(): Promise<void> {
    await asegurarCargado();
    if (!negocio.value?.tieneLogo) {
      logoDataUrl.value = null;
      return;
    }
    if (logoDataUrl.value && logoVersionEnCache === negocio.value.logoVersion) return;
    if (!promesaLogoDataUrl) {
      promesaLogoDataUrl = cargarLogoDataUrl().finally(() => {
        promesaLogoDataUrl = null;
      });
    }
    await promesaLogoDataUrl;
  }

  const nombreNegocio = computed(() => negocio.value?.nombre.trim() || 'ERP Tienda');

  async function cargar(): Promise<void> {
    if (cargando.value) return;
    cargando.value = true;
    try {
      negocio.value = await obtenerNegocioApi();
      sincronizado = true;
      invalidarLogoDataUrl();
      void cargarLogoDataUrl();
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

  async function subirLogo(archivo: File): Promise<Negocio> {
    const guardado = await subirLogoNegocioApi(archivo);
    negocio.value = guardado;
    sincronizado = true;
    invalidarLogoDataUrl();
    void cargarLogoDataUrl();
    return guardado;
  }

  async function eliminarLogo(): Promise<Negocio> {
    const guardado = await eliminarLogoNegocioApi();
    negocio.value = guardado;
    sincronizado = true;
    invalidarLogoDataUrl();
    return guardado;
  }

  return {
    negocio,
    logoDataUrl,
    cargando,
    nombreNegocio,
    cargar,
    asegurarCargado,
    asegurarLogoDataUrl,
    actualizar,
    subirLogo,
    eliminarLogo,
  };
});
