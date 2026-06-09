<script setup lang="ts">
import { AxiosError } from 'axios';
import { Eye, EyeOff, Lock, Sparkles } from 'lucide-vue-next';
import { nextTick, ref, useTemplateRef, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSesionStore } from '../../stores/sesion';
import {
  AYUDA_POLITICA_CONTRASENA,
  validarPoliticaContrasena,
} from '../../utilidades/politicaContrasena';

const props = defineProps<{
  visible: boolean;
}>();

const sesion = useSesionStore();
const router = useRouter();
const refDialog = useTemplateRef<HTMLDialogElement>('refDialog');

const contrasenaNueva = ref('');
const contrasenaRepetida = ref('');
const mostrarContrasena = ref(false);
const mostrarRepetida = ref(false);
const cargando = ref(false);
const mensajeError = ref('');
/** Evita desloguear cuando el cierre del diálogo es tras un cambio exitoso. */
let cierreAutorizado = false;
let cerrandoPorRechazo = false;

async function rechazarCambioObligatorio(): Promise<void> {
  if (cargando.value || cerrandoPorRechazo) return;
  cerrandoPorRechazo = true;
  try {
    await sesion.cerrarSesion();
    await router.push({ name: 'inicio-sesion' });
  } finally {
    cerrandoPorRechazo = false;
  }
}

function alCancelarModal(event: Event): void {
  event.preventDefault();
  void rechazarCambioObligatorio();
}

function alCerrarDialog(): void {
  if (cierreAutorizado || !props.visible) return;
  void rechazarCambioObligatorio();
}

watch(
  () => props.visible,
  async (visible) => {
    await nextTick();
    if (visible) {
      cierreAutorizado = false;
      contrasenaNueva.value = '';
      contrasenaRepetida.value = '';
      mensajeError.value = '';
      refDialog.value?.showModal();
    } else {
      cierreAutorizado = true;
      refDialog.value?.close();
      cierreAutorizado = false;
    }
  },
  { immediate: true },
);

function extraerMensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data && typeof error.response.data === 'object') {
    const datos = error.response.data as { mensaje?: string };
    if (typeof datos.mensaje === 'string') return datos.mensaje;
  }
  return 'No se pudo actualizar la contraseña. Intente nuevamente.';
}

function validarLocal(): string | null {
  const errorPolitica = validarPoliticaContrasena(contrasenaNueva.value);
  if (errorPolitica) return errorPolitica;
  if (contrasenaNueva.value !== contrasenaRepetida.value) {
    return 'Las contraseñas no coinciden.';
  }
  return null;
}

