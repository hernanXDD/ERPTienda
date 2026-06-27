export type TipoTalleCatalogo = 'LETRA' | 'NUMERO' | 'OTRO';

export interface TalleCatalogo {
  id: string;
  codigo: string;
  nombre: string;
  tipo: TipoTalleCatalogo;
  habilitado: boolean;
  orden: number;
}

export interface DatosCrearTalleCatalogo {
  nombre: string;
  tipo?: TipoTalleCatalogo;
  habilitado?: boolean;
}

export interface DatosActualizarTalleCatalogo {
  nombre: string;
  tipo: TipoTalleCatalogo;
  habilitado: boolean;
  orden?: number;
}
