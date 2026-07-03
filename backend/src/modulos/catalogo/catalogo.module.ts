import { Module } from '@nestjs/common';
import { PermisosModule } from '../../comunes/permisos/permisos.module';
import { ConfiguracionSistemaModule } from '../configuracion-sistema/configuracion-sistema.module';
import { CatalogoController } from './catalogo.controller';
import { CatalogoService } from './catalogo.service';

@Module({
  imports: [ConfiguracionSistemaModule, PermisosModule],
  controllers: [CatalogoController],
  providers: [CatalogoService],
  exports: [CatalogoService],
})
export class CatalogoModule {}
