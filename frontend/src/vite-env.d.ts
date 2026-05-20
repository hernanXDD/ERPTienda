/// <reference types="vite/client" />

declare module '*.eta?raw' {
  const contenido: string;
  export default contenido;
}

interface ImportMetaEnv {
  readonly VITE_USAR_SIMULADOR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
