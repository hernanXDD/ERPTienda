import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validarVariablesEntorno } from './config/validar-entorno';
import { AppController } from './app.controller';
import { AutenticacionModule } from './modulos/autenticacion/autenticacion.module';
import { CatalogoModule } from './modulos/catalogo/catalogo.module';
import { CategoriasModule } from './modulos/categorias/categorias.module';
import { ClientesModule } from './modulos/clientes/clientes.module';
import { ComprasModule } from './modulos/compras/compras.module';
import { CuentaCorrienteModule } from './modulos/cuenta-corriente/cuenta-corriente.module';
import { ConfiguracionSistemaModule } from './modulos/configuracion-sistema/configuracion-sistema.module';
import { NegocioModule } from './modulos/negocio/negocio.module';
import { ProveedoresModule } from './modulos/proveedores/proveedores.module';
import { StockModule } from './modulos/stock/stock.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';
import { VentasModule } from './modulos/ventas/ventas.module';
import { PrismaModule } from './prisma/prisma.module';
import { PermisosModule } from './comunes/permisos/permisos.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
      validate: validarVariablesEntorno,
    }),
    PrismaModule,
    PermisosModule,
    AutenticacionModule,
    CategoriasModule,
    CatalogoModule,
    ClientesModule,
    CuentaCorrienteModule,
    ProveedoresModule,
    StockModule,
    ComprasModule,
    VentasModule,
    UsuariosModule,
    NegocioModule,
    ConfiguracionSistemaModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
