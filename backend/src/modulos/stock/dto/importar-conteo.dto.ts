import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class LineaImportarConteoDto {
  @EsIdEntidad()
  varianteId!: string;

  @IsInt()
  @Min(0)
  cantidadFisicaContada!: number;
}

export class ImportarConteoDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaImportarConteoDto)
  lineas!: LineaImportarConteoDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
