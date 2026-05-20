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
  IsUUID,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class LineaCompraDto {
  @IsOptional()
  @IsUUID()
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
  @IsUUID()
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
