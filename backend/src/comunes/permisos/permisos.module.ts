import { Global, Module } from '@nestjs/common';
import { PermisosGuard } from '../guards/permisos.guard';
import { PermisosUsuarioService } from './permisos-usuario.service';

@Global()
@Module({
  providers: [PermisosUsuarioService, PermisosGuard],
  exports: [PermisosUsuarioService, PermisosGuard],
})
export class PermisosModule {}
