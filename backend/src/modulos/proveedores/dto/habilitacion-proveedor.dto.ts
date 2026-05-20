import { IsBoolean } from 'class-validator';

export class HabilitacionProveedorDto {
  @IsBoolean()
  habilitado!: boolean;
}
