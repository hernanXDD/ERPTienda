import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import {
  cerrarSesionEnServidor,
  establecerContrasenaInicial as establecerContrasenaInicialServicio,
  iniciarSesion as iniciarSesionServicio,
  obtenerSesionActual,
} from '../servicios/autenticacion.servicio';
import { CLAVE_TOKEN_ACCESO } from '../servicios/http';
import type { CambioContrasenaInicial, CredencialesInicioSesion, UsuarioSesion } from '../tipos/sesion';
import { reiniciarEstadoCargaDatos } from './inicializacionDatos';
import { useVentasStore } from './ventas';

export const useSesionStore = defineStore('sesion', () => {
  const usuario = ref<UsuarioSesion | null>(null);
  const inicializado = ref(false);

  /** `!= null` cubre `null` y `undefined` (`!== null` trataba `undefined` como sesión válida). */
  const estaAutenticado = computed(() => usuario.value != null);

  async function restaurarSesion() {
    const token = sessionStorage.getItem(CLAVE_TOKEN_ACCESO);
    if (!token) {
      inicializado.value = true;
      return;
    }
    try {
      const datos = await obtenerSesionActual();
      usuario.value = datos.usuario ?? null;
    } catch {
      sessionStorage.removeItem(CLAVE_TOKEN_ACCESO);
      usuario.value = null;
    } finally {
      inicializado.value = true;
    }
  }

  async function iniciarSesion(credenciales: CredencialesInicioSesion) {
    const datos = await iniciarSesionServicio(credenciales);
    sessionStorage.setItem(CLAVE_TOKEN_ACCESO, datos.accessToken);
    usuario.value = datos.usuario ?? null;
  }

  async function establecerContrasenaInicial(credenciales: CambioContrasenaInicial) {
    const datos = await establecerContrasenaInicialServicio(credenciales);
    usuario.value = datos.usuario ?? null;
  }

  async function cerrarSesion() {
    try {
      await cerrarSesionEnServidor();
    } catch {
      /* intencional: cierre local aunque falle la red */
    }
    sessionStorage.removeItem(CLAVE_TOKEN_ACCESO);
    usuario.value = null;
    useVentasStore().reiniciar();
    reiniciarEstadoCargaDatos();
  }

  return {
    usuario,
    inicializado,
    estaAutenticado,
    restaurarSesion,
    iniciarSesion,
    establecerContrasenaInicial,
    cerrarSesion,
  };
});
