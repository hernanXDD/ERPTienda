import { Injectable, NotFoundException } from '@nestjs/common';
import { ID_NEGOCIO } from '../../comunes/constantes/id-negocio';
import { PrismaService } from '../../prisma/prisma.service';
import { ActualizarNegocioDto } from './dto/actualizar-negocio.dto';
import { LogoNegocioService } from './logo-negocio.service';

export interface NegocioApi {
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
  tieneLogo: boolean;
  logoVersion: number | null;
  nombreArchivoLogo: string | null;
}

function normalizarRedSocial(valor: string | undefined): string {
  return (valor ?? '').trim().replace(/^@+/, '');
}

@Injectable()
export class NegocioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logoNegocioService: LogoNegocioService,
  ) {}

  private mapear(registro: {
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
  }): Omit<NegocioApi, 'tieneLogo' | 'logoVersion' | 'nombreArchivoLogo'> {
    return {
      id: registro.id,
      nombre: registro.nombre,
      cuit: registro.cuit,
      correoElectronico: registro.correoElectronico,
      telefono: registro.telefono,
      direccion: registro.direccion,
      ciudad: registro.ciudad,
      provincia: registro.provincia,
      codigoPostal: registro.codigoPostal,
      instagram: registro.instagram,
      mostrarInstagram: registro.mostrarInstagram,
      twitter: registro.twitter,
      mostrarTwitter: registro.mostrarTwitter,
      tiktok: registro.tiktok,
      mostrarTiktok: registro.mostrarTiktok,
    };
  }

  async obtener(): Promise<NegocioApi> {
    const registro = await this.prisma.negocio.findUnique({
      where: { id: ID_NEGOCIO },
    });
    if (!registro) {
      throw new NotFoundException('No se encontró la configuración del negocio.');
    }
    return this.combinarConLogo(this.mapear(registro));
  }

  async actualizar(datos: ActualizarNegocioDto): Promise<NegocioApi> {
    const actualizado = await this.prisma.negocio.update({
      where: { id: ID_NEGOCIO },
      data: {
        nombre: datos.nombre.trim(),
        cuit: datos.cuit?.trim() ?? '',
        correoElectronico: datos.correoElectronico?.trim().toLowerCase() ?? '',
        telefono: datos.telefono?.trim() ?? '',
        direccion: datos.direccion?.trim() ?? '',
        ciudad: datos.ciudad?.trim() ?? '',
        provincia: datos.provincia?.trim() ?? '',
        codigoPostal: datos.codigoPostal?.trim() ?? '',
        instagram: normalizarRedSocial(datos.instagram),
        mostrarInstagram: datos.mostrarInstagram ?? false,
        twitter: normalizarRedSocial(datos.twitter),
        mostrarTwitter: datos.mostrarTwitter ?? false,
        tiktok: normalizarRedSocial(datos.tiktok),
        mostrarTiktok: datos.mostrarTiktok ?? false,
      },
    });
    return this.combinarConLogo(this.mapear(actualizado));
  }

  private combinarConLogo(
    datos: Omit<NegocioApi, 'tieneLogo' | 'logoVersion' | 'nombreArchivoLogo'>,
  ): NegocioApi {
    const logo = this.logoNegocioService.obtenerMetadatos();
    return {
      ...datos,
      tieneLogo: logo.tieneLogo,
      logoVersion: logo.version,
      nombreArchivoLogo: logo.nombreArchivo,
    };
  }
}
