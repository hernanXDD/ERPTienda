import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

export class ItemCargarFacturacionDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  numeroVenta!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  facturacion!: string;
}

export class CargarFacturacionesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ItemCargarFacturacionDto)
  items!: ItemCargarFacturacionDto[];
}
