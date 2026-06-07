import { Type } from 'class-transformer';
import { IsBoolean, IsObject, ValidateNested } from 'class-validator';
import type { MenusVisiblesUsuario, PermisosOperativosUsuario } from '../../../comunes/tipos/permisos-usuario';

class MenusVisiblesDto implements MenusVisiblesUsuario {
  @IsBoolean()
  clientes!: boolean;

  @IsBoolean()
  ventas!: boolean;

  @IsBoolean()
  compras!: boolean;

  @IsBoolean()
  productos!: boolean;

  @IsBoolean()
  stock!: boolean;

  @IsBoolean()
  reportes!: boolean;

  @IsBoolean()
  usuarios!: boolean;

  @IsBoolean()
  configuracion!: boolean;
}

export class ActualizarPermisosUsuarioDto implements PermisosOperativosUsuario {
  @IsBoolean()
  puedeAjustarStock!: boolean;

  @IsBoolean()
  puedeRegistrarCompras!: boolean;

  @IsBoolean()
  puedeGestionarCatalogoProductos!: boolean;

  @IsBoolean()
  puedeGestionarFichasDeUsuario!: boolean;

  @IsBoolean()
  puedeInhabilitarUsuario!: boolean;

  @IsBoolean()
  puedeEliminarUsuario!: boolean;

  @IsBoolean()
  puedeBlanquearContrasenaUsuario!: boolean;

  @ValidateNested()
  @Type(() => MenusVisiblesDto)
  @IsObject()
  menusVisibles!: MenusVisiblesDto;
}
