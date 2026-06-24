import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';
import { PATRON_ID_ENTIDAD } from '../utilidades/id-entidad';

/** Valida parámetros de ruta con formato de ID de entidad (6 dígitos). */
@Injectable()
export class IdEntidadPipe implements PipeTransform<string, string> {
  transform(valor: string): string {
    if (!PATRON_ID_ENTIDAD.test(valor)) {
      throw new BadRequestException('Identificador inválido.');
    }
    return valor;
  }
}
