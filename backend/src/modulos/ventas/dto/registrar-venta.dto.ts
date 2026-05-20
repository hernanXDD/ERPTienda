import { FormaPagoVenta } from '@prisma/client';
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

export class LineaVentaDto {
  @IsUUID()
  varianteId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nombre!: string;

  @IsInt()
  @Min(1)
  cantidad!: number;

  @IsNumber()
  @Min(0)
  precioUnitario!: number;

  @IsNumber()
  @Min(0)
  subtotal!: number;
}

export class RegistrarVentaDto {
  @IsOptional()
  @IsUUID()
  clienteId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreClienteMostrar!: string;

  @IsEnum(FormaPagoVenta)
  formaPago!: FormaPagoVenta;

  @IsNumber()
  @Min(0)
  total!: number;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => LineaVentaDto)
  lineas!: LineaVentaDto[];

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  observaciones?: string;
}
