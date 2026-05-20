import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AutenticacionModule } from './modulos/autenticacion/autenticacion.module';
import { CatalogoModule } from './modulos/catalogo/catalogo.module';
import { CategoriasModule } from './modulos/categorias/categorias.module';
import { ClientesModule } from './modulos/clientes/clientes.module';
import { ComprasModule } from './modulos/compras/compras.module';
import { CuentaCorrienteModule } from './modulos/cuenta-corriente/cuenta-corriente.module';
import { ProveedoresModule } from './modulos/proveedores/proveedores.module';
import { StockModule } from './modulos/stock/stock.module';
import { UsuariosModule } from './modulos/usuarios/usuarios.module';
import { VentasModule } from './modulos/ventas/ventas.module';
import { PrismaModule } from './prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env'],
    }),
    PrismaModule,
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
  ],
  controllers: [AppController],
})
export class AppModule {}
