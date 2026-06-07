import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';
import { respuestaError } from '../dto/respuesta-api';

@Catch()
export class ExcepcionHttpFiltro implements ExceptionFilter {
  private readonly logger = new Logger(ExcepcionHttpFiltro.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const respuesta = ctx.getResponse<Response>();

    let estado = HttpStatus.INTERNAL_SERVER_ERROR;
    let mensaje = 'Error interno del servidor.';

    if (exception instanceof HttpException) {
      estado = exception.getStatus();
      const cuerpo = exception.getResponse();
      if (typeof cuerpo === 'string') {
        mensaje = cuerpo;
      } else if (typeof cuerpo === 'object' && cuerpo !== null && 'message' in cuerpo) {
        const msg = (cuerpo as { message?: string | string[] }).message;
        mensaje = Array.isArray(msg) ? msg.join('. ') : (msg ?? mensaje);
      }
    } else if (exception instanceof Error) {
      this.logger.error(exception.message, exception.stack);
    }

    respuesta.status(estado).json(respuestaError(mensaje));
  }
}
