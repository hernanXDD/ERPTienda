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
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { EsIdEntidad } from '../../../comunes/validadores/es-id-entidad.decorator';

export class LineaVentaDto {
  @EsIdEntidad()
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
  @EsIdEntidad()
  clienteId?: string | null;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombreClienteMostrar!: string;

  @IsEnum(FormaPagoVenta)
  formaPago!: FormaPagoVenta;

  @IsOptional()
  @IsNumber()
  ajusteMonto?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  ajustePorcentaje?: number | null;

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

  @IsOptional()
  @IsString()
  @MaxLength(32)
  documentoClienteMostrar?: string;

  @IsOptional()
  @EsIdEntidad()
  cuponDescuentoId?: string | null;
}
