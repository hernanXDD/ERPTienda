import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class LineaImportarStockInicialDto {
  @IsOptional()
  @EsIdEntidad()
  productoId?: string;

  @IsString()
  @MaxLength(200)
  nombre!: string;

  @IsString()
  @MaxLength(120)
  marca!: string;

  @EsIdEntidad()
  categoriaId!: string;

  @IsNumber()
  @Min(0)
  precioVenta!: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;

  @IsString()
  @MaxLength(32)
  talle!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  codigoBarras?: string;

  @IsInt()
  @Min(0)
  stock!: number;
}

export class ImportarStockInicialDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaImportarStockInicialDto)
  lineas!: LineaImportarStockInicialDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  observacion?: string;
}