async function enviar() {
  mensajeError.value = '';
  const errorLocal = validarLocal();
  if (errorLocal) {
    mensajeError.value = errorLocal;
    return;
  }

  cargando.value = true;
  try {
    cierreAutorizado = true;
    await sesion.establecerContrasenaInicial({
      contrasenaNueva: contrasenaNueva.value,
      contrasenaNuevaRepetida: contrasenaRepetida.value,
    });
  } catch (error) {
    cierreAutorizado = false;
    mensajeError.value = extraerMensajeError(error);
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <dialog
    ref="refDialog"
    class="modal-bienvenida"
    aria-labelledby="modal-bienvenida-titulo"
    aria-describedby="modal-bienvenida-desc"
    @cancel="alCancelarModal"
    @close="alCerrarDialog"
  >
    <div class="modal-panel">
      <div class="modal-encabezado">
        <span class="modal-icono" aria-hidden="true">
          <Sparkles :size="22" stroke-width="2" />
        </span>
        <h2 id="modal-bienvenida-titulo" class="modal-titulo">¡Bienvenido a ERP Tienda!</h2>
        <p id="modal-bienvenida-desc" class="modal-descripcion">
          Es tu primer ingreso al sistema. Por seguridad, definí una contraseña personal antes de
          continuar. {{ AYUDA_POLITICA_CONTRASENA }} Si cancelás (Escape), se cerrará la sesión.
        </p>
      </div>

      <form class="formulario" @submit.prevent="enviar">
        <div class="campo">
          <label for="campo-contrasena-nueva" class="etiqueta">Nueva contraseña</label>
          <div class="entrada-envoltorio">
            <Lock class="entrada-icono" aria-hidden="true" />
            <input
              id="campo-contrasena-nueva"
              v-model="contrasenaNueva"
              :type="mostrarContrasena ? 'text' : 'password'"
              class="entrada entrada-con-accion"
              autocomplete="new-password"
              placeholder="Ej. MiTienda2026"
              required
              minlength="8"
              :disabled="cargando"
            />
            <button
              type="button"
              class="boton-visibilidad"
              :aria-label="mostrarContrasena ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              :disabled="cargando"
              @click="mostrarContrasena = !mostrarContrasena"
            >
              <EyeOff v-if="mostrarContrasena" class="icono-visibilidad" aria-hidden="true" />
              <Eye v-else class="icono-visibilidad" aria-hidden="true" />
            </button>
          </div>
        </div>

        <div class="campo">
          <label for="campo-contrasena-repetida" class="etiqueta">Repetir contraseña</label>
          <div class="entrada-envoltorio">
            <Lock class="entrada-icono" aria-hidden="true" />
            <input
              id="campo-contrasena-repetida"
              v-model="contrasenaRepetida"
              :type="mostrarRepetida ? 'text' : 'password'"
              class="entrada entrada-con-accion"
              autocomplete="new-password"
              placeholder="Volvé a escribir la contraseña"
              required
              minlength="8"
              :disabled="cargando"
            />
            <button
              type="button"
              class="boton-visibilidad"
              :aria-label="mostrarRepetida ? 'Ocultar repetición' : 'Mostrar repetición'"
              :disabled="cargando"
              @click="mostrarRepetida = !mostrarRepetida"
            >
              <EyeOff v-if="mostrarRepetida" class="icono-visibilidad" aria-hidden="true" />
              <Eye v-else class="icono-visibilidad" aria-hidden="true" />
            </button>
          </div>
        </div>

        <p class="modal-ayuda-politica">{{ AYUDA_POLITICA_CONTRASENA }}</p>

        <p v-if="mensajeError" class="error" role="alert">{{ mensajeError }}</p>

        <button type="submit" class="boton-principal" :disabled="cargando">
          {{ cargando ? 'Guardando…' : 'Guardar contraseña y continuar' }}
        </button>
      </form>
    </div>
  </dialog>
</template>

<style scoped>
.modal-bienvenida {
  margin: auto;
  padding: 0;
  border: none;
  max-width: min(26rem, calc(100vw - 2rem));
  background: transparent;
}

.modal-bienvenida::backdrop {
  background: rgba(7, 11, 20, 0.82);
  backdrop-filter: blur(4px);
}

.modal-panel {
  padding: 1.75rem 1.75rem 2rem;
  background: var(--color-fondo-elevado);
  border: 1px solid var(--color-borde);
  border-radius: 16px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.45);
}

.modal-encabezado {
  margin-bottom: 1.5rem;
  text-align: center;
}

.modal-icono {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  margin-bottom: 0.85rem;
  border-radius: 12px;
  background: var(--color-acento-suave);
  color: var(--color-acento-hover);
}

.modal-titulo {
  margin: 0 0 0.5rem;
  font-size: 1.35rem;
  font-weight: 600;
  letter-spacing: -0.01em;
}

.modal-descripcion {
  margin: 0;
  font-size: 0.92rem;
  line-height: 1.5;
  color: var(--color-texto-apagado);
}

.modal-ayuda-politica {
  margin: -0.35rem 0 0;
  font-size: 0.78rem;
  line-height: 1.45;
  color: var(--color-texto-apagado);
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}

.etiqueta {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-texto-suave);
}

.entrada-envoltorio {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  min-height: 3rem;
  padding: 0 0.85rem;
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  background: var(--color-fondo-cabecera);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    background-color 0.15s ease;
}

.entrada-envoltorio:focus-within {
  border-color: var(--color-acento-borde);
  box-shadow: 0 0 0 3px var(--color-acento-suave);
  background: var(--color-fondo-elevado);
}

.entrada-icono {
  flex-shrink: 0;
  width: 1.1rem;
  height: 1.1rem;
  color: var(--color-texto-apagado);
}

.entrada-envoltorio:focus-within .entrada-icono {
  color: var(--color-acento);
}

.entrada {
  flex: 1;
  min-width: 0;
  border: none;
  padding: 0.65rem 0;
  background: transparent;
  color: var(--color-texto);
  font-size: 0.95rem;
}

.entrada:focus {
  outline: none;
}

.entrada::placeholder {
  color: var(--color-texto-apagado);
}

.entrada-con-accion {
  padding-right: 0.25rem;
}

.boton-visibilidad {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 2rem;
  height: 2rem;
  padding: 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: var(--color-texto-apagado);
}

.boton-visibilidad:hover:not(:disabled) {
  color: var(--color-texto-suave);
  background: rgba(124, 140, 240, 0.08);
}

.icono-visibilidad {
  width: 1.05rem;
  height: 1.05rem;
}

.error {
  margin: 0;
  padding: 0.65rem 0.75rem;
  border-radius: 10px;
  background: rgba(251, 113, 133, 0.1);
  border: 1px solid rgba(251, 113, 133, 0.35);
  color: var(--color-peligro);
  font-size: 0.875rem;
}

.boton-principal {
  margin-top: 0.25rem;
  min-height: 3rem;
  border: none;
  border-radius: 12px;
  padding: 0.75rem 1rem;
  background: linear-gradient(180deg, var(--color-acento) 0%, var(--color-acento-intenso) 100%);
  color: var(--color-texto-sobre-acento);
  font-size: 0.95rem;
  font-weight: 600;
}

.boton-principal:hover:not(:disabled) {
  background: linear-gradient(180deg, var(--color-acento-hover) 0%, var(--color-acento) 100%);
}

.boton-principal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
