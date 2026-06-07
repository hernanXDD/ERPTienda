<script setup lang="ts">
import { AxiosError } from 'axios';
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSesionStore } from '../../stores/sesion';

const router = useRouter();
const route = useRoute();
const sesion = useSesionStore();

const nombreUsuario = ref('admin');
const contrasena = ref('Ophhre43u');
const cargando = ref(false);
const mensajeError = ref('');

function extraerMensajeError(error: unknown): string {
  if (error instanceof AxiosError && error.response?.data && typeof error.response.data === 'object') {
    const datos = error.response.data as { mensaje?: string };
    if (typeof datos.mensaje === 'string') return datos.mensaje;
  }
  return 'No se pudo iniciar sesión. Intente nuevamente.';
}

async function enviar() {
  mensajeError.value = '';
  cargando.value = true;
  try {
    await sesion.iniciarSesion({
      nombreUsuario: nombreUsuario.value.trim(),
      contrasena: contrasena.value,
    });
    const candidato =
      typeof route.query.siguiente === 'string' && route.query.siguiente.startsWith('/')
        ? route.query.siguiente
        : '/inicio';
    const destino =
      candidato.startsWith('/') && !candidato.startsWith('//') ? candidato : '/inicio';
    await router.replace(destino);
  } catch (error) {
    mensajeError.value = extraerMensajeError(error);
  } finally {
    cargando.value = false;
  }
}
</script>

<template>
  <div class="pagina">
    <main class="panel" aria-labelledby="titulo-login">
      <h1 id="titulo-login" class="titulo">Iniciar sesión</h1>
      <p class="descripcion">ERP tienda — inicio de sesión contra la API.</p>

      <form class="formulario" @submit.prevent="enviar">
        <div class="campo">
          <label for="campo-usuario" class="etiqueta">Usuario</label>
          <input
            id="campo-usuario"
            v-model="nombreUsuario"
            type="text"
            name="usuario"
            class="entrada"
            autocomplete="username"
            required
            :disabled="cargando"
          />
        </div>
        <div class="campo">
          <label for="campo-contrasena" class="etiqueta">Contraseña</label>
          <input
            id="campo-contrasena"
            v-model="contrasena"
            type="password"
            name="contrasena"
            class="entrada"
            autocomplete="current-password"
            required
            :disabled="cargando"
          />
        </div>

        <p v-if="mensajeError" class="error" role="alert">{{ mensajeError }}</p>

        <button type="submit" class="boton-principal" :disabled="cargando">
          {{ cargando ? 'Ingresando…' : 'Ingresar' }}
        </button>
      </form>

      <p class="ayuda">
        Credenciales del servidor (base de datos). Ejemplo: <code>admin</code> /
        <code>Ophhre43u</code>.
      </p>
    </main>
  </div>
</template>

<style scoped>
.pagina {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1.25rem;
  background: radial-gradient(120% 80% at 50% -10%, var(--color-acento-suave), transparent 55%),
    var(--color-fondo);
}

.panel {
  width: 100%;
  max-width: 22rem;
  padding: 1.75rem 1.5rem;
  background: var(--color-fondo-elevado);
  border: 1px solid var(--color-borde);
  border-radius: 12px;
  box-shadow: var(--sombra-suave);
}

.titulo {
  margin: 0 0 0.35rem;
  font-size: 1.35rem;
  font-weight: 600;
}

.descripcion {
  margin: 0 0 1.25rem;
  color: var(--color-texto-apagado);
  font-size: 0.9rem;
  line-height: 1.45;
}

.formulario {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.etiqueta {
  font-size: 0.85rem;
  color: var(--color-texto-suave);
}

.entrada {
  border: 1px solid var(--color-borde);
  border-radius: var(--radio-control);
  padding: 0.55rem 0.65rem;
  background: var(--color-fondo-cabecera);
  color: var(--color-texto);
}

.entrada:disabled {
  opacity: 0.65;
}

.error {
  margin: 0;
  color: var(--color-peligro);
  font-size: 0.875rem;
}

.boton-principal {
  border: none;
  border-radius: var(--radio-control);
  padding: 0.65rem 1rem;
  background: linear-gradient(180deg, var(--color-acento) 0%, var(--color-acento-intenso) 100%);
  color: var(--color-texto-sobre-acento);
  font-weight: 600;
}

.boton-principal:hover:not(:disabled) {
  background: linear-gradient(180deg, var(--color-acento-hover) 0%, var(--color-acento) 100%);
}

.boton-principal:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.ayuda {
  margin: 1.15rem 0 0;
  font-size: 0.78rem;
  color: var(--color-texto-apagado);
  line-height: 1.45;
}

.ayuda code {
  font-size: 0.85em;
  background: var(--color-fondo-cabecera);
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
}
</style>
