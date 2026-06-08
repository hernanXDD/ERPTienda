/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API en producción (ej. https://vps-6055529-x.dattaweb.com/api). Vacío = proxy /api en dev. */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

declare module '*.eta?raw' {
  const contenido: string;
  export default contenido;
}
