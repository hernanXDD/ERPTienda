import { CondicionCompra } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class LineaCompraDto {
  @IsOptional()
  @EsIdEntidad()
  varianteId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsNumber()
  @Min(0)
  costoUnitario!: number;

  @IsNumber()
  @Min(0)
  subtotal!: number;
}

export class RegistrarCompraDto {
  @EsIdEntidad()
  proveedorId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreProveedorMostrar!: string;

  @IsEnum(CondicionCompra)
  condicionCompra!: CondicionCompra;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaCompraDto)
  lineas!: LineaCompraDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
