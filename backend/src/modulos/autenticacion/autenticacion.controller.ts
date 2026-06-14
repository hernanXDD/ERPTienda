import { Body, Controller, Get, HttpCode, HttpStatus, Patch, Post, UseGuards } from '@nestjs/common';
import { LimiteIntentosLoginGuard } from '../../comunes/guards/limite-intentos-login.guard';
import { JwtAuthGuard } from '../../comunes/guards/jwt-auth.guard';
import { UsuarioSesionActual } from '../../comunes/decoradores/usuario-sesion.decorator';
import type { UsuarioSesion } from '../../comunes/tipos/usuario-sesion';
import { AutenticacionService } from './autenticacion.service';
import { ActualizarPreferenciasAparienciaDto } from './dto/actualizar-preferencias-apariencia.dto';
import { CambioContrasenaInicialDto } from './dto/cambio-contrasena-inicial.dto';
import { InicioSesionDto } from './dto/inicio-sesion.dto';

@Controller('autenticacion')
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Post('inicio-sesion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(LimiteIntentosLoginGuard)
  iniciarSesion(@Body() datos: InicioSesionDto) {
    return this.autenticacionService.iniciarSesion(datos);
  }

  @Get('sesion-actual')
  @UseGuards(JwtAuthGuard)
  async sesionActual(@UsuarioSesionActual() usuario: UsuarioSesion) {
    return this.autenticacionService.obtenerSesionActual(usuario);
  }

  @Post('cierre-sesion')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  cerrarSesion() {
    return this.autenticacionService.cerrarSesion();
  }

  @Post('cambio-contrasena-inicial')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  cambiarContrasenaInicial(
    @UsuarioSesionActual() usuario: UsuarioSesion,
    @Body() datos: CambioContrasenaInicialDto,
  ) {
    return this.autenticacionService.cambiarContrasenaInicial(usuario, datos.contrasenaNueva);
  }

  @Patch('preferencias-apariencia')
  @UseGuards(JwtAuthGuard)
  actualizarPreferenciasApariencia(
    @UsuarioSesionActual() usuario: UsuarioSesion,
    @Body() datos: ActualizarPreferenciasAparienciaDto,
  ) {
    return this.autenticacionService.actualizarPreferenciasApariencia(
      usuario,
      datos.modoOscuroHabilitado,
    );
  }
}
