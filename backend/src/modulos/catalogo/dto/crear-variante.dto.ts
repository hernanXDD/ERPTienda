import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class CrearVarianteDto {
  @EsIdEntidad()
  productoId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  talle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  color?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  codigoBarras?: string;

  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
