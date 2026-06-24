import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, IsOptional, IsString, MaxLength, Min, ValidateNested } from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class LineaDevolucionDto {
  @EsIdEntidad()
  ventaLineaId!: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  cantidad!: number;
}

export class RegistrarDevolucionDto {
  @EsIdEntidad()
  ventaId!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaDevolucionDto)
  lineas!: LineaDevolucionDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
