import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class ValidarCuponCodigoDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  codigo!: string;

  @IsOptional()
  @EsIdEntidad()
  clienteId?: string | null;
}
