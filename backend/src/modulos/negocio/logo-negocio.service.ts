import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  createReadStream,
  existsSync,
  mkdirSync,
  readdirSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { extname, resolve } from 'node:path';
import type { ReadStream } from 'node:fs';
import { obtenerCarpetaLogo } from '../../config/carpeta-logo.config';

const PREFIJO_NOMBRE_LOGO = 'logo';
const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;

const MIME_PERMITIDOS = new Map<string, string>([
  ['image/png', '.png'],
  ['image/jpeg', '.jpg'],
  ['image/webp', '.webp'],
  ['image/svg+xml', '.svg'],
]);

const EXTENSIONES_PERMITIDAS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.svg']);

export interface MetadatosLogoNegocio {
  tieneLogo: boolean;
  version: number | null;
  nombreArchivo: string | null;
}

export interface LogoNegocioArchivo {
  ruta: string;
  tipoMime: string;
  flujo: ReadStream;
}

@Injectable()
export class LogoNegocioService {
  obtenerTamanoMaximoBytes(): number {
    return TAMANO_MAXIMO_BYTES;
  }

  asegurarCarpeta(): void {
    const carpeta = obtenerCarpetaLogo();
    if (!existsSync(carpeta)) {
      mkdirSync(carpeta, { recursive: true });
    }
  }

  validarArchivoSubido(archivo: Express.Multer.File | undefined): Express.Multer.File {
    if (!archivo) {
      throw new BadRequestException('Debe enviar un archivo de imagen en el campo «archivo».');
    }
    if (archivo.size > TAMANO_MAXIMO_BYTES) {
      throw new BadRequestException('El logo no puede superar 2 MB.');
    }
    const extension = MIME_PERMITIDOS.get(archivo.mimetype);
    if (!extension) {
      throw new BadRequestException(
        'Formato no permitido. Use PNG, JPG, WEBP o SVG.',
      );
    }
    return archivo;
  }

  obtenerMetadatos(): MetadatosLogoNegocio {
    const ruta = this.obtenerRutaLogoExistente();
    if (!ruta) {
      return { tieneLogo: false, version: null, nombreArchivo: null };
    }
    const nombreArchivo = ruta.split(/[/\\]/).pop() ?? null;
    return {
      tieneLogo: true,
      version: statSync(ruta).mtimeMs,
      nombreArchivo,
    };
  }

  obtenerRutaLogoExistente(): string | null {
    this.asegurarCarpeta();
    const carpeta = obtenerCarpetaLogo();
    const archivos = readdirSync(carpeta).filter(
      (nombre) => nombre !== '.gitkeep' && nombre !== '.gitignore',
    );

    if (archivos.length === 0) return null;

    const candidato = archivos.find((nombre) => {
      const extension = extname(nombre).toLowerCase();
      return EXTENSIONES_PERMITIDAS.has(extension);
    });

    if (!candidato) return null;
    return resolve(carpeta, candidato);
  }

  obtenerArchivoParaDescarga(): LogoNegocioArchivo {
    const ruta = this.obtenerRutaLogoExistente();
    if (!ruta) {
      throw new NotFoundException('No hay logo cargado para el negocio.');
    }

    const extension = extname(ruta).toLowerCase();
    const tipoMime =
      [...MIME_PERMITIDOS.entries()].find(([, ext]) => ext === extension)?.[0] ??
      'application/octet-stream';

    return {
      ruta,
      tipoMime,
      flujo: createReadStream(ruta),
    };
  }

  guardarLogo(archivo: Express.Multer.File): MetadatosLogoNegocio {
    const validado = this.validarArchivoSubido(archivo);
    const extension = MIME_PERMITIDOS.get(validado.mimetype)!;

    this.eliminarLogosExistentes();

    this.asegurarCarpeta();
    const nombre = `${PREFIJO_NOMBRE_LOGO}${extension}`;
    const ruta = resolve(obtenerCarpetaLogo(), nombre);
    writeFileSync(ruta, validado.buffer);

    return this.obtenerMetadatos();
  }

  eliminarLogo(): MetadatosLogoNegocio {
    const ruta = this.obtenerRutaLogoExistente();
    if (!ruta) {
      throw new NotFoundException('No hay logo para eliminar.');
    }
    this.eliminarLogosExistentes();
    return this.obtenerMetadatos();
  }

  private eliminarLogosExistentes(): void {
    this.asegurarCarpeta();
    const carpeta = obtenerCarpetaLogo();
    for (const nombre of readdirSync(carpeta)) {
      if (nombre === '.gitkeep' || nombre === '.gitignore') continue;
      unlinkSync(resolve(carpeta, nombre));
    }
  }
}
