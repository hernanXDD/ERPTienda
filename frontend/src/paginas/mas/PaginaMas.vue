<script setup lang="ts">
import { useSesionStore } from '../../stores/sesion';

const sesion = useSesionStore();
</script>

<template>
  <section class="envoltorio" aria-labelledby="titulo-mas">
    <h1 id="titulo-mas" class="titulo">Más</h1>
    <p class="texto">
      Sesión: <strong>{{ sesion.usuario?.nombreUsuario }}</strong> · Rol
      <strong>{{ sesion.usuario?.rol }}</strong>
    </p>
    <ul class="lista">
      <li>Configuración del negocio (próximamente)</li>
      <li>Usuarios y permisos: menú inferior <strong>Usuarios</strong></li>
      <li>Ayuda (próximamente)</li>
    </ul>
  </section>
</template>

<style scoped>
.envoltorio {
  max-width: 36rem;
}

.titulo {
  margin: 0 0 0.75rem;
  font-size: 1.35rem;
  font-weight: 600;
}

.texto {
  margin: 0 0 1rem;
  color: var(--color-texto-suave);
  line-height: 1.5;
}

.lista {
  margin: 0;
  padding-left: 1.25rem;
  color: var(--color-texto-apagado);
  line-height: 1.6;
}
</style>
