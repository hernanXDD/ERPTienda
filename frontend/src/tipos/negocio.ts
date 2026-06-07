export interface Negocio {
  id: string;
  nombre: string;
  cuit: string;
  correoElectronico: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  provincia: string;
  codigoPostal: string;
  instagram: string;
  mostrarInstagram: boolean;
  twitter: string;
  mostrarTwitter: boolean;
  tiktok: string;
  mostrarTiktok: boolean;
}

export type DatosNegocioEditable = Omit<Negocio, 'id'>;
