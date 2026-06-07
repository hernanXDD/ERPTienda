import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class EntradaManualDto {
  @EsIdEntidad()
  varianteId!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  nota?: string;
}
