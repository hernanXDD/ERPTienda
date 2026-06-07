import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class AjusteConteoDto {
  @EsIdEntidad()
  varianteId!: string;

  @IsInt()
  @Min(0)
  cantidadFisicaContada!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
