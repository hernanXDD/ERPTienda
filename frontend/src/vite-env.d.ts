/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USAR_SIMULADOR: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
