import { createApp } from 'vue';
import { createPinia } from 'pinia';
import App from './App.vue';
import router from './router';
import { registrarManejadorRespuesta401 } from './servicios/http';
import { useSesionStore } from './stores/sesion';
import './estilos/tema.css';
import './estilos/paginaGestion.css';
import './estilos/desplazamientoPantalla.css';

const app = createApp(App);
const pinia = createPinia();
app.use(pinia);
app.use(router);

registrarManejadorRespuesta401(() => {
  const sesion = useSesionStore();
  void sesion.cerrarSesion().then(() => {
    if (router.currentRoute.value.name !== 'inicio-sesion') {
      void router.push({ name: 'inicio-sesion', query: { siguiente: router.currentRoute.value.fullPath } });
    }
  });
});

app.mount('#app');
