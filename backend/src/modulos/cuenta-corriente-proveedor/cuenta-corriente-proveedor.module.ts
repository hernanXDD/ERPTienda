import { Module } from '@nestjs/common';
import { CuentaCorrienteProveedorController } from './cuenta-corriente-proveedor.controller';
import { CuentaCorrienteProveedorService } from './cuenta-corriente-proveedor.service';

@Module({
  controllers: [CuentaCorrienteProveedorController],
  providers: [CuentaCorrienteProveedorService],
  exports: [CuentaCorrienteProveedorService],
})
export class CuentaCorrienteProveedorModule {}
