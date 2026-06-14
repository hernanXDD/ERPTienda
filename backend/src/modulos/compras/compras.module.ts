import { Module } from '@nestjs/common';
import { CatalogoModule } from '../catalogo/catalogo.module';
import { CuentaCorrienteProveedorModule } from '../cuenta-corriente-proveedor/cuenta-corriente-proveedor.module';
import { StockModule } from '../stock/stock.module';
import { ComprasController } from './compras.controller';
import { ComprasService } from './compras.service';

@Module({
  imports: [StockModule, CatalogoModule, CuentaCorrienteProveedorModule],
  controllers: [ComprasController],
  providers: [ComprasService],
})
export class ComprasModule {}
